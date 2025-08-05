import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProjectService } from './project.service';

import { ApiTags, ApiResponse, ApiBody, ApiExtraModels } from '@nestjs/swagger';
import { SwaggerHelper } from 'src/common/SwaggerHelper';
import {
  BaseProjectSchema,
  BaseProjectDto,
  CreateProjectDto,
  CreateProjectInput,
  CreateProjectSchema,
} from './project.schema';

@ApiTags('projects')
@ApiExtraModels(BaseProjectDto, CreateProjectDto)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseProjectDto,
      '프로젝트 생성',
      true,
      true,
    ),
  )
  async create(
    @Body() body: CreateProjectInput, // ← 여기를 DTO 클래스로!
  ) {
    const parsed = CreateProjectSchema.parse(body);
    const project = await this.projectService.create(parsed);
    return {
      data: project,
    };
  }

  @Get()
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseProjectDto,
      '프로젝트 생성',
      true,
      true,
    ),
  )
  async findAll() {
    console.log('findAll');
    const projects = await this.projectService.findAll();
    return {
      data: projects,
    };
  }

  @Get(':id')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseProjectDto,
      '프로젝트 생성',
      false,
      true,
    ),
  )
  async findOne(@Param('id') id: string) {
    const project = await this.projectService.findOne(+id);
    return {
      data: project,
    };
  }

  @Patch(':id')
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      BaseProjectDto,
      '프로젝트 수정',
      false,
      true,
    ),
  )
  async update(@Param('id') id: string, @Body() body: CreateProjectInput) {
    const updated = await this.projectService.update(+id, body);
    return {
      data: updated,
    };
  }

  @Delete(':id')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(null, '프로젝트 삭제', false, false),
  )
  async remove(@Param('id') id: string) {
    await this.projectService.remove(+id);
    return {
      translate: '성공적으로 삭제 되었습니다.',
    };
  }
}
