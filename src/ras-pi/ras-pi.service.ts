import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Client } from 'ssh2';
import * as ping from 'ping';
import { TopGuardService } from 'src/top-guard/top-guard.service';

const execAsync = promisify(exec);

@Injectable()
export class RasPiService {
  constructor(private readonly topGuardService: TopGuardService) {}
  async getRasPiInfoViaSSH(host: string, username: string, password: string) {
    return new Promise<{ ip?: string; mac?: string; webrtcUrl?: string }>(
      (resolve, reject) => {
        const conn = new Client();
        conn
          .on('ready', () => {
            const cmd = `
                set -e
                IF=$(ip -o -4 route show to default 2>/dev/null | awk '{print $5; exit}')
                if [ -z "$IF" ]; then
                  for i in /sys/class/net/*; do n=$(basename "$i");
                    case "$n" in lo|docker*|veth*|br*|virbr*|l4tbr*|vmnet*|tailscale*|zt*) continue;; esac
                    [ "$(cat "$i/type" 2>/dev/null)" = "1" ] || continue
                    [ "$(cat "$i/operstate" 2>/dev/null)" = "up" ] || continue
                    IF="$n"; break
                  done
                fi
                IP=$(ip -4 -o addr show dev "$IF" 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | head -n1)
                MAC=$(cat /sys/class/net/"$IF"/address 2>/dev/null || echo unknown)
                HOST=$(hostname)
                printf "%s\\n%s\\n%s\\n%s\\n" "$IP" "$MAC" "$HOST" "$IF"
                `;
            // 1. ip, mac, hostname 추출
            conn.exec(
              cmd,
              // 'hostname -I && (cat /sys/class/net/eth0/address 2>/dev/null || cat /sys/class/net/wlan0/address) && hostname',
              (err, stream) => {
                if (err) {
                  conn.end();
                  return reject(new Error(err.message));
                }
                let data = '';
                stream
                  .on('close', async () => {
                    const [ipLine, mac, hostname] = data.trim().split('\n');
                    const ip = host;
                    // const ip = ipLine
                    //   .split(' ')
                    //   .find((ip) => ip.startsWith('192.168.0')); // 원하는 대역
                    // 2. mediamtx 프로세스 확인 및 webrtc 주소 추출 시도
                    // console.log(ipLine);
                    let webrtcUrl: string | undefined = undefined;
                    try {
                      // mediamtx 프로세스가 실행 중인지 확인
                      const procRes = await new Promise<string>((res) => {
                        conn.exec(
                          'ps aux | grep mediamtx | grep -v grep',
                          (e, s) => {
                            let d = '';
                            s.on('close', () => res(d)).on('data', (chunk) => {
                              d += chunk;
                            });
                          },
                        );
                      });
                      if (procRes && procRes.includes('mediamtx')) {
                        // 설정 파일 여러 경로 시도
                        const procLines = procRes.trim().split('\n');
                        let execDir = '';
                        if (procLines.length === 1) {
                          // 한 줄이면 그대로 사용
                          const procParts = procLines[0].trim().split(/\s+/);
                          const execPath = procParts[procParts.length - 1];
                          execDir = execPath.includes('/')
                            ? execPath.substring(0, execPath.lastIndexOf('/'))
                            : '';
                        } else {
                          // 여러 줄이면 실행 파일 이름이 정확히 'mediamtx'로 끝나는 경로만 사용
                          const mediamtxLine = procLines.find(
                            (line) =>
                              line.includes('mediamtx') &&
                              line.trim().endsWith('mediamtx'),
                          );
                          if (mediamtxLine) {
                            const procParts = mediamtxLine.trim().split(/\s+/);
                            const execPath = procParts[procParts.length - 1];
                            execDir = execPath.includes('/')
                              ? execPath.substring(0, execPath.lastIndexOf('/'))
                              : '';
                          }
                        }
                        const configPaths = [
                          execDir + '/mediamtx.yml',
                          '/home/fboe/Desktop/ffmpeg/mediamtx.yml',
                        ];

                        console.log('configPaths', configPaths, ip);

                        let configContent = '';
                        for (const path of configPaths) {
                          try {
                            configContent = await new Promise<string>((res) => {
                              conn.exec(`cat ${path}`, (e, s) => {
                                let d = '';
                                s.on('close', () => res(d)).on(
                                  'data',
                                  (chunk) => {
                                    d += chunk.toString('utf8');
                                  },
                                );
                              });
                            });
                            // console.log('configContent', configContent);
                            if (
                              configContent &&
                              configContent.includes('paths:')
                            )
                              break;
                          } catch {
                            /* ignore file not found */
                          }
                        }
                        // streamname 추출 (paths: 아래 첫 번째 키, 라인 파싱 방식)
                        const streamname = extractStreamName(configContent, ip);
                        // webrtcServer.listenAddress 추출
                        const webrtcPort = '8889'; // 기본값
                        // const portMatch = configContent.match(
                        //   /webrtcAddress:\s*:(\d+)/,
                        // );
                        // if (portMatch) {
                        //   webrtcPort = portMatch[1];
                        // }

                        // 프로토콜 추출 (SSL 설정이 있으면 https, 없으면 http)
                        const protocol = 'http';

                        // if (
                        //   /webrtcServer:\s*\n(?:.*\n)*?\s*(certFile|keyFile|tls):/i.test(
                        //     configContent,
                        //   )
                        // ) {
                        //   protocol = 'https';
                        // }

                        if (ip && streamname) {
                          webrtcUrl = `${protocol}://${ip.trim()}:${webrtcPort}/${streamname}`;
                        }
                      }
                    } catch (error) {
                      console.log('error', error);
                      /* ignore mediamtx check error */
                    }
                    conn.end();
                    resolve({
                      ip: ip?.trim(),
                      mac: mac?.trim(),
                      webrtcUrl: webrtcUrl || undefined,
                    });
                  })
                  .on('data', (chunk) => {
                    data += chunk;
                  })
                  .stderr.on('data', (chunk) => {
                    // 에러 출력
                  });
              },
            );
          })
          .on('error', reject)
          .connect({
            host,
            port: 22,
            username,
            password,
            readyTimeout: 1000,
          });
      },
    );
  }

