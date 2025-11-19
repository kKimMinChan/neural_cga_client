import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { IntrinsicOutputRepository } from './intrinsic-output.repository';
import {
  IntrinsicOutputInput,
  IntrinsicOutputIsFinalInput,
  IntrinsicOutputWithPairsDto,
  IntrinsicOutputWithoutPairsDto,
  IntrinsicOverlayInput,
  IntrinsicManifestInput,
  IntrinsicManifestKind,
  IntrinsicManifestFormat,
  IntrinsicValueInput,
} from './intrinsic-output.schema';
import { ErrorHelper } from 'src/common/ErrorHelper';
import { IntrinsicRequestService } from 'src/intrinsic-request/intrinsic-request.service';
import { PaginationInput } from 'src/common/Pagination.schema';
import { toIso } from 'src/common/datetime';
import { StageEnum } from 'src/top-guard/top-guard.schema';
import { TopGuardService } from 'src/top-guard/top-guard.service';
import { sendYaml } from 'src/common/sendYaml';
import { ulid } from 'ulid';
import { OutboxStatus } from 'src/sync/sync.schema';

@Injectable()
export class IntrinsicOutputService {
  constructor(
    private readonly intrinsicOutputRepository: IntrinsicOutputRepository,
    @Inject(forwardRef(() => IntrinsicRequestService))
    private readonly intrinsicRequestService: IntrinsicRequestService,
    private readonly topGuardService: TopGuardService,
  ) {}

  async createIntrinsicOverlay(body: IntrinsicOverlayInput) {
    return await this.intrinsicOutputRepository.createIntrinsicOverlay(body);
  }

  create(body: IntrinsicOutputInput) {
    return this.intrinsicOutputRepository.createIntrinsicResult(body);
  }

  async findAll(topGuardRid: string, pagination: PaginationInput) {
    try {
      const { limit, page } = pagination;

      const totalCount =
        await this.intrinsicOutputRepository.intrinsicOutputCount(topGuardRid);

      const results = await this.intrinsicOutputRepository.findAll(
        topGuardRid,
        pagination,
      );

      const intrinsicResult: IntrinsicOutputWithPairsDto[] = await Promise.all(
        results.map((result) =>
          this.intrinsicRequestService
            .findIntrinsicSelections(result.intrinsicRequestId)
            .then(async (selections) => {
              const results = await Promise.all(
                selections.map(async (selection) => {
                  const [resImg, capImg] = await Promise.all([
                    this.intrinsicOutputRepository.findIntrinsicResultImagePaths(
                      selection.id,
                    ),
                    this.intrinsicRequestService.findIntrinsicCapture(
                      selection.intrinsicCaptureId,
                    ),
                  ]);
                  return {
                    intrinsicResultImage: resImg && {
                      ...resImg,
                      createdAt: toIso(resImg.createdAt),
                    },
                    intrinsicCapture: capImg && {
                      ...capImg,
                      createdAt: toIso(capImg.createdAt),
                    },
                  };
                }),
              );
              return {
                ...result,
                createdAt: toIso(result.createdAt),
                captureOverlayPairs: results,
              };
            }),
        ),
      );

      return {
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        page: page,
        pageSize: limit,
        data: intrinsicResult,
      };
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }

  async findResultImages(topGuardRid: string) {
    try {
      return await this.intrinsicOutputRepository.findResultImages(topGuardRid);
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }

  async isFinal(body: IntrinsicOutputIsFinalInput) {
    const exists =
      await this.intrinsicOutputRepository.existsIntrinsicRequestId(
        body.intrinsicRequestId,
      );

    if (!exists) throw new NotFoundException('Intrinsic request not found');

    const existOutbox =
      await this.intrinsicOutputRepository.findOutboxByEntityAndRid(
        'intrinsic_capture',
        body.topGuardRid,
      );

    if (existOutbox) {
      throw new ConflictException(
        'Intrinsic capture and value outbox already exists',
      );
    }

    const result = await this.intrinsicOutputRepository.isFinal(body);
    if (result.cameraMatrix && result.distCoeffs) {
      const topGuard = await this.topGuardService.updateIntrinsicStage({
        topGuardRid: body.topGuardRid,
        intrinsicStage: StageEnum.Finalized,
      });
      // if (topGuard) {
      //   const selections =
      //     await this.intrinsicRequestService.findIntrinsicSelections(
      //       body.intrinsicRequestId,
      //     );
      //   const manifest: IntrinsicManifestInput = await Promise.all(
      //     selections.map(async (selection) => {
      //       const capture =
      //         await this.intrinsicRequestService.findIntrinsicCapture(
      //           selection.intrinsicCaptureId,
      //         );
      //       if (!capture) {
      //         throw new NotFoundException('Intrinsic capture not found');
      //       }
      //       return {
      //         name: capture.fileName,
      //         kind: IntrinsicManifestKind.Image,
      //         format: IntrinsicManifestFormat.BMP,
      //       };
      //     }),
      //   );
      //   const intrinsicValue: IntrinsicValueInput = {
      //     cameraMatrix: JSON.parse(result.cameraMatrix),
      //     distCoeffs: JSON.parse(result.distCoeffs),
      //   };
      //   const patch = {
      //     manifest,
      //     intrinsicValue,
      //   };

      //   await this.intrinsicOutputRepository.createOutbox({
      //     opId: ulid(),
      //     entity: 'intrinsic',
      //     rid: body.topGuardRid,
      //     patch: JSON.stringify(patch),
      //     preconds: JSON.stringify({}),
      //     updatedAt: new Date().toISOString(),
      //     status: OutboxStatus.Pending,
      //     retryCount: 0,
      //   });
      // }
    } else {
      throw new BadRequestException('intrinsicRequestId is not valid');
    }
    return result;
  }

  async sendYaml(intrinsicRequestId: number, topGuardRid: string) {
    const result = await sendYaml(topGuardRid, intrinsicRequestId);
    return result;
  }

  deleteIntrinsicOutput(rid: string) {
    return this.intrinsicOutputRepository.deleteIntrinsicOutput(rid);
  }
}
