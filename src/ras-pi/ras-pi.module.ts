import { Module } from '@nestjs/common';
import { RasPiService } from './ras-pi.service';
import { RasPiController } from './ras-pi.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [RasPiController],
  providers: [RasPiService],
})
export class RasPiModule {}
