import { IsBoolean, IsString } from 'class-validator';
import { IsUnique } from '../../core/validators/is-unique.decorator';
import { Project } from '../entities/project.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @IsUnique(Project, ['code'], { message: 'Code must be unique' })
  @ApiProperty()
  code: string;

  @IsBoolean()
  @ApiProperty()
  isActive: boolean;
}
