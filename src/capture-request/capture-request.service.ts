import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as unzipper from 'unzipper';
import * as fs from 'fs';
import * as path from 'path';
import {
  CaptureRequestStatus,
  CreateCaptureRequestInput,
} from './capture-request.schema';
import { CaptureRequestRepository } from './capture-request.repository';
import * as os from 'os';
import { IntrinsicCaptureService } from 'src/intrinsic-capture/intrinsic-capture.service';
import { ErrorHelper } from 'src/common/ErrorHelper';

function getDesktopPath() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return path.join(home, 'Desktop');
  }
  // macOS, Linux
  return path.join(home, 'Desktop');
}

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

@Injectable()
export class CaptureRequestService {
  constructor(
    private httpService: HttpService,
    private captureRequestRepository: CaptureRequestRepository,
    private intrinsicCaptureService: IntrinsicCaptureService,
  ) {}

  async downloadAndExtractZip(
    streamPath: string,
    ip: string,
    count: number,
    captureRequestId: number,
    topGuardId: number,
  ) {
    try {
      const folder = `topGuard_list/${topGuardId}/capture_images`;

      const destinationDir = path.join(getDesktopPath(), folder);
      const zipUrl = `http://${ip}:5000/capture?count=${count}&streamPath=${streamPath}`;
      console.log('zipUrl', zipUrl);
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
      }

      // 1. 압축 해제 전 파일 목록
      const beforeFiles = new Set(getAllFiles(destinationDir));

      // Step 1: ZIP 요청 (바이너리로)
      const response$ = this.httpService.get(zipUrl, {
        responseType: 'stream',
      });

      void this.captureRequestRepository.updateStatus(
        captureRequestId,
        CaptureRequestStatus.Processing,
      );

      console.log('zipUrl 요청 시작');
      const response = await lastValueFrom(response$);
      console.log('zipUrl 응답 도착');

      // Step 2: 스트림을 unzipper에 파이프
      await new Promise<void>((resolve, reject) => {
        response.data
          .pipe(unzipper.Extract({ path: destinationDir }))
          .on('close', () => {
            console.log(`✅ 압축 해제 완료 → ${destinationDir}`);
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ 압축 해제 실패:', err);
            reject(err instanceof Error ? err : new Error(String(err)));
          });
      });

      // 2. 압축 해제 후 파일 목록
      const afterFiles = new Set(getAllFiles(destinationDir));

      // 3. 새로 생긴 파일만 추출
      const newFiles = Array.from(afterFiles).filter(
        (f) => !beforeFiles.has(f),
      );
      console.log('이번에 압축 해제된 파일:', newFiles, destinationDir);

      for (const file of newFiles) {
        // const imagePath = path.join(folder, path.basename(file));
        const imagePath = path.basename(file);
        await this.intrinsicCaptureService.create({
          captureRequestId,
          imagePath: imagePath,
        });
      }

      void this.captureRequestRepository.updateStatus(
        captureRequestId,
        CaptureRequestStatus.Completed,
      );
    } catch (error) {
      console.error('downloadAndExtractZip 에러:', error);
      void this.captureRequestRepository.updateStatus(
        captureRequestId,
        CaptureRequestStatus.Failed,
        error instanceof Error ? error.message : String(error),
      );
      // ErrorHelper.handle(error);

      //fire-and-forget(비동기 void 호출) 함수에서 throw가 발생하면,
      //NestJS가 이를 잡지 못해 서버가 죽을 수 있습니다.
      //이런 함수에서는 에러를 로깅만 하고 throw하지 않는 것이 안전합니다.
    }
  }

  async create(createCaptureRequestDto: CreateCaptureRequestInput) {
    try {
      const captureRequest =
        await this.captureRequestRepository.createCaptureRequest(
          createCaptureRequestDto,
        );
      return captureRequest;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findCaptureRequestByTopGuardId(topGuardId: number) {
    try {
      const captureRequest =
        await this.captureRequestRepository.findCaptureRequestByTopGuardId(
          topGuardId,
        );
      return captureRequest;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findOne(id: number) {
    try {
      const captureRequest =
        await this.captureRequestRepository.findCaptureRequestById(id);
      return captureRequest;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  update(id: number, updateCaptureRequestDto: any) {
    return `This action updates a #${id} captureRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} captureRequest`;
  }
}
