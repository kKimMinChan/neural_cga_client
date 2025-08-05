import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput } from './auth.schema';

@Controller('auth')
export class AuthController {
  // constructor(private readonly authService: AuthService) {}
  // @Post('login')
  // async login(@Body() loginInput: LoginInput) {
  //   const user = await this.authService.validateUser(loginInput);
  //   if (!user) {
  //     throw new Error('Invalid credentials');
  //   }
  //   return this.authService.login(user);
  // }
}
