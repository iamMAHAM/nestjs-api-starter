import { Injectable } from '@nestjs/common';
import {
	type HealthIndicatorResult,
	HealthIndicatorService,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PrismaHealthIndicator {
	constructor(
		private readonly prisma: PrismaService,
		private readonly healthIndicatorService: HealthIndicatorService,
	) {}

	async isHealthy(key: string): Promise<HealthIndicatorResult> {
		const indicator = this.healthIndicatorService.check(key);
		const startedAt = performance.now();
		try {
			await this.prisma.$queryRaw`SELECT 1`;
			return indicator.up({
				responseTime: Math.round(performance.now() - startedAt),
			});
		} catch (error) {
			return indicator.down({
				message:
					error instanceof Error ? error.message : 'Database unreachable',
			});
		}
	}
}
