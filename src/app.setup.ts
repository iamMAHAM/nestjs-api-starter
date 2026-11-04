import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { clientIpMiddleware } from './common/http/client-ip.js';
import type { AppConfigService } from './env.js';

export const HEALTH_PATH = 'health';

/** Shared by `main.ts` and the e2e tests. Call before `init()`/`listen()`. */
export const configureApp = (app: NestExpressApplication) => {
	const config = app.get(ConfigService) as AppConfigService;
	const isProduction = config.get('NODE_ENV', { infer: true }) === 'production';

	app.set('trust proxy', config.get('TRUST_PROXY', { infer: true }));
	app.use(clientIpMiddleware);
	app.use(helmet({ contentSecurityPolicy: isProduction }));
	app.enableCors({
		origin: config.get('CORS_ORIGINS', { infer: true }),
		credentials: true,
	});
	app.enableShutdownHooks();

	// Better Auth owns `/api/auth/*`; probes stay at `/health`.
	app.setGlobalPrefix(config.get('API_PREFIX', { infer: true }), {
		exclude: [
			{ path: 'api/auth/*path', method: RequestMethod.ALL },
			{ path: HEALTH_PATH, method: RequestMethod.GET },
		],
	});

	return { isProduction };
};
