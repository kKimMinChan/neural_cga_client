import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { IntrinsicOutputRepository } from './intrinsic-output.repository';
import {
  IntrinsicOutputInput,
  IntrinsicOutputIsFinalInput,
  IntrinsicOutputWithPairsDto,
  IntrinsicOutputWithoutPairsDto,
  IntrinsicOverlayInput,
} from './intrinsic-output.schema';
import { ErrorHelper } from 'src/common/ErrorHelper';
import { IntrinsicRequestService } from 'src/intrinsic-request/intrinsic-request.service';
import { PaginationInput } from 'src/common/Pagination.schema';
import { toIso } from 'src/common/datetime';
import { StageEnum } from 'src/top-guard/top-guard.schema';
import { TopGuardService } from 'src/top-guard/top-guard.service';
import { sendYaml } from 'src/common/sendYaml';

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

  async findAll(topGuardId: number, pagination: PaginationInput) {
    try {
      const { limit, page } = pagination;

      const totalCount =
        await this.intrinsicOutputRepository.intrinsicOutputCount(topGuardId);

      const results = await this.intrinsicOutputRepository.findAll(
        topGuardId,
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

  async findResultImages(topGuardId: number) {
    try {
      return await this.intrinsicOutputRepository.findResultImages(topGuardId);
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

    const result = await this.intrinsicOutputRepository.isFinal(body);

    if (result) {
      await this.topGuardService.updateIntrinsicStage({
        topGuardId: body.topGuardId,
        intrinsicStage: StageEnum.Finalized,
      });
    }
    return result;
  }

  async sendYaml(intrinsicRequestId: string, topGuardId: string) {
    const result = await sendYaml(topGuardId, intrinsicRequestId);
    return result;
  }

  deleteIntrinsicOutput(id: number) {
    return this.intrinsicOutputRepository.deleteIntrinsicOutput(id);
  }
}
