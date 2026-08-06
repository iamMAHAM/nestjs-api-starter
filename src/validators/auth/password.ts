import { z } from 'zod';
import { E } from '../../common/errors/error-codes.js';

export const passwordSchema = z
	.string()
	.min(8, { error: E.PASSWORD_TOO_SHORT })
	.max(128, { error: E.PASSWORD_TOO_LONG });
