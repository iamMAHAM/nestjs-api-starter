import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
	httpsUrlSchema,
	isHttpsUrl,
} from '../../validators/shared/https-url.js';
import { isoDate } from '../../validators/shared/iso-date.js';
import {
	paginatedSchema,
	paginationSchema,
} from '../../validators/shared/pagination.js';

// What other users may see — no email.
export const publicUserSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	// Rows written before the https rule never reach a client.
	image: z.preprocess(
		(value) => (isHttpsUrl(value) ? value : null),
		z.string().nullable(),
	),
	createdAt: isoDate,
});

export const userSchema = publicUserSchema.extend({
	email: z.email(),
	emailVerified: z.boolean(),
});

export const listUsersQuerySchema = paginationSchema.extend({
	search: z.string().trim().min(1).max(80).optional(),
});

export const updateMeSchema = z.object({
	name: z.string().trim().min(1).max(80).optional(),
	image: httpsUrlSchema.nullable().optional(),
});

/** `createZodDto` gives Nest a class to reflect on, and Swagger a schema. */
export class UserDto extends createZodDto(userSchema) {}
export class PublicUserDto extends createZodDto(publicUserSchema) {}
export class PublicUserPageDto extends createZodDto(
	paginatedSchema(publicUserSchema),
) {}
export class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}
export class UpdateMeDto extends createZodDto(updateMeSchema) {}
