import './bootstrap';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (process.env.NODE_ENV === 'production') {
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
    });
  } else {
    app.enableCors();
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
