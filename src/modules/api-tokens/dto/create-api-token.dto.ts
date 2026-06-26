import { IsBoolean, IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exists } from '../../core/validators/exists.decorator';
import { Environment } from '../../environments/entities/environment.entity';

export class CreateApiTokenDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsInt()
  @Exists(Environment)
  @ApiProperty()
  environmentId: number;

  @IsBoolean()
  @ApiProperty()
  isActive: boolean;
}
