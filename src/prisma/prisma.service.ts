import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(PrismaService.name);

	constructor() {
		super({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
	}

	async onModuleInit() {
		await this.$connect();
		this.logger.log('Connected to Postgres');
	}

	async onModuleDestroy() {
		await this.$disconnect();
	}
}
