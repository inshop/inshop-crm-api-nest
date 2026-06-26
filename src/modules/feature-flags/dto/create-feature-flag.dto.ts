import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUnique } from '../../core/validators/is-unique.decorator';
import { Exists } from '../../core/validators/exists.decorator';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { Project } from '../../projects/entities/project.entity';
import { FeatureFlagEnvironmentValueDto } from './feature-flag-environment-value.dto';

export class CreateFeatureFlagDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @IsUnique(FeatureFlag, ['code'], { message: 'Code must be unique' })
  @ApiProperty()
  code: string;

  @IsDateString()
  @ApiProperty()
  expiresAt: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one project is required' })
  @IsInt({ each: true })
  @Exists(Project)
  @ApiProperty({ type: [Number] })
  projectIds: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagEnvironmentValueDto)
  @ApiPropertyOptional({ type: [FeatureFlagEnvironmentValueDto] })
  environmentValues?: FeatureFlagEnvironmentValueDto[];
}
