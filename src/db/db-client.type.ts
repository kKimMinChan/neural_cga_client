// db-client.type.ts

import { db } from './db';

export interface DbClient {
  insert: typeof db.insert;
  update: typeof db.update;
  delete: typeof db.delete;
  // 필요하면 select, query 등 추가 가능
}
