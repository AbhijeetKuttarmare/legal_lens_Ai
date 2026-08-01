import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

// Persists unexpected 5xx errors to ErrorLog for the admin dashboard, while
// preserving Nest's default response shape so existing clients (mobile app)
// see no change in error bodies.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  constructor(private readonly prisma: PrismaService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttpException
      ? exception.getResponse()
      : { statusCode: status, message: 'Internal server error' };

    if (status >= 500) {
      const message = exception instanceof Error ? exception.message : String(exception);
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(message, stack);
      this.prisma.errorLog
        .create({
          data: {
            message,
            stack,
            path: request.originalUrl,
            method: request.method,
            statusCode: status,
          },
        })
        .catch((err) => this.logger.error('Failed to persist error log', err));
    }

    response.status(status).json(body);
  }
}
