import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { env, isProduction } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Better Auth needs its own client: it is instantiated at module load, before
 * Nest's DI container exists, and `@better-auth/cli generate` imports this file
 * standalone to derive the Prisma schema.
 */
const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

export const auth = betterAuth({
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
			// Cross-site cookies require SameSite=None + Secure, which browsers only
			// honour over HTTPS — so keep Lax in local development.
			sameSite: isProduction ? 'none' : 'lax',
			secure: isProduction,
		},
	},
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type AuthUser = Session['user'];
