import {
  BadRequestException,
  Injectable,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  CalibrationResult,
  IntrinsicSelections,
} from './intrinsic-request.schema';
import { promisify } from 'util';
import { exec } from 'child_process';
const execAsync = promisify(exec);
import { ErrorHelper } from 'src/common/ErrorHelper';
import { IntrinsicCaptureService } from 'src/intrinsic-capture/intrinsic-capture.service';
import * as path from 'path';
import { IntrinsicRequestRepository } from './intrinsic-request.repository';
import { IntrinsicOutputService } from 'src/intrinsic-output/intrinsic-output.service';
import { RequestStatus } from 'src/common/type/request-status';
import { StageEnum } from 'src/top-guard/top-guard.schema';
import { TopGuardService } from 'src/top-guard/top-guard.service';
import { saveCalibrationYaml } from 'src/common/saveCalibrationYaml';

@Injectable()
export class IntrinsicRequestService {
  constructor(
    private readonly intrinsicCaptureService: IntrinsicCaptureService,
    private readonly intrinsicRequestRepository: IntrinsicRequestRepository,
    @Inject(forwardRef(() => IntrinsicOutputService))
    private readonly intrinsicResultService: IntrinsicOutputService,
    private readonly topGuardService: TopGuardService,
  ) {}

  async createIntrinsicRequest(body: IntrinsicSelections) {
    try {
      const intrinsicRequest =
        await this.intrinsicRequestRepository.createIntrinsicRequest({
          topGuardRid: body.topGuardRid,
        });
      return intrinsicRequest;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async createSelectionImages(
    intrinsicRequestId: number,
    intrinsicCaptureIds: number[],
    topGuardRid: string,
  ) {
    try {
      const selections = await Promise.all(
        intrinsicCaptureIds.map(async (v) => {
          const selection =
            await this.intrinsicRequestRepository.createIntrinsicSelections({
              intrinsicCaptureId: v,
              intrinsicRequestId,
            });
          // intrinsicCapture에서 imagePath 조회
          const capture = await this.intrinsicCaptureService.findOne(v);
          return {
            id: selection.id,
            imagePath: capture.fileName,
          };
        }),
      );

      // const selections = await this.intrinsicCaptureService.getSelections(
      //   +body.topGuardId,
      // );
      const imagePaths = selections
        .filter((v): v is { id: number; imagePath: string } => v !== null)
        .map((v) => v);
      const desktopPath = `${process.env.IMAGE_SAVE_PATH}/${topGuardRid}/capture_images`;
      const absPaths = imagePaths.map((p) => ({
        id: p.id,
        path: path.resolve(desktopPath, p.imagePath),
      }));

      if (selections.length < 3) {
        throw new BadRequestException('최소 3장 이상의 이미지가 필요합니다.');
      }

      return absPaths;
    } catch (error) {
      await this.intrinsicRequestRepository.updateStatus(
        intrinsicRequestId,
        RequestStatus.Failed,
        String(error.stdout || error.stderr || error.message),
      );
      ErrorHelper.handle(error);
    }
  }

  async sendToAI(
    imagePaths: { id: number; path: string }[],
    topGuardRid: string,
    intrinsicRequestId: number,
    boardCols: number,
    boardRows: number,
    inputType: 'squares' | 'corners',
  ) {
    try {
      // const imageArg = imagePaths?.join(' ') || '';
      const imageArg = imagePaths
        .map((p) => {
          return `${p.path} ${p.id}`;
        })
        .join(' ');

      const command = `python3 src/scripts/camera_calibration.py --image-paths ${imageArg} --save-path ${process.env.IMAGE_SAVE_PATH}/${topGuardRid}/result_images/${intrinsicRequestId} --board-cols ${boardCols} --board-rows ${boardRows} --input-type ${inputType}`;

      await this.intrinsicRequestRepository.updateStatus(
        intrinsicRequestId,
        RequestStatus.Processing,
      );

      const { stdout, stderr } = await execAsync(command);

      // if (stderr) {
      //   console.warn('⚠️ stderr:', stderr);
      // }

      console.log('stdout', stdout);

      const match = stdout.match(/{[\s\S]*}/m);
      console.log('match', match);
      if (!match) throw new Error('JSON 결과를 찾을 수 없습니다.');
      const calibrationResult = JSON.parse(match[0]) as CalibrationResult;

      console.log('calibrationResult', calibrationResult.resultImageInfos);

      const intrinsicResultImagePaths = calibrationResult.resultImageInfos.map(
        (result_info) => ({
          intrinsicSelectionId: result_info.id,
          fileName: path.basename(result_info.path),
          filePath: `${topGuardRid}/result_images`,
        }),
      );
      await Promise.all(
        intrinsicResultImagePaths.map((path) =>
          this.intrinsicResultService.createIntrinsicOverlay(path),
        ),
      );

      const intrinsicResult = await this.intrinsicResultService.create({
        intrinsicRequestId: intrinsicRequestId,
        cameraMatrix: calibrationResult.cameraMatrix,
        distCoeffs: calibrationResult.distCoeffs,
        usedImageCount: calibrationResult.usedImageCount,
        meanReprojectionError: calibrationResult.meanReprojectionError,
        perImageReprojectionError: calibrationResult.perImageReprojectionError,
      });

      if (intrinsicResult) {
        const out = saveCalibrationYaml(
          calibrationResult,
          topGuardRid,
          intrinsicRequestId,
        );
        console.log('YAML saved to:', out);

        await this.intrinsicRequestRepository.updateStatus(
          intrinsicRequestId,
          RequestStatus.Completed,
        );
        void this.topGuardService.updateIntrinsicStage({
          topGuardRid,
          intrinsicStage: StageEnum.ResultReceived,
        });
      } else {
        await this.intrinsicRequestRepository.updateStatus(
          intrinsicRequestId,
          RequestStatus.Failed,
          'IntrinsicResult 생성 실패',
        );
      }
    } catch (error) {
      console.error('sendToAI 에러:', error);
      void this.intrinsicRequestRepository.updateStatus(
        intrinsicRequestId,
        RequestStatus.Failed,
        String(error.stdout || error.stderr || error.message),
      );
    }
  }

  async findOne(id: number) {
    try {
      return await this.intrinsicRequestRepository.findOne(id);
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }

  async findTopGuardIdLatestRequest(topGuardRid: string) {
    try {
      return await this.intrinsicRequestRepository.findTopGuardIdLatestRequest(
        topGuardRid,
      );
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }

  async findIntrinsicSelections(intrinsicRequestId: number) {
    try {
      return await this.intrinsicRequestRepository.findIntrinsicSelections(
        intrinsicRequestId,
      );
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }

  async findIntrinsicCapture(intrinsicCaptureId: number) {
    try {
      return await this.intrinsicCaptureService.findOne(intrinsicCaptureId);
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }

  async findTopGuardIdFailedRequests(topGuardRid: string) {
    try {
      return await this.intrinsicRequestRepository.findTopGuardIdFailedRequests(
        topGuardRid,
      );
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }

  async findTopGuardByRid(topGuardRid: string) {
    try {
      return await this.topGuardService.findTopGuardByRid(topGuardRid);
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }
}
