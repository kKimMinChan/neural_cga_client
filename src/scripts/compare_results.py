import cv2
import os
import glob
import numpy as np

def stack_images(img1, img2, label1="Reprojected", label2="Undistorted"):
    h1, w1 = img1.shape[:2]
    h2, w2 = img2.shape[:2]
    h = max(h1, h2)
    canvas = np.zeros((h, w1 + w2, 3), dtype=np.uint8)

    canvas[:h1, :w1] = img1
    canvas[:h2, w1:w1 + w2] = img2

    # 글자 표시
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(canvas, label1, (10, 30), font, 1, (0, 255, 255), 2)
    cv2.putText(canvas, label2, (w1 + 10, 30), font, 1, (0, 255, 255), 2)
    return canvas

def main():
    reprojected_dir = "reprojected"
    undistorted_dir = "undistorted"
    output_dir = "comparison"
    os.makedirs(output_dir, exist_ok=True)

    reprojected_imgs = sorted(glob.glob(os.path.join(reprojected_dir, "*.bmp")))

    for path in reprojected_imgs:
        filename = os.path.basename(path)
        reproj_img = cv2.imread(os.path.join(reprojected_dir, filename))
        undist_img = cv2.imread(os.path.join(undistorted_dir, filename))

        if reproj_img is None or undist_img is None:
            print(f"⚠️ 이미지 누락: {filename}")
            continue

        combined = stack_images(reproj_img, undist_img)
        cv2.imwrite(os.path.join(output_dir, filename), combined)

    print("✅ 'comparison' 폴더에 비교 이미지 저장 완료.")

if __name__ == "__main__":
    main()
