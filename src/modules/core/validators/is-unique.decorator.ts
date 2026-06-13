import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable, Type } from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { EntityType } from '../types/entity.type';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    if (!value) {
      return true;
    }

    const [entity, properties] = args.constraints as [Type<any>, string[]];
    const object = args.object as EntityType;
    const repository = this.dataSource.getRepository(entity);

    const where: Record<string, unknown> = {};
    for (const property of properties) {
      where[property] = object[property];
    }

    if (object.id) {
      where.id = Not(+object.id);
    }

    const record = await repository.findOne({ where });

    return !record;
  }

  defaultMessage(args: ValidationArguments): string {
    const [, properties] = args.constraints as [Type<any>, string[]];

    return `${properties.join(', ')} must be unique.`;
  }
}

export function IsUnique(
  entity: any,
  properties: string[],
  options?: ValidationOptions,
): (object: object, propertyName: string) => void {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [entity, properties],
      validator: IsUniqueConstraint,
    });
  };
}
