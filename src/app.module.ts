import { Module, StandardSchemaSerializerInterceptor } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
	APP_FILTER,
	APP_GUARD,
	APP_INTERCEPTOR,
	APP_PIPE,
	Reflector,
} from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { HEALTH_PATH } from './app.setup.js';
import { AuthModule } from './auth/auth.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { BusinessErrorFilter } from './common/filters/business-error.filter.js';
import { SchemaValidationFilter } from './common/filters/schema-validation.filter.js';
import {
	REQUEST_ID_HEADER,
	resolveRequestId,
} from './common/http/request-id.js';
import { LocaleAwareValidationPipe } from './common/pipes/locale-aware-validation.pipe.js';
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
						const id = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
						res.setHeader(REQUEST_ID_HEADER, id);
						return id;
					},
					// Never let credentials or cookies reach the log sink.
					redact: [
						'req.headers.authorization',
						'req.headers.cookie',
						'res.headers["set-cookie"]',
					],
					autoLogging: {
						ignore: (req) => req.url?.split('?')[0] === `/${HEALTH_PATH}`,
					},
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
		{ provide: APP_PIPE, useClass: LocaleAwareValidationPipe },
		{
			provide: APP_INTERCEPTOR,
			inject: [Reflector],
			useFactory: (reflector: Reflector) =>
				new StandardSchemaSerializerInterceptor(reflector),
		},
		// Filters are matched bottom-up: the catch-all must be registered first.
		{ provide: APP_FILTER, useClass: AllExceptionsFilter },
		{ provide: APP_FILTER, useClass: BusinessErrorFilter },
		{ provide: APP_FILTER, useClass: SchemaValidationFilter },
	],
})
export class AppModule {}
