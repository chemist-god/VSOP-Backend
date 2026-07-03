import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationError } from '../../domain/application-error.base';
import { DomainError } from '../../domain/domain-error.base';

@Catch(DomainError, ApplicationError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError | ApplicationError, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof DomainError) {
      response.status(HttpStatus.CONFLICT).json({
        code: exception.code,
        message: exception.message,
        path: request.url,
      });
      return;
    }

    if (exception instanceof ApplicationError) {
      response.status(exception.statusHint).json({
        code: exception.code,
        message: exception.message,
        path: request.url,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      path: request.url,
    });
  }
}


