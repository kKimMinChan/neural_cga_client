import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  real,
} from 'drizzle-orm/pg-core';
import { intrinsicRequests } from './intrinsicRequest';

export const intrinsicResults = pgTable('intrinsic_results', {
  id: serial('id').primaryKey(),
  intrinsicRequestId: integer('intrinsic_request_id').references(
    () => intrinsicRequests.id,
    {
      onDelete: 'cascade',
    },
  ),
  cameraMatrix: text('camera_matrix'),
  distCoeffs: text('dist_coeffs'),
  perImageReprojectionError: text('per_image_reprojection_error'),
  usedImageCount: integer('used_image_count'),
  meanReprojectionError: real('mean_reprojection_error'),
  resultImageFolder: text('result_image_folder'),
  isFinal: boolean('is_final').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
