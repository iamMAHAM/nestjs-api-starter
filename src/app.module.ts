import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { BusinessErrorFilter } from './common/filters/business-error.filter.js';
import { ZodValidationFilter } from './common/filters/zod-validation.filter.js';
import { LocaleAwareZodValidationPipe } from './common/pipes/locale-aware-zod.pipe.js';
import { env, isProduction } from './config/env.js';
import { I18nModule } from './i18n/i18n.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: {
				level: env.LOG_LEVEL,
				genReqId: (req, res) => {
					const existing = req.headers['x-request-id'];
					const id = typeof existing === 'string' ? existing : randomUUID();
					res.setHeader('x-request-id', id);
					return id;
				},
				// Never let credentials or cookies reach the log sink.
				redact: [
					'req.headers.authorization',
					'req.headers.cookie',
					'res.headers["set-cookie"]',
				],
				autoLogging: { ignore: (req) => req.url === '/health' },
				transport: isProduction
					? undefined
					: { target: 'pino-pretty', options: { singleLine: true } },
			},
		}),
		ThrottlerModule.forRoot({
			throttlers: [{ ttl: env.THROTTLE_TTL, limit: env.THROTTLE_LIMIT }],
		}),
		PrismaModule,
		I18nModule,
		AuthModule,
		HealthModule,
		UsersModule,
	],
	providers: [
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_PIPE, useClass: LocaleAwareZodValidationPipe },
		// Filters are matched bottom-up: the catch-all must be registered first.
		{ provide: APP_FILTER, useClass: AllExceptionsFilter },
		{ provide: APP_FILTER, useClass: BusinessErrorFilter },
		{ provide: APP_FILTER, useClass: ZodValidationFilter },
	],
})
export class AppModule {}
