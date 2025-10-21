import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getDesktopPath } from 'src/common/getDesktopPath';
import {
  CreateExtrinsicCaptureRequestInput,
  UpdateExtrinsicCaptureRequestInput,
} from './extrinsic-capture-request.schema';
import { ExtrinsicCaptureRequestRepository } from './extrinsic-capture-request.repository';
import { RequestStatus } from 'src/common/type/request-status';
import { extractAndList } from 'src/common/extractAndList';
import { ExtrinsicCapturePairService } from 'src/extrinsic-capture-pair/extrinsic-capture-pair.service';

// type Meta = {
//   count?: number;
//   per_seconds?: number;
//   rtsp?: string;
//   captured_at?: string;
//   image_present?: boolean;
//   format?: { pcd?: string; image?: string };
//   qc?: {
//     bands?: Array<any>;
//     global_verdict?: 'STATIC' | 'MOTION' | 'UNKNOWN';
//   };
// };

@Injectable()
export class ExtrinsicCaptureRequestService {
  constructor(
    private readonly extrinsicCaptureRequestRepository: ExtrinsicCaptureRequestRepository,
    private readonly extrinsicCapturePairService: ExtrinsicCapturePairService,
  ) {}

  private readonly http: AxiosInstance = axios.create({
    responseType: 'stream',
    validateStatus: () => true,
  });

  getTopGuardBase(topGuardBaseUrl?: string) {
    const base = topGuardBaseUrl || process.env.TOP_GUARD_URL;
    if (!base)
      throw new InternalServerErrorException(
        `Top Guard URL not configured for key: ${base}`,
      );
    return base;
  }

  buildPath(mode: 'short' | 'long') {
    return mode === 'short' ? '/lidar' : '/ext_data';
  }

  async requestZipStream(
    base: string,
    mode: 'short' | 'long',
  ): Promise<AxiosResponse<any>> {
    const url = `${base}${this.buildPath(mode)}`;
    return this.http.post(url, null);
  }

  /**
   * 제트슨에서 ZIP 스트림을 받아 서버의 destRoot에 풀어 저장.
   * 반환: 저장 폴더, 파일 목록, meta.json 내용(있으면)
   */
  async captureAndSaveToDisk(params: {
    topGuardBaseUrl: string;
    topGuardId: number;
    extrinsicCaptureRequestId: number;
    mode: 'short' | 'long';
  }) {
    try {
      const { topGuardBaseUrl, mode, topGuardId, extrinsicCaptureRequestId } =
        params;

      const folder = `top_guard_list/${topGuardId}/extrinsic_capture_pairs`;
      const base = this.getTopGuardBase(topGuardBaseUrl);

      console.log(base, 'base', 'folder', folder);

      const destinationDir = path.join(getDesktopPath(), folder);

      await fs.mkdir(destinationDir, { recursive: true });
      await this.updateExtrinsicCaptureRequest({
        id: extrinsicCaptureRequestId,
        status: RequestStatus.Processing,
      });
      const resp = await this.requestZipStream(base, mode);

      if (resp.status !== 200) {
        // 에러 바디를 읽어서 메시지에 포함(최대 4KB)
        const chunks: Buffer[] = [];
        for await (const c of resp.data) chunks.push(c as Buffer);
        const errBody = Buffer.concat(chunks).toString('utf8').slice(0, 4096);
        await this.updateExtrinsicCaptureRequest({
          id: extrinsicCaptureRequestId,
          status: RequestStatus.Failed,
          errorMessage: errBody,
        });
        throw new InternalServerErrorException(
          `Upstream ${resp.status}: ${errBody || 'no body'}`,
        );
      }

      // 스트리밍으로 바로 unzip (메모리 적게)
      // await pipeline(resp.data, unzipper.Extract({ path: destinationDir }));
      // console.log();
      const names = await extractAndList(resp.data, destinationDir);
      console.log('saved files:', names);

      // 메타파일 탐색 (.json / _meta.json 모두 대응)
      // const metaName =
      //   names.find((n) => n.endsWith('_meta.json')) ??
      //   names.find((n) => n.endsWith('.meta.json')) ??
      //   names.find((n) => n.endsWith('.json')); // 최후 fallback

      // if (!metaName) {
      //   // 메타가 없으면 저장 스킵
      //   await this.updateExtrinsicCaptureRequest({
      //     id: extrinsicCaptureRequestId,
      //     status: RequestStatus.Skipped, // 필요 시 다른 상태
      //   });
      //   return;
      // }

      // 메타 파싱
      // const metaPath = path.join(destinationDir, metaName);
      // let meta: any = null;
      // try {
      //   const raw = await fs.readFile(metaPath, 'utf8');
      //   meta = JSON.parse(raw);
      //   console.log('meta', meta);
      // } catch (e) {
      //   console.warn('[capture] meta.json parse error:', e);
      //   await this.updateExtrinsicCaptureRequest({
      //     id: extrinsicCaptureRequestId,
      //     status: RequestStatus.Skipped, // 파싱 실패도 스킵
      //   });
      //   return;
      // }

      // STATIC만 통과
      // if (meta?.qc?.global_verdict !== 'STATIC') {
      //   console.log(
      //     '[capture] non-STATIC verdict, skip saving:',
      //     meta?.qc?.global_verdict,
      //   );

      //   // (선택) 파일 정리: 방치 원치 않으면 삭제
      //   // await Promise.allSettled(
      //   //   names.map(n => fs.unlink(path.join(destinationDir, n)))
      //   // );

      //   await this.updateExtrinsicCaptureRequest({
      //     id: extrinsicCaptureRequestId,
      //     status: RequestStatus.Skipped, // 또는 RequestStatus.CompletedButRejected 등
      //     errorMessage: meta,
      //   });
      //   return;
      // }

      await this.extrinsicCapturePairService.createExtrinsicCapturePair({
        extrinsicCaptureRequestId,
        pcdName: names.find((name) => name.endsWith('.pcd')) || '',
        bmpName: names.find((name) => name.endsWith('.bmp')) || '',
      });
      await this.updateExtrinsicCaptureRequest({
        id: extrinsicCaptureRequestId,
        status: RequestStatus.Completed,
      });
    } catch (error) {
      await this.updateExtrinsicCaptureRequest({
        id: params.extrinsicCaptureRequestId,
        status: RequestStatus.Failed,
        errorMessage: String(error),
      });
    }
  }

  async createExtrinsicCaptureRequest(
    data: CreateExtrinsicCaptureRequestInput,
  ) {
    return this.extrinsicCaptureRequestRepository.createExtrinsicCaptureRequest(
      data,
    );
  }

  async updateExtrinsicCaptureRequest(
    data: UpdateExtrinsicCaptureRequestInput,
  ) {
    return this.extrinsicCaptureRequestRepository.updateExtrinsicCaptureRequest(
      data,
    );
  }

  async getExtrinsicCaptureRequest(id: number) {
    return this.extrinsicCaptureRequestRepository.getExtrinsicCaptureRequest(
      id,
    );
  }

  async getLatestExtrinsicCaptureRequest(topGuardId: number) {
    return this.extrinsicCaptureRequestRepository.getLatestExtrinsicCaptureRequest(
      topGuardId,
    );
  }
}
