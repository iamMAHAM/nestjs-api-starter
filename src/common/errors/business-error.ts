import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from './error-codes.js';

export type BusinessErrorOptions = {
	httpStatus?: number;
	interpolation?: Record<string, unknown>;
	details?: unknown;
	cause?: unknown;
};

/**
 * Domain-level failure. Throw this instead of `HttpException` so the message
 * stays a translation key until the very last moment (see BusinessErrorFilter).
 */
export class BusinessError extends Error {
	readonly code: ErrorCode;
	readonly httpStatus: number;
	readonly interpolation?: Record<string, unknown>;
	readonly details?: unknown;

	constructor(code: ErrorCode, options: BusinessErrorOptions = {}) {
		super(code, { cause: options.cause });
		this.name = 'BusinessError';
		this.code = code;
		this.httpStatus = options.httpStatus ?? HttpStatus.BAD_REQUEST;
		this.interpolation = options.interpolation;
		this.details = options.details;
	}

	static notFound(code: ErrorCode, options: BusinessErrorOptions = {}) {
		return new BusinessError(code, {
			...options,
			httpStatus: HttpStatus.NOT_FOUND,
		});
	}

	static unauthorized(code: ErrorCode, options: BusinessErrorOptions = {}) {
		return new BusinessError(code, {
			...options,
			httpStatus: HttpStatus.UNAUTHORIZED,
		});
	}

	static forbidden(code: ErrorCode, options: BusinessErrorOptions = {}) {
		return new BusinessError(code, {
			...options,
			httpStatus: HttpStatus.FORBIDDEN,
		});
	}

	static conflict(code: ErrorCode, options: BusinessErrorOptions = {}) {
		return new BusinessError(code, {
			...options,
			httpStatus: HttpStatus.CONFLICT,
		});
	}
}
