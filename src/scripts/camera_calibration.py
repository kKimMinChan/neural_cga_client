import cv2
import numpy as np
import sys
import os
from pathlib import Path
import json
import argparse

# 체커보드 내부 코너 기본값 (가로, 세로)
DEFAULT_CHECKERBOARD = (11, 8)
SQUARE_SIZE_X = 34  # mm
SQUARE_SIZE_Y = 33  # mm

# 월드 좌표계의 3D 포인트 준비 (Z=0)
# objp = np.zeros((CHECKERBOARD[0]*CHECKERBOARD[1], 3), np.float32)
# objp[:, 0] = np.tile(np.arange(CHECKERBOARD[0]), CHECKERBOARD[1]) * SQUARE_SIZE_X
# objp[:, 1] = np.repeat(np.arange(CHECKERBOARD[1]), CHECKERBOARD[0]) * SQUARE_SIZE_Y

objpoints = []  # 3D 점
imgpoints = []  # 2D 점
images = []
paths = []
result_images = []

parser = argparse.ArgumentParser()
parser.add_argument('--image-paths', nargs='+', required=True)
parser.add_argument('--save-path', required=True)
parser.add_argument('--board-cols', type=int, help='체커보드 가로 칸 수 (정사각형 기준)')
parser.add_argument('--board-rows', type=int, help='체커보드 세로 칸 수 (정사각형 기준)')
parser.add_argument('--input-type', choices=['squares', 'corners'], default='squares',
                    help='전달 값의 기준: squares(정사각형 수) | corners(내부 코너 수)')
args = parser.parse_args()

p_cols = args.board_cols
p_rows = args.board_rows

# 인자로 패턴이 들어오면 내부 코너 수로 변환
if p_cols is not None and p_rows is not None:
    if args.input_type == 'squares':
        CHECKERBOARD = (max(p_cols - 1, 2), max(p_rows - 1, 2))
    else:
        CHECKERBOARD = (p_cols, p_rows)
else:
    CHECKERBOARD = DEFAULT_CHECKERBOARD

# 월드 좌표계의 3D 포인트 준비 (Z=0)
objp = np.zeros((CHECKERBOARD[0]*CHECKERBOARD[1], 3), np.float32)
objp[:, 0] = np.tile(np.arange(CHECKERBOARD[0]), CHECKERBOARD[1]) * SQUARE_SIZE_X
objp[:, 1] = np.repeat(np.arange(CHECKERBOARD[1]), CHECKERBOARD[0]) * SQUARE_SIZE_Y

pairs = list(zip(args.image_paths[::2], args.image_paths[1::2]))

save_path = args.save_path

os.makedirs(save_path, exist_ok=True)

result_dir = save_path

if not pairs:
    print("❌ 이미지 경로를 인자로 전달해야 합니다.")
    sys.exit(1)

for pair in pairs:
    path = Path(pair[0])
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
        result_images.append({
            "id": pair[1],
            "path": save_file_path
        })
        cv2.imwrite(save_file_path, img_with_corners)

        print(f"✅ 체커보드 감지 성공: {path.name}")
    else:
        print(f"❌ 체커보드 감지 실패: {path.name}")

if len(objpoints) < 3:
    CalibrationResult = {
        "resultImageInfos": result_images
    }
    print(json.dumps(CalibrationResult, ensure_ascii=False, indent=2))
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
    "perImageReprojectionError": dict(zip(paths, [float(f"{e:.4f}") for e in per_image_errors])),
    "resultImageInfos": result_images
}
print(json.dumps(CalibrationResult, ensure_ascii=False, indent=2))
