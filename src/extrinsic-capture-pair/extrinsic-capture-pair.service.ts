import { Injectable } from '@nestjs/common';
import { CreateExtrinsicCapturePairInput } from './extrinsic-capture-pair.schema';
import { ExtrinsicCapturePairRepository } from './extrinsic-capture-pair.repository';
import { getDesktopPath } from 'src/common/getDesktopPath';
import * as path from 'path';

@Injectable()
export class ExtrinsicCapturePairService {
  constructor(
    private readonly extrinsicCapturePairRepository: ExtrinsicCapturePairRepository,
  ) {}

  async createExtrinsicCapturePair(body: CreateExtrinsicCapturePairInput) {
    return this.extrinsicCapturePairRepository.createExtrinsicCapturePair(body);
  }

  async findExtrinsicCapturePairsByTopGuardRid(topGuardRid: string) {
    const extrinsicCapturePairs =
      await this.extrinsicCapturePairRepository.findExtrinsicCapturePairsByTopGuardRid(
        topGuardRid,
      );

    return extrinsicCapturePairs;
  }

  async deleteExtrinsicCapturePair(extrinsicCapturePairId: number) {
    await this.extrinsicCapturePairRepository.deleteExtrinsicCapturePair(
      extrinsicCapturePairId,
    );
  }
}
