import { Group } from '../entities/group.entity';
import { IsBoolean, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsUnique } from '../../core/validators/is-unique.decorator';
import { User } from '../entities/user.entity';
import { Exists } from '../../core/validators/exists.decorator';

export class CreateUserDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsEmail()
  @IsUnique(User, ['email'], { message: 'Email must be unique' })
  @ApiProperty()
  email: string;

  @IsString()
  @ApiProperty()
  password: string;

  @Exists(Group, { message: 'Group not exists' })
  @Transform(({ value }) =>
    typeof value === 'number' ? { id: value } : value,
  )
  @ApiProperty()
  group: Group;

  @IsBoolean()
  @ApiProperty()
  isActive: boolean;
}
