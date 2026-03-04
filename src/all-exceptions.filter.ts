import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // For 401 Unauthorized, we pass through the standard message as requested by the Middleware requirement
    if (status === HttpStatus.UNAUTHORIZED) {
      if (exception instanceof HttpException) {
        return response.status(status).json(exception.getResponse());
      }
      return response.status(status).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Log the error for debugging purposes
    console.error('Unhandled Server Exception:', exception);

    // Standardize all other errors to prevent leaking system info
    response.status(status).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}
