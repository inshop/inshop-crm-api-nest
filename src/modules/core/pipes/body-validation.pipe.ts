import { ValidationPipe } from '@nestjs/common';

export const BodyValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
