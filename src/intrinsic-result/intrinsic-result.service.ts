import { Injectable } from '@nestjs/common';
import { IntrinsicResultRepository } from './intrinsic-result.repository';
import { IntrinsicResultInput } from './intrinsic-result.schema';
import { ErrorHelper } from 'src/common/ErrorHelper';

@Injectable()
export class IntrinsicResultService {
  constructor(
    private readonly intrinsicResultRepository: IntrinsicResultRepository,
  ) {}

  create(body: IntrinsicResultInput) {
    return this.intrinsicResultRepository.createIntrinsicResult(body);
  }

  async findAll(topGuardId: number) {
    try {
      return await this.intrinsicResultRepository.findAll(topGuardId);
    } catch (error) {
      console.error(error);
      ErrorHelper.handle(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} intrinsicResult`;
  }

  update(id: number, updateIntrinsicResultDto: any) {
    return `This action updates a #${id} intrinsicResult`;
  }

  remove(id: number) {
    return `This action removes a #${id} intrinsicResult`;
  }
}
