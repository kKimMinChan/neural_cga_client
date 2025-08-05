import { Module } from '@nestjs/common';
import { TokenStoreService } from './token-store.service';
import { TokenStoreController } from './token-store.controller';

@Module({
  controllers: [TokenStoreController],
  providers: [TokenStoreService],
  exports: [TokenStoreService],
})
export class TokenStoreModule {}
