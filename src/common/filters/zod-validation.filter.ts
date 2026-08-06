import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpStatus,
	Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import type { ZodError } from 'zod';
import { I18nService } from '../../i18n/i18n.service.js';
import { E } from '../errors/error-codes.js';

/** Matches our `namespace:ERROR_CODE` convention. */
const I18N_KEY_PATTERN = /^[a-z][a-z0-9_-]*:[A-Z0-9_]+$/;

@Catch(ZodValidationException)
export class ZodValidationFilter implements ExceptionFilter {
	constructor(@Inject(I18nService) private readonly i18n: I18nService) {}

	catch(exception: ZodValidationException, host: ArgumentsHost) {
		const res = host.switchToHttp().getResponse<Response>();
		const zodError = exception.getZodError() as ZodError;

		const errors = zodError.issues.map((issue) => {
			const path = issue.path.join('.');
			const messageKey = this.extractMessageKey(issue.message);
			// A schema that used one of our codes gets translated; anything else is
			// already a Zod built-in message localized by LocaleAwareZodValidationPipe.
			return messageKey
				? { path, code: messageKey, message: this.i18n.tLoose(messageKey) }
				: { path, message: issue.message };
		});

		res.status(HttpStatus.BAD_REQUEST).json({
			statusCode: HttpStatus.BAD_REQUEST,
			code: E.VALIDATION_FAILED,
			message: this.i18n.tLoose(E.VALIDATION_FAILED),
			errors,
		});
	}

	private extractMessageKey(message: string): string | undefined {
		const trimmed = message.trim();
		return I18N_KEY_PATTERN.test(trimmed) ? trimmed : undefined;
	}
}
