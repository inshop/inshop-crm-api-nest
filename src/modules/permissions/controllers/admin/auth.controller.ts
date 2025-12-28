import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from '../../services/auth.service';
import { LoginAuthDto } from '../../dto/login-auth.dto';
import { ResponseAuthDto } from '../../dto/response/response-auth.dto';
import { RefreshAuthDto } from '../../dto/refresh-auth.dto';
import { LogoutAuthDto } from '../../dto/logout-auth.dto';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(
    @Body(ValidationPipe) loginAuthDto: LoginAuthDto,
  ): Promise<ResponseAuthDto> {
    return this.authService.login(loginAuthDto);
  }

  @Post('/refresh')
  async refresh(
    @Body(ValidationPipe) refreshAuthDto: RefreshAuthDto,
  ): Promise<ResponseAuthDto> {
    return await this.authService.refresh(refreshAuthDto);
  }

  @Post('/logout')
  logout(@Body(ValidationPipe) logoutAuthDto: LogoutAuthDto) {
    return this.authService.logout(logoutAuthDto);
  }
}
