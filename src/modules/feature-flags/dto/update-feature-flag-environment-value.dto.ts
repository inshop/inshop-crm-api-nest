import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateFeatureFlagEnvironmentValueDto {
  @IsBoolean()
  @ApiProperty()
  enabled: boolean;
}
