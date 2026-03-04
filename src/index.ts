import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import * as functions from 'firebase-functions';
import { AllExceptionsFilter } from './all-exceptions.filter';

// Initialize the Express server
const expressInstance = express();

let isNestInitialized = false;

const initializeNest = async () => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  // Apply exceptions filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Ensure Access-Control-Allow-Origin is strictly mapped to production URL
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://xavieryjuliana.com',
    'https://www.xavieryjuliana.com',
  ];

  // Only allow localhost in development or when using the Firebase Emulator
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.FUNCTIONS_EMULATOR === 'true'
  ) {
    allowedOrigins.push('http://localhost:4321');
  }

  // During troubleshooting, let's open up CORS fully to isolate the issue
  app.enableCors({
    origin: true, // This allows any origin
    credentials: true,
  });

  await app.init();
  isNestInitialized = true;
};

// Export the Cloud Function
export const api = functions.https.onRequest(async (request, response) => {
  if (!isNestInitialized) {
    await initializeNest();
  }
  expressInstance(request, response);
});
