import cv2
import numpy as np
import os
import glob
# python3 src/scripts/result_images.py
# 체커보드 설정
CHECKERBOARD = (11, 8)  # 코너 수 (정사각형 수 - 1)

# 체커보드의 각 칸 크기(mm 단위) – 행님이 알려준 34 x 33 mm 사용
square_size = 34  # 가로 세로 평균을 써도 무방

objp = np.zeros((CHECKERBOARD[0]*CHECKERBOARD[1], 3), np.float32)
objp[:, :2] = np.mgrid[0:CHECKERBOARD[0], 0:CHECKERBOARD[1]].T.reshape(-1, 2)
objp *= square_size

objpoints = []  # 3D 좌표
imgpoints = []  # 2D 이미지 좌표

# 입력 이미지 폴더 경로
input_dir = '/Users/kimminchan/Desktop/topGuardImage'
output_dir = '/Users/kimminchan/Desktop/calibration_debug'
os.makedirs(output_dir, exist_ok=True)

images = glob.glob(os.path.join(input_dir, '*.bmp'))

for fname in images:
    img = cv2.imread(fname)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 코너 찾기
    ret, corners = cv2.findChessboardCorners(gray, CHECKERBOARD, None)

    if ret:
        objpoints.append(objp)
        corners2 = cv2.cornerSubPix(gray, corners, (11,11), (-1,-1), 
                                    criteria=(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001))
        imgpoints.append(corners2)

        # 코너 그리기
        img_with_corners = cv2.drawChessboardCorners(img.copy(), CHECKERBOARD, corners2, ret)
        save_path = os.path.join(output_dir, f'detected_{os.path.basename(fname)}')
        cv2.imwrite(save_path, img_with_corners)
        print(f'✅ 코너 시각화 저장: {save_path}')
    else:
        print(f'❌ 코너 검출 실패: {fname}')

# 캘리브레이션
ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, gray.shape[::-1], None, None)
print("🎯 내부 파라미터 (Camera Matrix):\n", mtx)
print("🔧 왜곡 계수 (Distortion Coefficients):\n", dist.ravel())

