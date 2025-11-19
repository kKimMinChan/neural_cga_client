import { Injectable, Logger } from '@nestjs/common';
import * as FormData from 'form-data';
import * as fs from 'fs';
import axios from 'axios';
import pLimit from 'p-limit';
import { AuthService } from 'src/auth/auth.service';
import { UploadCalibrationRepository } from './upload-calibration.repository';
import { OutboxStatus } from 'src/sync/sync.schema';
import { z } from 'zod';

// 2) patch(JSON) 구조 타입
const PatchMetaSchema = z.object({
  name: z.string(),
  sha256: z.string(),
  path: z.string(),
  topGuardRid: z.string(),
  projectRid: z.string(),
  companyId: z.number(),
});
type PatchMeta = z.infer<typeof PatchMetaSchema>;

@Injectable()
export class UploadCalibrationWorker {
  private readonly logger = new Logger(UploadCalibrationWorker.name);

  constructor(
    private readonly authService: AuthService,
    private readonly uploadCalibrationRepository: UploadCalibrationRepository, // outboxes 접근
  ) {}

  // pending 파일만 처리
  async drainIntrinsicCaptures(concurrency = 3) {
    const token = (await this.authService.latestLoginLog()).accessToken ?? '';
    const items =
      await this.uploadCalibrationRepository.findAllPendingOutboxByEntity(
        'intrinsic-capture',
      ); // outboxes where status='pending'

    console.log('items', items, items.length);
    if (!items.length) return { uploaded: 0, total: 0 };

    const limit = pLimit(concurrency);
    let uploaded = 0;

    await Promise.all(
      items.map((item) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        limit(async () => {
          const meta = JSON.parse(item.patch) as PatchMeta;
          console.log('meta', meta);

          const form = new FormData();
          form.append('name', meta.name);
          form.append('sha256', meta.sha256);
          form.append('file', fs.createReadStream(meta.path));

          try {
            const url = `${process.env.CENTRAL_SERVER_URL}/upload-calibration/${meta.companyId}/${meta.projectRid}/${meta.topGuardRid}/Intrinsic/requests/${item.rid}/uploads/intrinsic-image`;
            const res = await axios.post(url, form, {
              headers: {
                Authorization: `Bearer ${token}`,
                ...form.getHeaders(),
              },
              maxBodyLength: Infinity,
              timeout: 60_000,
            });
            if (res.data.result === true) {
              await this.uploadCalibrationRepository.updateOutboxStatus(
                item.opId,
                OutboxStatus.Done,
              );
              this.logger.log(`Uploaded ${item.opId}`);
              uploaded++;
            }
          } catch (e) {
            this.logger.error(
              `Upload failed for item ${item.opId}: ${JSON.stringify(e.response.data)}`,
            );
            await this.uploadCalibrationRepository.bumpRetryOrFail(
              item.opId,
              e.response.data,
            );
          }
        }),
      ),
    );

    return { uploaded, total: items.length };
  }
}