  async scanNetwork(
    base = '192.168.0.',
    start = 1,
    end = 254,
  ): Promise<string[]> {
    const promises: Promise<string | null>[] = [];
    for (let i = start; i <= end; i++) {
      const ip = `${base}${i}`;

      promises.push(
        ping.promise
          .probe(ip, { timeout: 1 })
          .then((res) => (res.alive ? ip : null))
          .catch(() => null) as Promise<string | null>, // 에러 발생 시 null 반환
      );
    }
    const results = await Promise.all(promises);
    // console.log(results);
    return results.filter(Boolean) as string[]; // 살아있는 IP만 반환
  }

  /**
   * 네트워크 스캔 후 각 ip에 SSH로 접속해 ip, mac 주소를 얻는 함수
   * @param base 네트워크 대역 (예: '192.168.0.')
   * @param start 시작 IP (예: 1)
   * @param end 끝 IP (예: 254)
   * @returns ip, mac 정보가 담긴 배열
   */
  async getAllRasPiInfoViaSSH(
    username = 'fboe',
    password = 'fboe',
  ): Promise<{ ip: string; mac: string; webRtcUrl?: string }[]> {
    // console.time('scanNetwork');
    const ipList = await this.scanNetwork();
    // console.log(ipList);
    // console.timeEnd('scanNetwork');
    const results: { ip: string; mac: string; webRtcUrl?: string }[] = [];
    // console.time('allSSH');
    await Promise.all(
      ipList.map(async (ip) => {
        // console.time(`ssh-${ip}`);
        try {
          const info = await this.getRasPiInfoViaSSH(ip, username, password);
          console.log('info', info, ip);
          if (info.ip && info.mac) {
            results.push({
              ip: info.ip,
              mac: info.mac,
              webRtcUrl: info.webrtcUrl,
            });
          }
        } catch (error) {
          // console.log('error', error);
        } finally {
          // console.timeEnd(`ssh-${ip}`);
        }
      }),
    );
    // console.timeEnd('allSSH');
    return results;
  }

  async getTopGuardMac(mac: string, topGuardRid: string) {
    const topGuards = await this.getAllRasPiInfoViaSSH();
    const topGuard = topGuards.find((topGuard) => topGuard.mac === mac);
    if (topGuard && topGuard?.webRtcUrl) {
      return await this.topGuardService.update({
        rid: topGuardRid,
        webRtcUrl: topGuard.webRtcUrl,
      });
    }
    return null;
  }
}

// streamname 추출 (paths: 아래 첫 번째 키, 라인 파싱 방식)
function extractStreamName(
  configContent: string,
  ip: string | undefined,
): string | undefined {
  const lines = configContent.split('\n');
  let inPaths = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    // console.log('line', JSON.stringify(line), 'ip', ip);
    if (!inPaths) {
      if (line.trim() === 'paths:') {
        inPaths = true;
      }
      continue;
    }

    console.log('line', line, ip);

    // paths: 이후
    if (line.trim() === '' || line.trim().startsWith('#')) {
      continue; // 빈 줄, 주석 건너뛰기
    }
    if (/^ {2}[\w-]+:/.test(line)) {
      // 스페이스 2번 + streamname:
      return line.trim().replace(':', '');
    }
    // 들여쓰기 2칸이 아니면 다음 줄로
    if (!/^ {2}/.test(line)) {
      continue;
    }
  }
  return undefined;
}
