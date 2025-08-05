import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { TokenStoreService } from 'src/token-store/token-store.service';
import { LoginInput } from './auth.schema';
import { UserRepository } from 'src/user/user.repository';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenStore: TokenStoreService,
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  // async validateUser(login: LoginInput): Promise<any> {
  //   const user = await this.userRepo.findUserByEmail(login.email);
  //   if (user && (await bcrypt.compare(login.password, user.password))) {
  //     const { password, ...result } = user;
  //     return result;
  //   }
  //   return null;
  // }

  async login(user: any) {
    const payload = { id: user.id, role: user.role, name: user.name };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }
}
