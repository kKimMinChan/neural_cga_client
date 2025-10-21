import * as os from 'os';
import * as path from 'path';

export function getDesktopPath() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return path.join(home, 'Desktop');
  }
  // macOS, Linux
  return path.join(home, 'Desktop');
}
