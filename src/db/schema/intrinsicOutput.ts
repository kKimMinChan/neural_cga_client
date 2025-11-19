import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  real,
} from 'drizzle-orm/pg-core';
import { intrinsicRequests } from './intrinsicRequest';

export const intrinsicOutputs = pgTable('intrinsic_outputs', {
  rid: text('rid').primaryKey(),
  // uuid: uuid('uuid').defaultRandom(),
  intrinsicRequestId: integer('intrinsic_request_id')
    .references(() => intrinsicRequests.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  cameraMatrix: text('camera_matrix'),
  distCoeffs: text('dist_coeffs'),
  perImageReprojectionError: text('per_image_reprojection_error'),
  usedImageCount: integer('used_image_count'),
  meanReprojectionError: real('mean_reprojection_error'),
  isFinal: boolean('is_final').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
