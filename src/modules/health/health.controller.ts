import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '@thallesp/nestjs-better-auth';
import { I18nService } from '../../i18n/i18n.service.js';
import { PrismaHealthIndicator } from './prisma.health.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
	constructor(
		private readonly health: HealthCheckService,
		private readonly prismaIndicator: PrismaHealthIndicator,
		private readonly i18n: I18nService,
	) {}

	@Public()
	@Get()
	@HealthCheck()
	@ApiOperation({ summary: 'Liveness + database readiness probe' })
	async check() {
		const result = await this.health.check([
			() => this.prismaIndicator.isHealthy('database'),
		]);
		return {
			...result,
			message: this.i18n.t(
				result.status === 'ok'
					? 'api:healthcheck.ok'
					: 'api:healthcheck.degraded',
			),
		};
	}
}
