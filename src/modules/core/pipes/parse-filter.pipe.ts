import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseFilterPipe implements PipeTransform {
  transform(value?: string): Record<string, string> | undefined {
    if (!value) {
      return undefined;
    }

    try {
      const parsed: unknown = JSON.parse(value);

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new BadRequestException('Invalid filter');
      }

      const filter = Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, string] =>
            typeof entry[0] === 'string' &&
            typeof entry[1] === 'string' &&
            entry[1] !== '',
        ),
      );

      return Object.keys(filter).length ? filter : undefined;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Invalid filter');
    }
  }
}
