import { Injectable } from '@nestjs/common';
import { BusinessError } from '../../common/errors/business-error.js';
import { E } from '../../common/errors/error-codes.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { paginate } from '../../validators/shared/pagination.js';
import type { ListUsersQueryDto, UpdateMeDto } from './users.dto.js';

const PUBLIC_FIELDS = {
	id: true,
	email: true,
	name: true,
	emailVerified: true,
	image: true,
	createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	async list(query: ListUsersQueryDto) {
		const where: Prisma.UserWhereInput = query.search
			? {
					OR: [
						{ email: { contains: query.search, mode: 'insensitive' } },
						{ name: { contains: query.search, mode: 'insensitive' } },
					],
				}
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

	async findById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: PUBLIC_FIELDS,
		});
		if (!user) {
			throw BusinessError.notFound(E.USER_NOT_FOUND, { interpolation: { id } });
		}
		return user;
	}

	update(id: string, input: UpdateMeDto) {
		return this.prisma.user.update({
			where: { id },
			data: input,
			select: PUBLIC_FIELDS,
		});
	}
}
