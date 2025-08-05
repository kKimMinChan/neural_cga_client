import { Process, Processor } from '@nestjs/bull';
import axios from 'axios';
import { Job } from 'bull';
import { UserRepository } from 'src/user/user.repository';
import { SyncUserInput } from 'src/user/user.schema';

@Processor('userQueue')
export class UserSyncProcessor {
  constructor(private readonly repo: UserRepository) {}

  onModuleInit() {
    console.log('🚀 UserSyncProcessor initialized!');
  }

  @Process('syncUser')
  async syncUser(job: Job<{ userId: string; payload: SyncUserInput }>) {
    const { userId, payload } = job.data;
    console.log(`Processing user sync for userId: ${userId}`, payload);

    // Simulate user sync logic
    try {
      await axios.post(`${process.env.CENTRAL_SERVER_URL}/user`, payload, {
        headers: {
          Authorization: `Bearer ${process.env.CENTRAL_SERVER_TOKEN}`,
        },
      });

      await this.repo.updateUserSyncStatus(userId, {
        syncStatus: 'synced',
        lastSyncAt: new Date(),
      });

      console.log(`User sync completed for userId: ${userId}`);
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401 || status === 400 || status === 403) {
        console.error(
          `🛑 Permanent failure for user ${userId}:`,
          error.response?.data,
        );
        job.discard(); // 재시도 방지
      } else {
        console.error(`🔁 Temporary failure for user ${userId}:`, error);
        throw error; // 재시도 시도
      }
      await this.repo.updateUserSyncStatus(userId, {
        syncStatus: 'failed',
        lastSyncAt: new Date(),
        syncErrorMessage: error.response?.data || error.message,
      });
    }
  }
}
