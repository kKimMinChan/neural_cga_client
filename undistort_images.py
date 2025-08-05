import cv2
import numpy as np
import os
import sys
import glob

def undistort_images(image_paths, camera_matrix, dist_coeffs, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for img_path in image_paths:
        img = cv2.imread(img_path)
        if img is None:
            print(f"❌ 이미지 읽기 실패: {img_path}")
            continue

        h, w = img.shape[:2]
        new_camera_mtx, _ = cv2.getOptimalNewCameraMatrix(camera_matrix, dist_coeffs, (w,h), 1, (w,h))

        undistorted_img = cv2.undistort(img, camera_matrix, dist_coeffs, None, new_camera_mtx)

        filename = os.path.basename(img_path)
        output_path = os.path.join(output_dir, f"undistorted_{filename}")
        cv2.imwrite(output_path, undistorted_img)
        print(f"✅ 보정 이미지 저장: {output_path}")

# 🛠️ 사용 예
if __name__ == "__main__":
    image_paths = sys.argv[1:-1]
    output_dir = sys.argv[-1]

    # 🎯 행님이 구한 파라미터 값 입력
    camera_matrix = np.array([
        [826.65855129, 0.0, 957.89064187],
        [0.0, 828.71708594, 536.04160811],
        [0.0, 0.0, 1.0]
    ])
    dist_coeffs = np.array([-0.0523909302, 0.108926476, 0.000027283993, -0.00102310222, -0.0622453933])

    undistort_images(image_paths, camera_matrix, dist_coeffs, output_dir)
