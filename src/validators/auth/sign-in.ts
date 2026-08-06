import { z } from 'zod';
import { passwordSchema } from './password.js';

export const signInSchema = z.object({
	email: z.email(),
	password: passwordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
