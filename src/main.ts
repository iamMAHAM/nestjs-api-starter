import 'reflect-metadata';
import { type INestApplication, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';
import type { AppConfigService } from './env.js';

const setupSwagger = (app: INestApplication) => {
	const config = new DocumentBuilder()
		.setTitle('Nexasmi API')
		.setDescription('REST API — Better Auth sessions, Zod-validated payloads.')
		.setVersion('1.0')
		.addCookieAuth('better-auth.session_token')
		.build();

	const document = SwaggerModule.createDocument(app, config);
	// Zod-derived schemas carry helpers Swagger UI chokes on; strip them.
	SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document), {
		swaggerOptions: { persistAuthorization: true },
	});
};

const bootstrap = async () => {
	const app = await NestFactory.create(AppModule, { bufferLogs: true });
	const config = app.get(ConfigService) as AppConfigService;
	const isProduction = config.get('NODE_ENV', { infer: true }) === 'production';

	app.useLogger(app.get(Logger));
	app.use(helmet({ contentSecurityPolicy: isProduction }));
	app.enableCors({
		origin: config.get('CORS_ORIGINS', { infer: true }),
		credentials: true,
	});
	app.enableShutdownHooks();

	// Better Auth owns `/api/auth/*` and must not be shifted under the prefix.
	app.setGlobalPrefix(config.get('API_PREFIX', { infer: true }), {
		exclude: [{ path: 'api/auth/*path', method: RequestMethod.ALL }],
	});

	if (!isProduction) setupSwagger(app);

	const port = config.get('PORT', { infer: true });
	await app.listen(port);
	app.get(Logger).log(`API listening on http://localhost:${port}`);
};

void bootstrap();
