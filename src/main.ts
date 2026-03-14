import './bootstrap';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://xavieryjuliana.com',
    'https://www.xavieryjuliana.com',
  ];

  app.enableCors({
    origin: process.env.NODE_ENV === 'development' ? true : allowedOrigins,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-wedding-secret',
      'Accept',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
