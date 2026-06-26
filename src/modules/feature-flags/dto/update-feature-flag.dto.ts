import { PartialType } from '@nestjs/mapped-types';
import { CreateFeatureFlagDto } from './create-feature-flag.dto';
import { IsOptional } from 'class-validator';

export class UpdateFeatureFlagDto extends PartialType(CreateFeatureFlagDto) {
  @IsOptional()
  id?: number;
}
