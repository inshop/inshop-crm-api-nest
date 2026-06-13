import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../services/auth.service';
import { LoginAuthDto } from '../../dto/login-auth.dto';
import { ResponseAuthDto } from '../../dto/response/response-auth.dto';
import { RefreshAuthDto } from '../../dto/refresh-auth.dto';
import { LogoutAuthDto } from '../../dto/logout-auth.dto';
import { ChangePasswordAuthDto } from '../../dto/change-password-auth.dto';
import { BodyValidationPipe } from '../../../core/pipes/body-validation.pipe';
import { TokenGuard } from '../../guards/token.guard';
import { User } from '../../entities/user.entity';
import { Request } from 'express';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(
    @Body(BodyValidationPipe) loginAuthDto: LoginAuthDto,
  ): Promise<ResponseAuthDto> {
    return this.authService.login(loginAuthDto);
  }

  @Post('/refresh')
  async refresh(
    @Body(BodyValidationPipe) refreshAuthDto: RefreshAuthDto,
  ): Promise<ResponseAuthDto> {
    return await this.authService.refresh(refreshAuthDto);
  }

  @Post('/logout')
  logout(@Body(BodyValidationPipe) logoutAuthDto: LogoutAuthDto) {
    return this.authService.logout(logoutAuthDto);
  }

  @UseGuards(TokenGuard)
  @Post('/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @Req() req: Request & { user: User },
    @Body(BodyValidationPipe) dto: ChangePasswordAuthDto,
  ) {
    return this.authService.changePassword(req.user.id, dto.password);
  }
}
