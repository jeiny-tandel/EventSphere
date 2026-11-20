import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '../../../generated/prisma/client.js';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  error: string;
  message: string | string[];
}

function getHttpErrorName(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'Bad Request';
    case HttpStatus.UNAUTHORIZED:
      return 'Unauthorized';
    case HttpStatus.PAYMENT_REQUIRED:
      return 'Payment Required';
    case HttpStatus.FORBIDDEN:
      return 'Forbidden';
    case HttpStatus.NOT_FOUND:
      return 'Not Found';
    case HttpStatus.METHOD_NOT_ALLOWED:
      return 'Method Not Allowed';
    case HttpStatus.NOT_ACCEPTABLE:
      return 'Not Acceptable';
    case HttpStatus.CONFLICT:
      return 'Conflict';
    case HttpStatus.GONE:
      return 'Gone';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'Unprocessable Entity';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'Too Many Requests';
    case HttpStatus.INTERNAL_SERVER_ERROR:
      return 'Internal Server Error';
    case HttpStatus.BAD_GATEWAY:
      return 'Bad Gateway';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'Service Unavailable';
    case HttpStatus.GATEWAY_TIMEOUT:
      return 'Gateway Timeout';
    default:
      return HttpStatus[status]
        ? HttpStatus[status]
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : 'Error';
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      error = getHttpErrorName(statusCode);
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as Record<string, unknown>;

        if (res.message !== undefined) {
          if (Array.isArray(res.message)) {
            message = res.message.map((msg) => String(msg));
          } else if (typeof res.message === 'string') {
            message = res.message;
          } else {
            message = String(res.message);
          }
        } else {
          message = exception.message || error;
        }

        if (typeof res.error === 'string' && res.error.trim().length > 0) {
          error = res.error;
        }
      } else {
        message = exception.message || error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2000':
          statusCode = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          message = 'The provided value exceeds the maximum allowable length';
          break;

        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          error = 'Conflict';
          const rawTarget = exception.meta?.target;
          let fieldStr: string | null = null;

          if (Array.isArray(rawTarget)) {
            fieldStr = rawTarget
              .filter(
                (t): t is string =>
                  typeof t === 'string' && !t.includes('_key'),
              )
              .join(', ');
          } else if (
            typeof rawTarget === 'string' &&
            !rawTarget.includes('_key')
          ) {
            fieldStr = rawTarget;
          }

          message = fieldStr
            ? `A record with this ${fieldStr} already exists`
            : 'A record with this value already exists';
          break;
        }

        case 'P2003':
          statusCode = HttpStatus.CONFLICT;
          error = 'Conflict';
          message =
            'Cannot perform operation due to related records constraint';
          break;

        case 'P2014':
          statusCode = HttpStatus.CONFLICT;
          error = 'Conflict';
          message = 'The requested operation violates a relation constraint';
          break;

        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          error = 'Not Found';
          message = 'The requested record was not found';
          break;

        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          error = 'Internal Server Error';
          message = 'Internal server error';
          this.logger.error(
            `Unhandled Prisma error [${exception.code}]: ${exception.message}`,
            exception.stack,
          );
          break;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      message = 'Internal server error';

      if (exception instanceof Error) {
        this.logger.error(
          `Unhandled exception: ${exception.message}`,
          exception.stack,
        );
      } else {
        this.logger.error(`Unhandled exception: ${String(exception)}`);
      }
    }

    const path = this.httpAdapterHost.httpAdapter.getRequestUrl(request);

    const responseBody: ErrorResponse = {
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path,
      error,
      message,
    };

    this.httpAdapterHost.httpAdapter.reply(
      response,
      responseBody,
      statusCode,
    );
  }
}
