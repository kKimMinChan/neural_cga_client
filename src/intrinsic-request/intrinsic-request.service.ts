import { BadRequestException, Injectable } from '@nestjs/common';
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
import { IntrinsicResultService } from 'src/intrinsic-result/intrinsic-result.service';
import { IntrinsicRequestStatus } from './intrinsic-request.schema';

@Injectable()
export class IntrinsicRequestService {
  constructor(
    private readonly intrinsicCaptureService: IntrinsicCaptureService,
    private readonly intrinsicRequestRepository: IntrinsicRequestRepository,
    private readonly intrinsicResultService: IntrinsicResultService,
  ) {}
  async saveSelectionsAndRequest(body: IntrinsicSelections) {
    try {
      await this.intrinsicCaptureService.selections({
        selections: body.selections,
      });

      const selections = await this.intrinsicCaptureService.getSelections(
        +body.topGuardId,
      );
      const imagePaths = selections
        .filter((v): v is { id: number; imagePath: string } => v !== null)
        .map((v) => v.imagePath);
      const desktopPath = `${process.env.IMAGE_SAVE_PATH}/${body.topGuardId}/capture_images`;
      const absPaths = imagePaths.map((p) =>
        path.isAbsolute(p) ? p : path.resolve(desktopPath, p),
      );

      if (selections.length < 3) {
        throw new BadRequestException('최소 3장 이상의 이미지가 필요합니다.');
      }

      const intrinsicRequest =
        await this.intrinsicRequestRepository.createIntrinsicRequest({
          topGuardId: body.topGuardId,
          selections: selections.map((v) => v.id),
        });

      return {
        intrinsicRequest,
        absPaths,
      };
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async sendToAI(
    imagePaths: string[],
    topGuardId: number,
    intrinsicRequestId: number,
  ) {
    try {
      const imageArg = imagePaths?.join(' ') || '';

      const command = `python3 src/scripts/camera_calibration.py --image-paths ${imageArg} --save-path ${process.env.IMAGE_SAVE_PATH}/${topGuardId}/result_images/${intrinsicRequestId}`;

      await this.intrinsicRequestRepository.updateStatus(
        intrinsicRequestId,
        IntrinsicRequestStatus.Processing,
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

      const intrinsicResult = await this.intrinsicResultService.create({
        intrinsicRequestId: intrinsicRequestId,
        cameraMatrix: calibrationResult.cameraMatrix,
        distCoeffs: calibrationResult.distCoeffs,
        usedImageCount: calibrationResult.usedImageCount,
        meanReprojectionError: calibrationResult.meanReprojectionError,
        perImageReprojectionError: calibrationResult.perImageReprojectionError,
        resultImageFolder: `${process.env.IMAGE_SAVE_PATH}/${topGuardId}/result_images/${intrinsicRequestId}`,
      });

      if (intrinsicResult) {
        await this.intrinsicRequestRepository.updateStatus(
          intrinsicRequestId,
          IntrinsicRequestStatus.Completed,
        );
      } else {
        await this.intrinsicRequestRepository.updateStatus(
          intrinsicRequestId,
          IntrinsicRequestStatus.Failed,
          'IntrinsicResult 생성 실패',
        );
      }
    } catch (error) {
      console.error('sendToAI 에러:', error);
      void this.intrinsicRequestRepository.updateStatus(
        intrinsicRequestId,
        IntrinsicRequestStatus.Failed,
        error.stdout || error.stderr || error.message,
      );
    }
  }

  findAll() {
    return `This action returns all intrinsicRequest`;
  }

  async findOne(id: number) {
    try {
      return await this.intrinsicRequestRepository.findOne(id);
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }

  update(id: number, updateIntrinsicRequestDto: any) {
    return `This action updates a #${id} intrinsicRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} intrinsicRequest`;
  }
}
