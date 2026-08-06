import { z } from 'zod';

export const paginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const paginate = <T>(
	items: T[],
	total: number,
	input: PaginationInput,
) => ({
	items,
	meta: {
		page: input.page,
		perPage: input.perPage,
		total,
		totalPages: Math.max(1, Math.ceil(total / input.perPage)),
	},
});
