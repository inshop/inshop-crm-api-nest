import { PartialType } from '@nestjs/mapped-types';
import { CreateEnvironmentDto } from './create-environment.dto';
import { IsOptional } from 'class-validator';

export class UpdateEnvironmentDto extends PartialType(CreateEnvironmentDto) {
  @IsOptional()
  id?: number;
}
