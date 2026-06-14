import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Module } from '../entities/module.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private modulesRepository: Repository<Module>,
  ) {}

  findAll(take: number, skip: number) {
    return this.modulesRepository.findAndCount({
      take,
      skip,
      order: { id: 'DESC' },
    });
  }
}
