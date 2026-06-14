import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable, Type } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { EntityIdType } from '../types/entity.type';

@ValidatorConstraint({ async: true })
@Injectable()
export class ExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async validate(
    value: EntityIdType | EntityIdType[],
    args: ValidationArguments,
  ): Promise<boolean> {
    const [entity] = args.constraints as [Type<any>];
    const repository = this.dataSource.getRepository(entity);

    if (!Array.isArray(value)) {
      value = [value];
    }

    let exists = true;

    for (const item of value) {
      const id =
        typeof item === 'object' && item !== null && 'id' in item
          ? item.id
          : item;

      const record: unknown = await repository.findOne({
        where: { id },
      });

      if (!record) {
        exists = false;
      }
    }

    return exists;
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    const [entity] = validationArguments.constraints as [string];

    return `${entity} not exists.`;
  }
}

export function Exists(
  entity: any,
  options?: ValidationOptions,
): (object: object, propertyName: string) => void {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [entity],
      validator: ExistsConstraint,
    });
  };
}
