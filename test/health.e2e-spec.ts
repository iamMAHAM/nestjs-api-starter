import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

/**
 * Requires a reachable Postgres — `docker compose up -d` first.
 */
describe('Health (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleRef.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app?.close();
	});

	it('GET /health reports the database as up', async () => {
		const res = await request(app.getHttpServer()).get('/health').expect(200);
		expect(res.body.status).toBe('ok');
		expect(res.body.details.database.status).toBe('up');
	});

	it('honours the x-locale header', async () => {
		const res = await request(app.getHttpServer())
			.get('/health')
			.set('x-locale', 'fr')
			.expect(200);
		expect(res.body.message).toBe('API opérationnelle.');
	});

	it('rejects unauthenticated access to a protected route', async () => {
		await request(app.getHttpServer()).get('/users/me').expect(401);
	});
});
