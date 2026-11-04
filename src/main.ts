import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { AppConfigService } from './env.js';

const setupSwagger = (app: INestApplication) => {
	const config = new DocumentBuilder()
		.setTitle('API')
		.setDescription('REST API — Better Auth sessions, Zod-validated payloads.')
		.setVersion('1.0')
		.addCookieAuth('better-auth.session_token')
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document, {
		swaggerOptions: { persistAuthorization: true },
	});
};

const bootstrap = async () => {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bufferLogs: true,
	});
	app.useLogger(app.get(Logger));

	const { isProduction } = configureApp(app);
	if (!isProduction) setupSwagger(app);

	const config = app.get(ConfigService) as AppConfigService;
	const port = config.get('PORT', { infer: true });
	await app.listen(port);
	app.get(Logger).log(`API listening on http://localhost:${port}`);
};

void bootstrap();
