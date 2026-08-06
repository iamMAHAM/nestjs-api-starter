import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { BusinessErrorFilter } from './common/filters/business-error.filter.js';
import { ZodValidationFilter } from './common/filters/zod-validation.filter.js';
import { LocaleAwareZodValidationPipe } from './common/pipes/locale-aware-zod.pipe.js';
import { type AppConfigService, validateEnv } from './env.js';
import { I18nModule } from './i18n/i18n.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
			validate: validateEnv,
		}),
		LoggerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: AppConfigService) => ({
				pinoHttp: {
					level: config.get('LOG_LEVEL', { infer: true }),
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
					transport:
						config.get('NODE_ENV', { infer: true }) === 'production'
							? undefined
							: { target: 'pino-pretty', options: { singleLine: true } },
				},
			}),
		}),
		ThrottlerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: AppConfigService) => ({
				throttlers: [
					{
						ttl: config.get('THROTTLE_TTL', { infer: true }),
						limit: config.get('THROTTLE_LIMIT', { infer: true }),
					},
				],
			}),
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
