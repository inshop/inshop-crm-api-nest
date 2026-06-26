import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt } from 'class-validator';
import { Exists } from '../../core/validators/exists.decorator';
import { Environment } from '../../environments/entities/environment.entity';

export class FeatureFlagEnvironmentValueDto {
  @IsInt()
  @Exists(Environment)
  @ApiProperty()
  environmentId: number;

  @IsBoolean()
  @ApiProperty()
  enabled: boolean;
}
