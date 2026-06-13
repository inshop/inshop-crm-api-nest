import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);

    return this.usersRepository.save(user);
  }

  findAll(take: number, skip: number) {
    return this.usersRepository.findAndCount({
      take,
      skip,
      relations: {
        group: true,
      },
    });
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: {
        group: true,
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneByOrFail({ id });
    const { password, id: _id, ...rest } = updateUserDto;
    Object.assign(user, rest);
    if (password) {
      user.password = password;
    }
    return this.usersRepository.save(user);
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }
}
