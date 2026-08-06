import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/generated/**', 'src/**/*.spec.ts', 'src/i18n/scripts/**'],
		},
	},
	// NestJS resolves constructor dependencies from `emitDecoratorMetadata`,
	// which esbuild (Vitest's default transformer) does not emit. SWC does —
	// hence the explicit transform flags below.
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
