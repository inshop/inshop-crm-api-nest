import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordAuthDto {
  @IsString()
  @ApiProperty()
  password: string;
}
