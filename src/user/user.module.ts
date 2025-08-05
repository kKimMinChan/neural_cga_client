import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserSyncService } from 'src/sync/user-sync/user-sync.service';
import { UserSyncModule } from 'src/sync/user-sync/user-sync.module';

@Module({
  imports: [UserSyncModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
