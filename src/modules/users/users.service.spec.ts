import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessError } from '../../common/errors/business-error.js';
import { E } from '../../common/errors/error-codes.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

const prismaMock = {
	user: { findUnique: vi.fn(), count: vi.fn(), findMany: vi.fn() },
	$transaction: vi.fn(),
};

describe('UsersService', () => {
	let users: UsersService;

	beforeEach(async () => {
		vi.resetAllMocks();
		const moduleRef = await Test.createTestingModule({
			providers: [UsersService],
		})
			.useMocker((token) => (token === PrismaService ? prismaMock : undefined))
			.compile();
		users = moduleRef.get(UsersService);
	});

	// Guards the emitDecoratorMetadata setup: without it Nest injects `undefined`
	// and every service silently breaks at the first property access.
	it('receives PrismaService through constructor injection', () => {
		expect(users).toBeInstanceOf(UsersService);
		expect(Reflect.get(users, 'prisma')).toBe(prismaMock);
	});

	it('returns the user when it exists', async () => {
		prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.c' });
		await expect(users.findById('u1')).resolves.toEqual({
			id: 'u1',
			email: 'a@b.c',
		});
	});

	it('throws a 404 BusinessError carrying the id for interpolation', async () => {
		prismaMock.user.findUnique.mockResolvedValue(null);
		const error = await users.findById('missing').catch((e) => e);
		expect(error).toBeInstanceOf(BusinessError);
		expect(error.code).toBe(E.USER_NOT_FOUND);
		expect(error.httpStatus).toBe(404);
		expect(error.interpolation).toEqual({ id: 'missing' });
	});

	it('paginates with the requested window', async () => {
		prismaMock.$transaction.mockResolvedValue([[{ id: 'u1' }], 42]);
		const result = await users.list({ page: 2, perPage: 20 });
		expect(result.meta).toEqual({
			page: 2,
			perPage: 20,
			total: 42,
			totalPages: 3,
		});
	});
});
