import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { TopGuardService } from './top-guard.service';
import {
  CreateTopGuardInput,
  CreateTopGuardSchema,
  UpdateTopGuardInput,
  UpdateTopGuardSchema,
} from './top-guard.schema';
import { ZodValidationPipe } from 'src/common/zod-validation.pipe';
import { ApiExtraModels, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateTopGuardDto, BaseTopGuardDto } from './top-guard.schema';
import { SwaggerHelper } from 'src/common/SwaggerHelper';

@Controller('top-guards')
@ApiExtraModels(CreateTopGuardDto, BaseTopGuardDto)
export class TopGuardController {
  constructor(private readonly topGuardService: TopGuardService) {}

  @Post()
  @ApiBody({ type: CreateTopGuardDto })
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseTopGuardDto,
      '탑가드 생성',
      false,
      true,
    ),
  )
  async create(
    @Body(new ZodValidationPipe(CreateTopGuardSchema))
    body: CreateTopGuardInput,
  ) {
    console.log('topGuard', body);

    const topGuard = await this.topGuardService.create(body);
    return {
      data: topGuard,
    };
  }

  @Get('projects/:projectId')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseTopGuardDto,
      '탑가드 조회',
      true,
      true,
    ),
  )
  async findAll(@Param('projectId') projectId: number) {
    const topGuards = await this.topGuardService.findAll(projectId);
    return {
      data: topGuards,
    };
  }

  @Get(':id')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseTopGuardDto,
      '탑가드 조회',
      false,
      true,
    ),
  )
  async findOne(@Param('id') id: number) {
    const topGuard = await this.topGuardService.findOne(id);
    return {
      data: topGuard,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body(new ZodValidationPipe(UpdateTopGuardSchema))
    body: UpdateTopGuardInput,
  ) {
    const topGuard = await this.topGuardService.update(+id, body);
    return {
      data: topGuard,
    };
  }

  @Delete(':id')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(null, '탑가드 삭제', false, false),
  )
  async remove(@Param('id') id: number) {
    await this.topGuardService.remove(+id);
    return {
      translate: '성공적으로 삭제 되었습니다.',
    };
  }
}
