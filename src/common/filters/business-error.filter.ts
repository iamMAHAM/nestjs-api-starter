import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import { I18nService } from '../../i18n/i18n.service.js';
import { BusinessError } from '../errors/business-error.js';

@Catch(BusinessError)
export class BusinessErrorFilter implements ExceptionFilter {
	constructor(@Inject(I18nService) private readonly i18n: I18nService) {}

	catch(error: BusinessError, host: ArgumentsHost) {
		const res = host.switchToHttp().getResponse<Response>();
		res.status(error.httpStatus).json({
			statusCode: error.httpStatus,
			code: error.code,
			message: this.i18n.tLoose(error.code, error.interpolation),
			...(error.details === undefined ? {} : { details: error.details }),
		});
	}
}
