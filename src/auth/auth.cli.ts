/**
 * Entry point for `@better-auth/cli` only — see the `auth:generate` script.
 *
 * The CLI imports this file standalone to derive the Prisma models from the
 * auth config, so it runs with no Nest container and no `ConfigService`. That
 * is why the environment is loaded and validated here directly. The app never
 * imports this file; it builds `auth` through `AuthModule.forRootAsync`.
 */
import 'dotenv/config';
import { validateEnv } from '../env.js';
import { createAuth } from './auth.config.js';

export const auth = createAuth(validateEnv(process.env));
