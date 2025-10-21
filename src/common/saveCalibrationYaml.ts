// saveCalibrationYaml.ts
import * as fs from 'fs';
import * as path from 'path';
import { CalibrationResult } from 'src/intrinsic-capture/intrinsic-capture.schema';

/**
 * YAML을 생성해서 저장하고, 파일 경로를 반환합니다.
 * camera_matrix, dist_coeffs만 CalibrationResult 값으로 반영합니다.
 */
export function saveCalibrationYaml(
  calib: CalibrationResult,
  topGuardId: number | string,
  intrinsicRequestId: number | string,
): string {
  const base = process.env.IMAGE_SAVE_PATH;
  if (!base) throw new Error('IMAGE_SAVE_PATH env not set');

  const dir = path.join(
    base,
    String(topGuardId),
    'result_images',
    String(intrinsicRequestId),
  );
  fs.mkdirSync(dir, { recursive: true });

  // 3x3, 1xN을 플랫으로 변환
  const mat = calib.cameraMatrix.flat();
  const distAll = calib.distCoeffs.flat();

  // 예시 YAML은 k1,k2,p1,p2,k3 (5개) 형식이므로, 길면 5개만 사용
  // (필요 시 distAll 그대로 쓰게 바꿔도 됨)
  const dist = distAll.slice(0, 5);

  // 보기 좋게 소수 6자리로 포맷
  const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(6) : '0.000000');

  if (mat.length !== 9) {
    throw new Error(`cameraMatrix must be 3x3, got length ${mat.length}`);
  }

  // 멀티라인 브래킷 스타일로 예시 YAML과 동일하게 출력
  const cameraMatrixYaml =
    `[${fmt(mat[0])}, ${fmt(mat[1])}, ${fmt(mat[2])},\n` +
    `                    ${fmt(mat[3])}, ${fmt(mat[4])}, ${fmt(mat[5])},\n` +
    `                    ${fmt(mat[6])}, ${fmt(mat[7])}, ${fmt(mat[8])}]`;

  const distCoeffsYaml = `[${dist.map(fmt).join(', ')}]`;

  // ⚠️ 요청대로 camera_matrix / dist_coeffs만 받은 데이터로 수정.
  // 나머지(common, calib)는 예시 그대로 둡니다.
  // (data_num을 usedImageCount로 맞추고 싶다면 29 대신 calib.usedImageCount로 바꿔도 됩니다)
  const yaml = `# Data path. adjust them!
common:
    image_path:  "/home/fboesungmoon/Desktop/calib_dataset/multi_scene_calibration/image"
    pcd_path:  "/home/fboesungmoon/Desktop/calib_dataset/multi_scene_calibration/pcd"
    result_path:  "/home/fboesungmoon/Desktop/calib_dataset/extrinsic.txt"
    data_num: 29
# Camera Parameters. Adjust them!
camera:
    camera_matrix: ${cameraMatrixYaml}
    dist_coeffs: ${distCoeffsYaml}

# Calibration Parameters.!
calib:
    calib_config_file: "/home/fboesungmoon/catkin_ws/src/livox_camera_calib/config/config_outdoor.yaml"
    use_rough_calib: false # set true if your initial_extrinsic is bad
`;

  const outPath = path.join(dir, 'multi_calib.yaml');
  fs.writeFileSync(outPath, yaml, 'utf8');
  return outPath;
}
