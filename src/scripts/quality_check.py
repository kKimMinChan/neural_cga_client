import numpy as np
import cv2
import os
import glob
import sys

# -------------------- 사용 예시 --------------------
# python3 quality_check.py /path/to/images camera_matrix.npy dist_coeffs.npy
# ---------------------------------------------------

def load_images(image_paths):
    images = []
    for path in image_paths:
        img = cv2.imread(path)
        if img is not None:
            images.append((path, img))
    return images

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

def draw_reprojected_points(images, objpoints, imgpoints, rvecs, tvecs, mtx, dist, pattern_size):
    os.makedirs("reprojected", exist_ok=True)
    for i, (path, img) in enumerate(images):
        imgpoints2, _ = cv2.projectPoints(objpoints[i], rvecs[i], tvecs[i], mtx, dist)
        for p in imgpoints2:
            cv2.circle(img, tuple(np.int32(p[0])), 5, (0, 255, 0), -1)  # green: reprojected
        for p in imgpoints[i]:
            cv2.circle(img, tuple(np.int32(p[0])), 3, (0, 0, 255), 1)  # red: original
        save_path = os.path.join("reprojected", os.path.basename(path))
        cv2.imwrite(save_path, img)

def undistort_and_save(images, mtx, dist):
    os.makedirs("undistorted", exist_ok=True)
    for path, img in images:
        h, w = img.shape[:2]
        newcameramtx, _ = cv2.getOptimalNewCameraMatrix(mtx, dist, (w, h), 1)
        dst = cv2.undistort(img, mtx, dist, None, newcameramtx)
        save_path = os.path.join("undistorted", os.path.basename(path))
        cv2.imwrite(save_path, dst)

def main():
    if len(sys.argv) < 4:
        print("사용법: python3 quality_check.py [이미지 폴더 경로] [camera_matrix.npy] [dist_coeffs.npy]")
        return

    image_dir = sys.argv[1]
    mtx = np.load(sys.argv[2])
    dist = np.load(sys.argv[3])

    print(mtx, dist)

    # 체커보드 내부 코너 개수
    pattern_size = (11, 8)
    square_size = 1.0  # 상대값

    objp = np.zeros((pattern_size[0]*pattern_size[1], 3), np.float32)
    objp[:, :2] = np.mgrid[0:pattern_size[0], 0:pattern_size[1]].T.reshape(-1, 2) * square_size

    objpoints = []
    imgpoints = []
    image_paths = sorted(glob.glob(os.path.join(image_dir, "*.bmp")))
    images = load_images(image_paths)

    valid_images = []

    for path, img in images:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        ret, corners = cv2.findChessboardCorners(gray, pattern_size, None)
        if ret:
            objpoints.append(objp)
            corners2 = cv2.cornerSubPix(gray, corners, (11,11), (-1,-1),
                                        criteria=(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001))
            imgpoints.append(corners2)
            valid_images.append((path, img))

    if not objpoints:
        print("⚠️ 코너를 검출한 이미지가 없습니다.")
        return

    _, _, _, rvecs, tvecs = cv2.calibrateCamera(
        objpoints, imgpoints, gray.shape[::-1], mtx, dist, flags=cv2.CALIB_USE_INTRINSIC_GUESS
    )

    mean_error, per_image_errors = compute_reprojection_error(objpoints, imgpoints, rvecs, tvecs, mtx, dist)
    print(f"\n🎯 평균 리프로젝션 에러: {mean_error:.4f} 픽셀")

    print("\n📸 각 이미지별 리프로젝션 에러:")
    for i, err in enumerate(per_image_errors):
        fname = os.path.basename(valid_images[i][0])
        print(f"  - {fname}: {err:.4f} 픽셀")


    print('왜 값이 다름?', mtx, dist)

    # draw_reprojected_points(valid_images, objpoints, imgpoints, rvecs, tvecs, mtx, dist, pattern_size)
    # undistort_and_save(valid_images, mtx, dist)
    print("✅ 'reprojected' 폴더와 'undistorted' 폴더에 이미지 저장 완료")

if __name__ == "__main__":
    main()
