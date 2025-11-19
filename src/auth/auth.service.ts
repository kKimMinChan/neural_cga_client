import { Injectable } from '@nestjs/common';
import { LoginInput, loginLogoutInput } from './auth.schema';
import { loginLogs } from 'src/db/schema/loginLog';
import { db } from 'src/db/db';
import { desc } from 'drizzle-orm';
import { ErrorHelper } from 'src/common/ErrorHelper';
import axios from 'axios';

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
    const [latestLoginLog] = await db
      .select()
      .from(loginLogs)
      .orderBy(desc(loginLogs.createdAt))
      .limit(1);
    return latestLoginLog ?? null;
  }

  async login(loginInput: LoginInput) {
    try {
      const res = await axios.post(
        `${process.env.CENTRAL_SERVER_URL}/auth/login`,
        loginInput,
      );
      console.log('res', res.data);
      if (res.data.result === true) {
        const loginLog = {
          userId: res.data.data[0].id,
          companyId: res.data.data[0].companyId,
          accessToken: res.data.data[0].accessToken,
          name: res.data.data[0].name,
          role: res.data.data[0].role,
        };
        const [row] = await db.insert(loginLogs).values(loginLog).returning();
        return row;
      }
    } catch (error) {
      ErrorHelper.handle(error);
    }
  }
}
