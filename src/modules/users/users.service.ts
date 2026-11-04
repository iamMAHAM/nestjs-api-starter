import { Injectable } from '@nestjs/common';
import { BusinessError } from '../../common/errors/business-error.js';
import { E } from '../../common/errors/error-codes.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../validators/shared/pagination.js';
import type { ListUsersQuery, UpdateMe } from './users.dto.js';

const PUBLIC_FIELDS = {
	id: true,
	name: true,
	image: true,
	createdAt: true,
} satisfies Prisma.UserSelect;

const SELF_FIELDS = {
	...PUBLIC_FIELDS,
	email: true,
	emailVerified: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	async list(query: ListUsersQuery) {
		const where: Prisma.UserWhereInput = query.search
			? { name: { contains: query.search, mode: 'insensitive' } }
			: {};

		const [items, total] = await this.prisma.$transaction([
			this.prisma.user.findMany({
				where,
				select: PUBLIC_FIELDS,
				orderBy: { createdAt: 'desc' },
				skip: (query.page - 1) * query.perPage,
				take: query.perPage,
			}),
			this.prisma.user.count({ where }),
		]);

		return paginate(items, total, query);
	}

	findPublicById(id: string) {
		return this.findOrThrow(id, PUBLIC_FIELDS);
	}

	findSelf(id: string) {
		return this.findOrThrow(id, SELF_FIELDS);
	}

	update(id: string, input: UpdateMe) {
		return this.prisma.user.update({
			where: { id },
			data: input,
			select: SELF_FIELDS,
		});
	}

	private async findOrThrow<S extends Prisma.UserSelect>(
		id: string,
		select: S,
	) {
		const user = await this.prisma.user.findUnique({ where: { id }, select });
		if (!user) {
			throw BusinessError.notFound(E.USER_NOT_FOUND, { interpolation: { id } });
		}
		return user;
	}
}
