// import { InjectQueue } from '@nestjs/bull';
// import { Injectable } from '@nestjs/common';
// import { Queue } from 'bull';
// import { NetworkMonitorService } from 'src/network-monitor/network-monitor.service';
// // import { UserRepository } from 'src/user/user.repository';
// // import { SyncUserInput } from 'src/user/user.schema';

// @Injectable()
// export class UserSyncService {
//   constructor(
//     @InjectQueue('userQueue') private userQueue: Queue,
//     private readonly repo: UserRepository,
//     private readonly network: NetworkMonitorService,
//   ) {
//     this.network.onReconnect(() => {
//       // this.retryFailedUsers();
//     });
//   }

//   onModuleInit() {
//     this.userQueue.on('completed', (job) => {
//       console.log(`✅ Job ${job.id} completed`);
//     });

//     this.userQueue.on('failed', (job, err) => {
//       console.error(`❌ Job ${job.id} failed:`, err.message);
//     });
//   }

//   async enqueueUserSync(userId: string, payload: SyncUserInput) {
//     await this.userQueue.add(
//       'syncUser',
//       { userId, payload },
//       {
//         attempts: 5, // Retry up to 3 times on failure
//         backoff: {
//           type: 'exponential', // Exponential backoff for retries
//           delay: 5000, // Initial delay of 1 seconds
//         },
//         removeOnComplete: true, // Remove job from queue when completed
//         removeOnFail: false, // Remove job from queue when failed
//       },
//     );
//     console.log('✅ Job enqueued:', userId);
//   }

//   // async retryFailedUsers() {
//   //   console.log('🔁 재시도 대상 유저 찾는 중...');
//   //   const failedUsers = await this.repo.findUserBySyncStatus('failed');

//   //   for (const user of failedUsers) {
//   //     console.log(`🔁 재시도: ${user.id}`);
//   //     await this.enqueueUserSync(user.id, {
//   //       id: user.id,
//   //       email: user.email,
//   //       password: user.password,
//   //       name: user.name,
//   //       role: user.role,
//   //       companyId: user.companyId,
//   //     });
//   //   }
//   // }
// }
