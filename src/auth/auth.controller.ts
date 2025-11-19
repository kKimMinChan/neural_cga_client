import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginLogoutDto,
  loginLogoutInput,
  loginLogoutSchema,
  LoginInput,
  LoginSchema,
  LoginDto,
} from './auth.schema';
import { ZodValidationPipe } from 'src/common/zod-validation.pipe';
import { ApiBody } from '@nestjs/swagger';
import { AxiosResponse } from 'axios';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-log')
  @ApiBody({ type: LoginLogoutDto })
  async loginLog(
    @Body(new ZodValidationPipe(loginLogoutSchema))
    loginInput: loginLogoutInput,
  ) {
    return this.authService.loginLog(loginInput);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  async login(
    @Body(new ZodValidationPipe(LoginSchema))
    loginInput: LoginInput,
  ) {
    return {
      data: await this.authService.login(loginInput),
    };
  }

  @Get('latest-login-log')
  async latestLoginLog() {
    const latestLoginLog = await this.authService.latestLoginLog();
    return { data: latestLoginLog };
  }
}
