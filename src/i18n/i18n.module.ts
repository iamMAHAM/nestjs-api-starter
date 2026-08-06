import {
	Global,
	type MiddlewareConsumer,
	Module,
	type NestModule,
} from '@nestjs/common';
import { I18nMiddleware } from './i18n.middleware.js';
import { I18nService } from './i18n.service.js';

@Global()
@Module({
	providers: [I18nService],
	exports: [I18nService],
})
export class I18nModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(I18nMiddleware).forRoutes('*path');
	}
}
