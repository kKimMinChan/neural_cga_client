#!/usr/bin/env python3
import argparse, re
from pathlib import Path
import numpy as np
import open3d as o3d

# ---------- IO / parsing ----------
def load_points_and_intensity(pcd_path: str):
    """
    좌표는 Open3D로 읽고, intensity는 ASCII PCD일 때만 간단 파싱(있으면 반환).
    """
    pcd = o3d.io.read_point_cloud(pcd_path, remove_nan_points=True, remove_infinite_points=True)
    pts = np.asarray(pcd.points, dtype=np.float64)
    inten = None

    # 헤더 일부만 읽어 ASCII 여부 판단
    try:
        head = Path(pcd_path).read_bytes()[:4096].decode("ascii", errors="ignore")
    except Exception:
        head = ""
    if "DATA ascii" in head and "FIELDS" in head:
        m = re.search(r"^FIELDS\s+(.+)$", head, re.MULTILINE)
        if m:
            fields = m.group(1).split()
            if "intensity" in fields:
                idx = fields.index("intensity")
                # 본문만 파싱
                lines = Path(pcd_path).read_text(errors="ignore").splitlines()
                start = next(i for i,l in enumerate(lines) if l.startswith("DATA ascii")) + 1
                if start < len(lines):
                    data = np.loadtxt(lines[start:], dtype=np.float64, ndmin=2)
                    if data.shape[1] > idx:
                        inten = data[:, idx]
    return pts, inten

# ---------- heuristics ----------
def auto_params_for_nonrepetitive(pts: np.ndarray, short_capture_hint: bool):
    """
    Livox Avia 비반복 스캔용 자동 파라미터 추정.
    - range(중앙값)에 비례하여 voxel/임계값을 잡는다.
    - 짧은 적분(점수 적음)이면 조금 더 큰 voxel을 써서 강건하게.
    """
    if len(pts) == 0:
        # 기본값(아무 것도 없으면)
        return {"voxel": 0.02, "max_corr": 0.10, "plane_dist": 0.01}

    r_med = float(np.median(np.linalg.norm(pts, axis=1)))
    # 거리의 1%를 기본 voxel로, 5~30mm 범위에서 클램프
    # 짧은 캡처(0.3s 등)는 1.5%로 살짝 키움
    ratio = 0.015 if short_capture_hint or len(pts) < 150_000 else 0.01
    voxel = np.clip(ratio * r_med, 0.005, 0.03)

    # ICP 최대 대응 거리: voxel의 5배(권장 범위 3~8배)
    max_corr = 5.0 * voxel
    # 평면 RANSAC 거리 임계값: voxel의 2배(권장 1.5~3배)
    plane_dist = 2.0 * voxel

    return {"voxel": float(voxel), "max_corr": float(max_corr), "plane_dist": float(plane_dist)}

# ---------- quality metrics ----------
def motion_check_icp(pts: np.ndarray, voxel=0.01, max_corr=0.05):
    n = len(pts)
    if n < 5000:
        return {"ok": False, "reason": "too few points (<5k)"}
    a = pts[: int(n*0.4)]
    b = pts[int(n*0.6) :]

    pa = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(a))
    pb = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(b))

    pa = pa.voxel_down_sample(voxel)
    pb = pb.voxel_down_sample(voxel)
    pa.estimate_normals(o3d.geometry.KDTreeSearchParamKNN(knn=20))
    pb.estimate_normals(o3d.geometry.KDTreeSearchParamKNN(knn=20))

    reg = o3d.pipelines.registration.registration_icp(
        pb, pa, max_corr,
        np.eye(4),
        o3d.pipelines.registration.TransformationEstimationPointToPlane(),
        o3d.pipelines.registration.ICPConvergenceCriteria(max_iteration=50),
    )
    T = reg.transformation
    R = T[:3,:3]; t = T[:3,3]
    angle = float(np.degrees(np.arccos(np.clip((np.trace(R)-1)/2, -1, 1))))
    trans = float(np.linalg.norm(t) * 1000.0)  # mm
    return {"ok": True, "rot_deg": angle, "trans_mm": trans, "fitness": float(reg.fitness), "rmse": float(reg.inlier_rmse)}

