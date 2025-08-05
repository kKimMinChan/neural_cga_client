import cv2
import numpy as np
import sys
import os
from pathlib import Path
import json
import argparse

# 체커보드 내부 코너 개수 (가로 방향 11, 세로 방향 8)
CHECKERBOARD = (11, 8)
SQUARE_SIZE_X = 34  # mm
SQUARE_SIZE_Y = 33  # mm

# 월드 좌표계의 3D 포인트 준비 (Z=0)
objp = np.zeros((CHECKERBOARD[0]*CHECKERBOARD[1], 3), np.float32)
objp[:, 0] = np.tile(np.arange(CHECKERBOARD[0]), CHECKERBOARD[1]) * SQUARE_SIZE_X
objp[:, 1] = np.repeat(np.arange(CHECKERBOARD[1]), CHECKERBOARD[0]) * SQUARE_SIZE_Y

objpoints = []  # 3D 점
imgpoints = []  # 2D 점
images = []
paths = []

parser = argparse.ArgumentParser()
parser.add_argument('--image-paths', nargs='+', required=True)
parser.add_argument('--save-path', required=True)
args = parser.parse_args()

image_paths = args.image_paths
save_path = args.save_path

os.makedirs(save_path, exist_ok=True)

result_dir = save_path

if not image_paths:
    print("❌ 이미지 경로를 인자로 전달해야 합니다.")
    sys.exit(1)

for path_str in image_paths:
    path = Path(path_str)
    img = cv2.imread(str(path))

    if img is None:
        print(f"⚠️ 이미지를 열 수 없습니다: {path}")
        continue

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    ret, corners = cv2.findChessboardCorners(gray, CHECKERBOARD, None)

    if ret:
        objpoints.append(objp)
        corners2 = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1),
                                    criteria=(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001))
        imgpoints.append(corners2)
        images.append(img)
        paths.append(path.name)

        img_with_corners = cv2.drawChessboardCorners(img.copy(), CHECKERBOARD, corners2, ret)
        save_file_path = os.path.join(result_dir, f'detected_{path.name}')
        cv2.imwrite(save_file_path, img_with_corners)

        print(f"✅ 체커보드 감지 성공: {path.name}")
    else:
        print(f"❌ 체커보드 감지 실패: {path.name}")

if len(objpoints) < 3:
    print("❗ 최소 3장 이상의 유효한 체커보드 이미지가 필요합니다.")
    sys.exit(1)

ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, gray.shape[::-1], None, None)

# print("\n🎯 내부 파라미터 행렬 (Camera Matrix):")
# print(mtx)

# print("\n🔧 왜곡 계수 (Distortion Coefficients):")
# print(dist.ravel())

# print("\n✅ 캘리브레이션 완료. 사용한 이미지 수:", len(objpoints))

def compute_reprojection_error(objpoints, imgpoints, rvecs, tvecs, mtx, dist):
    total_error = 0
    per_image_errors = []
    for i in range(len(objpoints)):
        imgpoints2, _ = cv2.projectPoints(objpoints[i], rvecs[i], tvecs[i], mtx, dist)
        error = cv2.norm(imgpoints[i], imgpoints2, cv2.NORM_L2) / len(imgpoints2)
        total_error += error
        per_image_errors.append(error)
    mean_error = total_error / len(objpoints)
    return mean_error, per_image_errors

mean_error, per_image_errors = compute_reprojection_error(objpoints, imgpoints, rvecs, tvecs, mtx, dist)

# print(f"\n🎯 평균 리프로젝션 에러: {mean_error:.4f} 픽셀")

# for i, error in enumerate(per_image_errors):
#     print(f"  - {paths[i]}: {error:.4f} 픽셀")


# np.save("src/scripts/camera_matrix.npy", mtx)
# np.save("src/scripts/dist_coeffs.npy", dist)

CalibrationResult = {
    "cameraMatrix": mtx.tolist(),
    "distCoeffs": dist.tolist(),
    "usedImageCount": len(objpoints),
    "meanReprojectionError": mean_error,
    "perImageReprojectionError": dict(zip(paths, [float(f"{e:.4f}") for e in per_image_errors]))
}
print(json.dumps(CalibrationResult, ensure_ascii=False, indent=2))