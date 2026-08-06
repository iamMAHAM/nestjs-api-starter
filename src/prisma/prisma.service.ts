import {
	Inject,
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { AppConfigService } from '../env.js';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(PrismaService.name);

	constructor(@Inject(ConfigService) config: AppConfigService) {
		const connectionString = config.get('DATABASE_URL', { infer: true });
		super({ adapter: new PrismaPg({ connectionString }) });
	}

	async onModuleInit() {
		await this.$connect();
		this.logger.log('Connected to Postgres');
	}

	async onModuleDestroy() {
		await this.$disconnect();
	}
}
