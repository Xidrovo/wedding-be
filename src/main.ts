import './bootstrap';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Ensure Access-Control-Allow-Origin is strictly mapped to production URL
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://xavieryjuliana.com',
      'https://www.xavieryjuliana.com',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
