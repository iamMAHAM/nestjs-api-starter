import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		// Not `env()`: it throws when unset, which breaks `prisma generate`.
		url: process.env.DATABASE_URL,
	},
});
