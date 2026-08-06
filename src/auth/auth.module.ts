import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth.config.js';

/**
 * Mounts Better Auth's handler under `/api/auth/*` and exposes `AuthGuard`,
 * `@Session()`, `@Public()` and friends to the rest of the app.
 */
@Module({
	imports: [BetterAuthModule.forRoot({ auth })],
	exports: [BetterAuthModule],
})
export class AuthModule {}
