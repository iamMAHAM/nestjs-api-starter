import 'dotenv/config';
import { z } from 'zod';

const csv = z
	.string()
	.transform((value) =>
		value
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean),
	)
	.pipe(z.array(z.string()).min(1));

const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	PORT: z.coerce.number().int().positive().default(4000),
	LOG_LEVEL: z
		.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
		.default('info'),

	DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),

	BETTER_AUTH_SECRET: z.string().min(32, {
		error:
			'BETTER_AUTH_SECRET must be at least 32 chars (openssl rand -base64 32).',
	}),
	BETTER_AUTH_URL: z.url().default('http://localhost:4000'),
	// `.default()` on a piped schema takes the *output* type, hence the arrays.
	BETTER_AUTH_TRUSTED_ORIGINS: csv.default(['http://localhost:3000']),

	CORS_ORIGINS: csv.default(['http://localhost:3000']),
	API_PREFIX: z.string().default('v1'),

	THROTTLE_TTL: z.coerce.number().int().positive().default(60_000),
	THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	const details = z.prettifyError(parsed.error);
	// Fail loudly and early — a half-configured API is worse than no API.
	throw new Error(`Invalid environment variables:\n${details}`);
}

export const env: Readonly<Env> = Object.freeze(parsed.data);

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
