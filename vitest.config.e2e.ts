import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['test/**/*.e2e-spec.ts'],
		// E2E tests boot the whole app (Postgres + Better Auth), so they need room.
		testTimeout: 30_000,
		hookTimeout: 30_000,
		fileParallelism: false,
	},
	plugins: [
		swc.vite({
			module: { type: 'es6' },
			jsc: {
				target: 'es2023',
				parser: { syntax: 'typescript', decorators: true },
				transform: { legacyDecorator: true, decoratorMetadata: true },
				keepClassNames: true,
			},
		}),
	],
});
