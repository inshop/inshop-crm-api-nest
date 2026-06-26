import { IsBoolean, IsString } from 'class-validator';
import { IsUnique } from '../../core/validators/is-unique.decorator';
import { Environment } from '../entities/environment.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnvironmentDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @IsUnique(Environment, ['code'], { message: 'Code must be unique' })
  @ApiProperty()
  code: string;

  @IsBoolean()
  @ApiProperty()
  isActive: boolean;
}
