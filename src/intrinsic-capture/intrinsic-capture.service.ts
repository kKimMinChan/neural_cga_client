import { Injectable } from '@nestjs/common';
import {
  CreateIntrinsicCaptureInput,
  CalibrationResult,
  SelectionCaptureInput,
} from './intrinsic-capture.schema';
import { IntrinsicCaptureRepository } from './intrinsic-capture.repository';
import { ErrorHelper } from 'src/common/ErrorHelper';
import { promisify } from 'util';
import { exec } from 'child_process';
const execAsync = promisify(exec);

@Injectable()
export class IntrinsicCaptureService {
  constructor(
    private readonly intrinsicCaptureRepo: IntrinsicCaptureRepository,
  ) {}

  async sendToAI(
    imagePaths: string[] | null,
    topGuardId: number,
  ): Promise<CalibrationResult> {
    try {
      const imageArg = imagePaths?.join(' ') || '';
      const command = `python3 src/scripts/camera_calibration.py ${imageArg} --save-path ${process.env.IMAGE_SAVE_PATH}/${topGuardId}`;

      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.warn('⚠️ stderr:', stderr);
      }
      console.log('stdout', stdout);
      return JSON.parse(stdout) as CalibrationResult;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async create(body: CreateIntrinsicCaptureInput) {
    return await this.intrinsicCaptureRepo.createIntrinsicCapture(body);
  }

  async selections(body: SelectionCaptureInput) {
    try {
      console.log(body);
      return await this.intrinsicCaptureRepo.selections(body);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async getSelections(topGuardId: number) {
    try {
      const intrinsicCaptures =
        await this.intrinsicCaptureRepo.findIntrinsicCaptureByTopGuardId(
          topGuardId,
        );
      const selections = intrinsicCaptures
        .filter((intrinsicCapture) => intrinsicCapture.isSelected)
        .map((intrinsicCapture) => ({
          id: intrinsicCapture.id,
          imagePath: intrinsicCapture.imagePath,
        }));
      return selections;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async findAll(topGuardId: number) {
    try {
      return await this.intrinsicCaptureRepo.findIntrinsicCaptureByTopGuardId(
        topGuardId,
      );
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} intrinsicCapture`;
  }

  async allSelections(topGuardId: number) {
    try {
      const intrinsicCaptures =
        await this.intrinsicCaptureRepo.findIntrinsicCaptureByTopGuardId(
          topGuardId,
        );
      const selections: SelectionCaptureInput['selections'] =
        intrinsicCaptures.map((intrinsicCapture) => ({
          intrinsicCaptureId: intrinsicCapture.id,
          isSelected: true,
        }));
      return await this.intrinsicCaptureRepo.selections({ selections });
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async remove(id: number) {
    try {
      return await this.intrinsicCaptureRepo.deleteIntrinsicCapture(id);
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }
}
