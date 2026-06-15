import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutAuthDto {
  @IsString()
  @ApiProperty()
  refreshToken: string;
}
