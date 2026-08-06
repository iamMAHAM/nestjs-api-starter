import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { Env } from '../env.js';
import { PrismaClient } from '../generated/prisma/client.js';

/** Only the slice of the environment Better Auth actually needs. */
export type AuthEnv = Pick<
	Env,
	| 'NODE_ENV'
	| 'DATABASE_URL'
	| 'BETTER_AUTH_SECRET'
	| 'BETTER_AUTH_URL'
	| 'BETTER_AUTH_TRUSTED_ORIGINS'
>;

/**
 * Better Auth needs its own Prisma client: the instance is built before Nest's
 * lifecycle hooks run, so it cannot reuse the connection `PrismaService` opens.
 */
export const createAuth = (env: AuthEnv) => {
	const prisma = new PrismaClient({
		adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
	});
	const isProduction = env.NODE_ENV === 'production';

	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
		database: prismaAdapter(prisma, { provider: 'postgresql' }),
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 8,
			maxPasswordLength: 128,
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // refresh the cookie once a day
		},
		advanced: {
			defaultCookieAttributes: {
				httpOnly: true,
				// Cross-site cookies require SameSite=None + Secure, which browsers
				// only honour over HTTPS — so keep Lax in local development.
				sameSite: isProduction ? 'none' : 'lax',
				secure: isProduction,
			},
		},
	});
};

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
export type AuthUser = Session['user'];
