import { z } from 'zod';
import { E } from '../../common/errors/error-codes.js';
import { passwordSchema } from './password.js';

export const signUpSchema = z.object({
	email: z.email(),
	password: passwordSchema,
	name: z
		.string()
		.trim()
		.min(1, { error: E.NAME_INVALID })
		.max(80, { error: E.NAME_INVALID }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
