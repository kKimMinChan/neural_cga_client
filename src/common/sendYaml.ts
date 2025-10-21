import * as fs from 'fs';
import * as path from 'path';
import * as SftpClientLib from 'ssh2-sftp-client';

/**
 * ${IMAGE_SAVE_PATH}/${topGuardId}/result_images/${intrinsicRequestId}/config_intrinsics.yaml
 *  →  fboesungmoon@<host>:/home/fboesungmoon/catkin_ws/src/livox_camera_calib/config/
 */
export async function sendYaml(
  topGuardId: number | string,
  intrinsicRequestId: number | string,
): Promise<string> {
  const base = process.env.IMAGE_SAVE_PATH;
  if (!base) throw new Error('IMAGE_SAVE_PATH env not set');

  const localDir = path.join(
    base,
    String(topGuardId),
    'result_images',
    String(intrinsicRequestId),
  );
  const fileName = 'multi_calib.yaml';
  const localPath = path.join(localDir, fileName);

  if (!fs.existsSync(localPath)) {
    throw new Error(`YAML not found: ${localPath}`);
  }

  // 원격 접속 정보 (env 우선, 없으면 기본값/질문에서 준 비번)
  const host = process.env.REMOTE_HOST || '192.168.0.17';
  const username = process.env.REMOTE_USER || 'fboesungmoon';
  const password = process.env.REMOTE_SSH_PASSWORD ?? 'qnahwk12';
  const remoteDir =
    '/home/fboesungmoon/catkin_ws/src/livox_camera_calib/config';
  const remotePath = path.posix.join(remoteDir, fileName);

  const SftpClientCtor: any =
    (SftpClientLib as any).default ?? (SftpClientLib as any);
  const sftp = new SftpClientCtor();
  try {
    await sftp.connect({
      host,
      port: 22,
      username,
      password,
      readyTimeout: 20000,
    });
    if (!(await sftp.exists(remoteDir))) {
      await sftp.mkdir(remoteDir, true);
    }
    await sftp.fastPut(localPath, remotePath);
    return remotePath;
  } finally {
    try {
      await sftp.end();
    } catch {
      /* noop */
    }
  }
}
