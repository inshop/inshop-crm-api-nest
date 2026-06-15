import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutAuthDto {
  @IsString()
  @ApiProperty()
  refreshToken: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  clientIp?: string;
}
