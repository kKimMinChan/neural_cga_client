import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginLogoutDto,
  loginLogoutInput,
  loginLogoutSchema,
} from './auth.schema';
import { ZodValidationPipe } from 'src/common/zod-validation.pipe';
import { ApiBody } from '@nestjs/swagger';

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

  @Get('latest-login-log')
  async latestLoginLog() {
    const latestLoginLog = await this.authService.latestLoginLog();
    return { data: latestLoginLog };
  }
}
