import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { isoDate } from '../../validators/shared/iso-date.js';
import { paginationSchema } from '../../validators/shared/pagination.js';

export const userSchema = z.object({
	id: z.string(),
	email: z.email(),
	name: z.string().nullable(),
	emailVerified: z.boolean(),
	image: z.url().nullable(),
	createdAt: isoDate,
});

export const listUsersQuerySchema = paginationSchema.extend({
	search: z.string().trim().min(1).max(80).optional(),
});

export const updateMeSchema = z.object({
	name: z.string().trim().min(1).max(80).optional(),
	image: z.url().nullable().optional(),
});

/** `createZodDto` gives Nest a class to reflect on, and Swagger a schema. */
export class UserDto extends createZodDto(userSchema) {}
export class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}
export class UpdateMeDto extends createZodDto(updateMeSchema) {}
