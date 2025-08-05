import { Controller, Get } from '@nestjs/common';
import { RasPiService } from './ras-pi.service';
import { RasPiResponse } from './ras-pi.response';
import { SwaggerHelper } from 'src/common/SwaggerHelper';
import { ApiExtraModels, ApiResponse } from '@nestjs/swagger';

@ApiExtraModels(RasPiResponse)
@Controller('ras-pi')
export class RasPiController {
  constructor(private readonly rasPiService: RasPiService) {}

  @Get('all-top-guard-info')
  @ApiResponse(
    SwaggerHelper.getApiResponseSchema(
      RasPiResponse,
      '탑가드 정보 조회',
      false,
      true,
    ),
  )
  async getAllRasPiInfoViaSSH() {
    const rasPiInfo = await this.rasPiService.getAllRasPiInfoViaSSH();
    return { data: rasPiInfo };
  }

  @Get('scan-network')
  async scanNetwork() {
    const ip = await this.rasPiService.scanNetwork();
    return { data: ip };
  }
}
