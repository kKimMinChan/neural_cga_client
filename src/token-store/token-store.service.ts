import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_PATH = path.resolve(__dirname, '.access-token');

@Injectable()
export class TokenStoreService {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken() {
    if (fs.existsSync(TOKEN_PATH)) {
      this.token = fs.readFileSync(TOKEN_PATH, 'utf-8').trim();
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string): void {
    this.token = token;
    fs.writeFileSync(TOKEN_PATH, token);
  }

  public clearToken(): void {
    this.token = null;
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
  }
}