def plane_quality(pts: np.ndarray, dist_thresh=0.005):
    pcd = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(pts))
    model, inliers = pcd.segment_plane(distance_threshold=dist_thresh, ransac_n=3, num_iterations=1000)
    inliers = np.array(inliers)
    inlier_ratio = float(inliers.size / max(1, pts.shape[0]))
    a,b,c,d = model
    xyz = pts
    dist = np.abs(a*xyz[:,0] + b*xyz[:,1] + c*xyz[:,2] + d) / np.sqrt(a*a+b*b+c*c)
    return {
        "plane_normal": [float(a), float(b), float(c)],
        "inlier_ratio": inlier_ratio,
        "mean_dist_mm": float(np.mean(dist[inliers]) * 1000.0) if inliers.size else float("nan"),
        "p95_dist_mm":  float(np.percentile(dist[inliers], 95) * 1000.0) if inliers.size else float("nan"),
    }

def noise_density(pts: np.ndarray):
    pcd = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(pts))
    _, ind = pcd.remove_statistical_outlier(nb_neighbors=20, std_ratio=2.0)
    keep_ratio = float(len(ind) / max(1, len(pts)))
    aabb = pcd.get_axis_aligned_bounding_box()
    vol = float(np.prod(aabb.get_extent()))
    dens = float(len(pts) / max(vol, 1e-9))
    return {"keep_ratio": keep_ratio, "density_pts_per_m3": dens}

# ---------- main ----------
def main():
    ap = argparse.ArgumentParser(description="PCD 품질체크 (Livox Avia 비반복 스캔 기준)")
    ap.add_argument("pcd", help="입력 PCD 경로")
    ap.add_argument("--expect-plane", action="store_true", help="평면 타깃이 있다고 가정하고 평면 품질을 평가")
    ap.add_argument("--short-capture", action="store_true", help="짧은 적분(예: 0.3s) 힌트로 voxel을 크게 잡음")
    ap.add_argument("--voxel", type=float, default=None, help="ICP 다운샘플(voxel 크기, m). 지정 시 자동튜닝 무시")
    ap.add_argument("--max-corr", type=float, default=None, help="ICP 최대 대응 거리(m). 지정 시 자동튜닝 무시")
    ap.add_argument("--plane-dist", type=float, default=None, help="평면 RANSAC 거리 임계값(m). 지정 시 자동튜닝 무시")
    ap.add_argument("--print-params", dest="print_params", action="store_true", help="적용된 파라미터를 출력")
    args = ap.parse_args()

    pts, inten = load_points_and_intensity(args.pcd)
    print(f"[file] {args.pcd}")
    print(f"[points] {len(pts)}")

    # 자동 파라미터(비반복 스캔 가정)
    auto = auto_params_for_nonrepetitive(pts, args.short_capture)
    voxel = args.voxel if args.voxel is not None else auto["voxel"]
    max_corr = args.max_corr if args.max_corr is not None else auto["max_corr"]
    plane_dist = args.plane_dist if args.plane_dist is not None else auto["plane_dist"]
    if args.print_params:
        print(f"[params] voxel={voxel:.4f} m, max_corr={max_corr:.4f} m, plane_dist={plane_dist:.4f} m")

    # 통계
    q_noise = noise_density(pts)
    print(f"[noise] SOR keep_ratio={q_noise['keep_ratio']:.3f}, density={q_noise['density_pts_per_m3']:.1f} pts/m^3")

    q_motion = motion_check_icp(pts, voxel=voxel, max_corr=max_corr)
    if q_motion["ok"]:
        print(f"[motion] rot={q_motion['rot_deg']:.3f}°, trans={q_motion['trans_mm']:.2f} mm, fitness={q_motion['fitness']:.3f}, rmse={q_motion['rmse']:.4f}")
    else:
        print(f"[motion] {q_motion['reason']}")

    if args.expect_plane:
        q_plane = plane_quality(pts, dist_thresh=plane_dist)
        print(f"[plane] inlier={q_plane['inlier_ratio']:.3f}, mean={q_plane['mean_dist_mm']:.2f} mm, p95={q_plane['p95_dist_mm']:.2f} mm, normal={q_plane['plane_normal']}")

    # 간단한 판정(임계값은 현장에 맞게 조정)
    verdict = "OK"
    if q_motion.get("ok") and (q_motion["rot_deg"] > 0.5 or q_motion["trans_mm"] > 5.0):
        verdict = "MOTION_SUSPECT"
    if args.expect_plane:
        # plane이 있으면 plane 기준도 반영
        q_plane = plane_quality(pts, dist_thresh=plane_dist)
        if (q_plane["inlier_ratio"] < 0.4) or (q_plane["p95_dist_mm"] > 10.0):
            verdict = "PLANE_POOR"
    if q_noise["keep_ratio"] < 0.7:
        verdict = "NOISY"
    print(f"[verdict] {verdict}")

if __name__ == "__main__":
    main()
