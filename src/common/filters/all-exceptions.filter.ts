import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
	Inject,
	Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import { I18nService } from '../../i18n/i18n.service.js';
import { E, type ErrorCode } from '../errors/error-codes.js';

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
	[HttpStatus.UNAUTHORIZED]: E.UNAUTHORIZED,
	[HttpStatus.FORBIDDEN]: E.FORBIDDEN,
	[HttpStatus.NOT_FOUND]: E.NOT_FOUND,
	[HttpStatus.TOO_MANY_REQUESTS]: E.RATE_LIMITED,
};

/**
 * Last-resort filter: turns anything that escaped the specific filters into the
 * same response envelope, and makes sure internals never leak to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	constructor(@Inject(I18nService) private readonly i18n: I18nService) {}

	catch(exception: unknown, host: ArgumentsHost) {
		const res = host.switchToHttp().getResponse<Response>();

		if (exception instanceof ThrottlerException) {
			return this.send(res, HttpStatus.TOO_MANY_REQUESTS, E.RATE_LIMITED);
		}

		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			const code = STATUS_TO_CODE[status];
			if (code) return this.send(res, status, code);

			// Keep Nest's own payload (better-auth, guards, …) but normalize the shape.
			const payload = exception.getResponse();
			return res
				.status(status)
				.json(
					typeof payload === 'string'
						? { statusCode: status, message: payload }
						: { statusCode: status, ...(payload as Record<string, unknown>) },
				);
		}

		this.logger.error(
			exception instanceof Error ? exception.message : 'Unhandled exception',
			exception instanceof Error ? exception.stack : undefined,
		);
		return this.send(res, HttpStatus.INTERNAL_SERVER_ERROR, E.INTERNAL_ERROR);
	}

	private send(res: Response, statusCode: number, code: ErrorCode) {
		return res.status(statusCode).json({
			statusCode,
			code,
			message: this.i18n.tLoose(code),
		});
	}
}
