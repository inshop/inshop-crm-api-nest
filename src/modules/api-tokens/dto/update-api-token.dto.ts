import { PartialType } from '@nestjs/mapped-types';
import { CreateApiTokenDto } from './create-api-token.dto';
import { IsOptional } from 'class-validator';

export class UpdateApiTokenDto extends PartialType(CreateApiTokenDto) {
  @IsOptional()
  id?: number;
}
