import { FindOptionsWhere, ILike } from 'typeorm';

type FieldType = 'string' | 'number' | 'boolean';

const applyFilter = (type: FieldType, value: string): unknown => {
  if (type === 'boolean') {
    return value === 'true';
  }

  if (type === 'number') {
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  }

  return ILike(`%${value}%`);
};

export function buildListWhere<T extends object>(
  filter: Record<string, string> | undefined,
  fields: Record<string, FieldType>,
  relations?: Record<string, Record<string, FieldType>>,
): FindOptionsWhere<T> {
  const where: Record<string, unknown> = {};

  if (!filter) {
    return where as FindOptionsWhere<T>;
  }

  for (const [field, type] of Object.entries(fields)) {
    const value = filter[field];
    if (!value) {
      continue;
    }

    const result = applyFilter(type, value);
    if (result !== undefined) {
      where[field] = result;
    }
  }

  if (relations) {
    for (const [relation, relationFields] of Object.entries(relations)) {
      const value = filter[relation];
      if (!value) {
        continue;
      }

      const nested: Record<string, unknown> = {};
      for (const [nestedField, type] of Object.entries(relationFields)) {
        const result = applyFilter(type, value);
        if (result !== undefined) {
          nested[nestedField] = result;
        }
      }

      if (Object.keys(nested).length) {
        where[relation] = nested;
      }
    }
  }

  return where as FindOptionsWhere<T>;
}
