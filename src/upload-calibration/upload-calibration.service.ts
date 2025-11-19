import {
  BadRequestException,
  Body,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateUploadRequest,
  CreateUploadRequestSchema,
  CreateUploadRequestDto,
} from './upload-calibration.schema';
import axios from 'axios';
import { ZodResponse } from 'nestjs-zod';
import { ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { IntrinsicOutputRepository } from 'src/intrinsic-output/intrinsic-output.repository';
import { IntrinsicRequestService } from 'src/intrinsic-request/intrinsic-request.service';
import {
  IntrinsicManifestFormat,
  IntrinsicManifestInput,
  IntrinsicManifestItemInput,
  IntrinsicManifestKind,
  IntrinsicValueInput,
} from 'src/intrinsic-output/intrinsic-output.schema';
import { IntrinsicCaptureService } from 'src/intrinsic-capture/intrinsic-capture.service';
import { ulid } from 'ulid';
import { AuthService } from 'src/auth/auth.service';
import { ErrorHelper } from 'src/common/ErrorHelper';
import { UploadCalibrationRepository } from './upload-calibration.repository';
import { Outbox, OutboxStatus } from 'src/sync/sync.schema';
import { sha256File } from 'src/common/calibration.hash';

@ApiExtraModels(CreateUploadRequestDto)
@Injectable()
export class UploadCalibrationService {
  constructor(
    private readonly intrinsicOutputRepository: IntrinsicOutputRepository,
    private readonly intrinsicRequestService: IntrinsicRequestService,
    private readonly intrinsicCaptureService: IntrinsicCaptureService,
    private readonly authService: AuthService,
    private readonly uploadCalibrationRepository: UploadCalibrationRepository,
  ) {}

  async createUploadRequest(body: CreateUploadRequest) {
    const loginLog = await this.authService.latestLoginLog();
    const exists =
      await this.intrinsicOutputRepository.existsIntrinsicRequestId(
        body.intrinsicRequestId,
      );

    if (!exists) throw new NotFoundException('Intrinsic request not found');

    const output =
      await this.intrinsicOutputRepository.findOneByIntrinsicRequestId(
        body.intrinsicRequestId,
      );

    if (!output?.cameraMatrix || !output.distCoeffs) {
      throw new BadRequestException('Intrinsic output not found');
    }

    const selections =
      await this.intrinsicRequestService.findIntrinsicSelections(
        body.intrinsicRequestId,
      );
    const files: IntrinsicManifestItemInput[] = await Promise.all(
      selections.map(async (s) => {
        const cap = await this.intrinsicCaptureService.findOne(
          s.intrinsicCaptureId,
        );
        if (!cap) throw new NotFoundException('INTRINSIC_CAPTURE_NOT_FOUND');

        return {
          clientFileId: cap.id,
          name: cap.fileName,
          kind: IntrinsicManifestKind.Image,
          format: IntrinsicManifestFormat.BMP, // fmt
        };
      }),
    );

    const manifest: IntrinsicManifestInput = { files };

    const intrinsicValue: IntrinsicValueInput = {
      intrinsicOutputRid: output.rid,
      cameraMatrix: JSON.parse(output.cameraMatrix),
      distCoeffs: JSON.parse(output.distCoeffs),
    };

    const payload = {
      manifest,
      intrinsicValue,
      type: body.type,
      topGuardRid: body.topGuardRid,
      idempotencyKey: body.idempotencyKey,
      createdBy: loginLog.userId,
    };

    console.log('payload', payload);

    // return {
    //   data: {
    //     data: payload,
    //   },
    // };

    const uploadRequest = await this.postUploadCalibration({
      accessToken: loginLog.accessToken ?? '',
      payload,
      idem: body.idempotencyKey,
      companyId: loginLog.companyId ?? undefined,
    });

    return { data: uploadRequest.data };
  }

  async postUploadCalibration({
    accessToken,
    payload,
    idem, // 멱등키 넣는 걸 권장
    companyId,
  }: {
    accessToken: string;
    payload: any;
    idem?: string;
    companyId?: number;
  }) {
    try {
      const res = await axios.post(
        `${process.env.CENTRAL_SERVER_URL}/upload-calibration/requests`,
        payload,
        {
          timeout: 10000, // 타임아웃 권장
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...(idem ? { 'Idempotency-Key': idem } : {}),
          },
        },
      );

      if (res.data.result === true && res.data.data[0].duplicate === false) {
        console.log('res.data.data[0]', res.data.data[0]);
        for (const id of res.data.data[0].manifest.clientFileIds) {
          const capture = await this.intrinsicCaptureService.findOne(id);
          const captureRequest =
            await this.intrinsicCaptureService.findOneCaptureRequestByCaptureId(
              capture.captureRequestId,
            );
          const topGuard = await this.intrinsicRequestService.findTopGuardByRid(
            captureRequest.topGuardRid,
          );
          const name = capture.fileName;
          const path = `${process.env.IMAGE_SAVE_PATH}/${capture.filePath}/${capture.fileName}`;
          const sha256 = await sha256File(path);
          console.log('sha256', sha256);
          console.log('path', path);

          await this.uploadCalibrationRepository.createOutbox({
            opId: ulid(),
            entity: 'intrinsic-capture',
            rid: res.data.data[0].requestId, // 서버 쪽 requestId
            patch: JSON.stringify({
              name,
              sha256,
              path,
              topGuardRid: topGuard.rid,
              projectRid: topGuard.projectRid,
              companyId,
            }),
            preconds: JSON.stringify({}),
            updatedAt: new Date().toISOString(),
            status: OutboxStatus.Pending,
            retryCount: 0,
          });
        }
      } else if (
        res.data.result === true &&
        res.data.data[0].duplicate === true
      ) {
        const outboxes =
          await this.uploadCalibrationRepository.findAllPendingOutboxByEntityAndRid(
            'intrinsic-capture',
            res.data.data[0].requestId,
          );
        const missingIds = res.data.data[0].progress.missingIds;
        for (const id of missingIds) {
          const outbox = outboxes.find((o) => o.patch === JSON.stringify(id));
          if (!outbox) {
            const capture = await this.intrinsicCaptureService.findOne(id);
            const captureRequest =
              await this.intrinsicCaptureService.findOneCaptureRequestByCaptureId(
                capture.captureRequestId,
              );
            const topGuard =
              await this.intrinsicRequestService.findTopGuardByRid(
                captureRequest.topGuardRid,
              );
            const name = capture.fileName;
            const path = `${process.env.IMAGE_SAVE_PATH}/${capture.filePath}/${capture.fileName}`;
            const sha256 = await sha256File(path);

            console.log('name', name);
            console.log('path', path);
            console.log('sha256', sha256);

            // const topGuardRid = captureRequest.topGuardRid;
            await this.uploadCalibrationRepository.createOutbox({
              opId: ulid(),
              entity: 'intrinsic-capture',
              rid: res.data.data[0].requestId,
              patch: JSON.stringify({
                name,
                sha256,
                path,
                topGuardRid: topGuard.rid,
                projectRid: topGuard.projectRid,
                companyId,
              }),
              preconds: JSON.stringify({}),
              updatedAt: new Date().toISOString(),
              status: OutboxStatus.Pending,
              retryCount: 0,
            });
          }
        }
      }
      return res;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // 1) 서버가 응답을 준 경우
        if (err.response) {
          const { status, data } = err.response;
          // 민감정보 마스킹한 최소 로그
          console.warn('[central-server error]', {
            status,
            code: data?.code,
            message: data?.message ?? err.message,
          });
          console.log('data', data);
        }
      }
      console.log('err', err);

      // AxiosError가 아니면 그대로
      ErrorHelper.handle(err);
    }
  }

  async getProgress(requestId: string) {
    try {
      const url = `${process.env.CENTRAL_SERVER_URL}/upload-calibration/requests/${requestId}/progress`;
      const loginLog = await this.authService.latestLoginLog();
      const accessToken = loginLog.accessToken ?? '';
      const res = await axios.get(url, {
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return res;
    } catch (err) {
      ErrorHelper.handle(err);
    }
  }
}
