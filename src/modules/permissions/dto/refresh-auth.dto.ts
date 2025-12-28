import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshAuthDto {
  @IsString()
  @ApiProperty()
  refreshToken: string;
}
