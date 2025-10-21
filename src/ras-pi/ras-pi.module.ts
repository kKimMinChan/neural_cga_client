import { Module } from '@nestjs/common';
import { RasPiService } from './ras-pi.service';
import { RasPiController } from './ras-pi.controller';
import { HttpModule } from '@nestjs/axios';
import { TopGuardModule } from 'src/top-guard/top-guard.module';

@Module({
  imports: [HttpModule, TopGuardModule],
  controllers: [RasPiController],
  providers: [RasPiService],
})
export class RasPiModule {}
