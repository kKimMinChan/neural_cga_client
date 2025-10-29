import { Injectable } from '@nestjs/common';
import { loginLogoutInput } from './auth.schema';
import { loginLogs } from 'src/db/schema/loginLog';
import { db } from 'src/db/db';
import { desc } from 'drizzle-orm';
import { ErrorHelper } from 'src/common/ErrorHelper';

@Injectable()
export class AuthService {
  constructor() {}

  async loginLog(loginInput: loginLogoutInput) {
    try {
      const loginLog = await db.insert(loginLogs).values(loginInput);
      return loginLog;
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }

  async latestLoginLog() {
    const latestLoginLog = await db
      .select()
      .from(loginLogs)
      .orderBy(desc(loginLogs.createdAt))
      .limit(1);
    return latestLoginLog;
  }
}
