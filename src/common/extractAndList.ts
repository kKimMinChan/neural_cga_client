import { pipeline } from 'stream/promises';
import * as unzipper from 'unzipper';
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Zip-slip 방지용: 목적 경로 밖으로 나가지 않게 고정 */
function safeJoin(base: string, rel: string) {
  const p = path.normalize(path.join(base, rel));
  const baseNorm = path.normalize(base + path.sep);
  if (!p.startsWith(baseNorm)) throw new Error(`unsafe path: ${rel}`);
  return p;
}

/** resp.data(Readble) → destinationDir로 풀고, 저장된 파일 상대경로 배열 반환 */
export async function extractAndList(
  readable: NodeJS.ReadableStream,
  destinationDir: string,
) {
  const saved: string[] = [];
  const tasks: Promise<any>[] = [];

  await new Promise<void>((resolve, reject) => {
    readable
      .pipe(unzipper.Parse())
      .on('entry', (entry: unzipper.Entry) => {
        const rel = entry.path.replace(/\\/g, '/'); // 경로 normalize
        const dest = safeJoin(destinationDir, rel);

        if (entry.type === 'Directory') {
          tasks.push(fs.promises.mkdir(dest, { recursive: true }));
          entry.autodrain();
        } else {
          tasks.push(
            (async () => {
              await fs.promises.mkdir(path.dirname(dest), { recursive: true });
              saved.push(rel); // ← 저장될 파일 이름 수집
              await pipeline(entry, fs.createWriteStream(dest));
            })(),
          );
        }
      })
      .on('close', async () => {
        try {
          await Promise.all(tasks);
          resolve();
        } catch (e) {
          reject(e as Error);
        }
      })
      .on('error', (e) => reject(e as Error));
  });

  return saved; // 예: ["a/b/c.txt", "img/1.png", ...]
}
