# NestJS API Starter

Base for all my NestJS APIs. Derived from
`nextjs-nestjs-prisma-postgres-biome-starter`, cut down to the API alone
(no monorepo, no frontend).

| Area            | Choice                                                        |
| --------------- | ------------------------------------------------------------- |
| Config          | `@nestjs/config` + `ConfigService`, Zod-validated at boot      |
| Runtime         | Node ≥ 22.12, **native ESM**, NestJS 11                        |
| Package manager | Bun                                                            |
| Lint / format   | Biome 2 (`biome.jsonc`)                                        |
| Git hooks       | Lefthook (pre-commit + pre-push)                               |
| Auth            | Better Auth + `@thallesp/nestjs-better-auth`                   |
| ORM             | Prisma 7 (driver adapter `@prisma/adapter-pg`)                 |
| Validation      | Zod 4 + `nestjs-zod`                                           |
| i18n            | i18next — messages **and** validation errors are localized     |
| API docs        | Swagger, generated from the Zod schemas                        |
| Logging         | Pino (`nestjs-pino`) with `x-request-id`                       |
| Tests           | Vitest (unit + e2e)                                            |
| Security        | Helmet, CORS, `@nestjs/throttler`                              |

## Getting started

```bash
cp .env.example .env
openssl rand -base64 32          # → BETTER_AUTH_SECRET
bun install
docker compose up -d             # Postgres 17
bun run db:push                  # or db:migrate for versioned migrations
bun run dev                      # http://localhost:4000 — docs at /docs
```

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Watch mode (tsc) |
| `bun run build` / `start` | Build, then run `dist/main.js` |
| `bun run check` / `check:fix` | Biome lint + format |
| `bun run check-types` | `tsc --noEmit` |
| `bun run test` / `test:e2e` / `test:cov` | Vitest |
| `bun run db:generate` / `db:push` / `db:migrate` / `db:studio` | Prisma |
| `bun run auth:generate` | Regenerate the Better Auth models in `schema.prisma` |
| `bun run i18n:gen-types` | Regenerate the translation types |
| `bun run i18n:check` | Check key parity across locales |

## Layout

```
.
├── prisma/
│   └── schema.prisma                 models (Better Auth + your own)
├── prisma.config.ts                  Prisma 7 CLI config — holds the datasource URL
├── src/
│   ├── main.ts                       bootstrap: helmet, CORS, prefix, Swagger
│   ├── app.module.ts                 ConfigModule + global pipe, guard, filters
│   ├── env.ts                        Zod env schema + AppConfigService type
│   │
│   ├── auth/
│   │   ├── auth.config.ts            createAuth(env) factory
│   │   ├── auth.cli.ts               entry point for @better-auth/cli only
│   │   └── auth.module.ts            AuthModule.forRootAsync
│   │
│   ├── prisma/
│   │   ├── prisma.service.ts         PrismaClient + lifecycle hooks
│   │   └── prisma.module.ts          @Global
│   │
│   ├── i18n/
│   │   ├── i18n.service.ts           t() / tLoose() / tFor(locale)
│   │   ├── i18n.middleware.ts        resolves the locale, stores it in ALS
│   │   ├── locale-context.ts         AsyncLocalStorage
│   │   ├── settings.ts               locales, namespaces, defaults
│   │   ├── locales/{en,fr}/          api · auth · errors · users
│   │   ├── generated/                translation types (committed)
│   │   └── scripts/                  gen-types · check-parity
│   │
│   ├── common/
│   │   ├── errors/                   BusinessError + error code catalogue
│   │   ├── filters/                  business · Zod validation · catch-all
│   │   └── pipes/                    locale-aware Zod pipe
│   │
│   ├── validators/                   shared Zod schemas
│   │   ├── auth/                     sign-in · sign-up · password
│   │   └── shared/                   locale · pagination · iso-date
│   │
│   ├── modules/
│   │   ├── health/                   liveness + database readiness probe
│   │   └── users/                    reference module — copy this one
│   │       ├── users.dto.ts          Zod schemas → createZodDto
│   │       ├── users.service.ts      business logic, throws BusinessError
│   │       ├── users.controller.ts   routes, @Session(), @ZodResponse
│   │       └── users.service.spec.ts
│   │
│   └── generated/prisma/             Prisma client (gitignored)
│
├── test/                             e2e specs
├── biome.jsonc · lefthook.yml        lint/format + git hooks
├── vitest.config.ts · .e2e.ts        unit + e2e runners
└── Dockerfile · docker-compose.yml   API image + Postgres 17
```

Unit tests live next to the code they cover (`*.spec.ts`); only e2e specs sit in
`test/`.

## Configuration

`ConfigModule.forRoot({ validate })` is registered globally in `app.module.ts`
with the Zod schema from `src/env.ts`. A missing or malformed variable fails the
boot and names the offending fields.

Type `ConfigService` with `AppConfigService` to get the **parsed** values back —
`PORT` is a `number`, `CORS_ORIGINS` an already-split `string[]`:

```ts
constructor(@Inject(ConfigService) private readonly config: AppConfigService) {}
this.config.get('PORT', { infer: true }); // number
```

`LoggerModule`, `ThrottlerModule` and `AuthModule` are declared with
`forRootAsync` and read their config the same way. In tests, override with
`ConfigModule.forRoot({ validate: () => … })` or `overrideProvider(ConfigService)`.

**One deliberate exception:** `src/auth/auth.cli.ts` loads and validates the
environment itself. `@better-auth/cli generate` imports that file standalone to
derive the Prisma models — it runs with no Nest container, so no `ConfigService`.
The file does nothing but `createAuth(validateEnv(process.env))`; the app never
imports it.

## Conventions

**Errors.** Throw `BusinessError` with a `namespace:CODE` code (see
`src/common/errors/error-codes.ts`). The code doubles as the i18n key: it stays
raw until the filter, which translates it into the request locale. Clients
always get the same envelope:

```json
{ "statusCode": 404, "code": "users:USER_NOT_FOUND", "message": "No user found with id nope." }
```

So a frontend can branch on `code` without ever parsing prose.

**Locale.** Resolved by middleware in this order: `x-locale` header → user
preference → `Accept-Language`, then stored in an `AsyncLocalStorage`. Zod's
*built-in* messages ("Invalid URL") are translated too, through the locale pack
`LocaleAwareZodValidationPipe` installs for the duration of the validation.

**Adding a translation.** Edit `src/i18n/locales/<locale>/<ns>.json`, then run
`bun run i18n:gen-types`. The pre-commit hook rejects a commit where one locale
has drifted from another.

**Auth.** `AuthModule` registers a **global** guard: every route is protected by
default. Use `@Public()` to open a route and `@Session()` to read the session.
Better Auth serves `/api/auth/*`, excluded from the `/v1` prefix.

## Two traps specific to this stack

**1 — `import type` breaks dependency injection.** NestJS resolves constructor
dependencies from the metadata `emitDecoratorMetadata` writes, which requires a
*value* import. Biome cannot tell that apart from a genuine type-only import,
and its autofix breaks DI silently at runtime. Hence
`style/useImportType: off` on `src/**/*.ts` in `biome.jsonc`.

**2 — do not use `tsx` to run the app.** `tsx` (esbuild) does not emit
`emitDecoratorMetadata`: the app boots, then every injected service is
`undefined`. So `bun run dev` uses `nest start --watch` (tsc). `tsx` is still
used for the DI-free scripts (i18n). For tests, Vitest goes through
`unplugin-swc` with `decoratorMetadata: true` — `users.service.spec.ts` holds a
test that explicitly checks injection still works.

## ESM

The project is native ESM (`"type": "module"`), because `better-auth` and
`@thallesp/nestjs-better-auth` no longer ship CommonJS. Consequences:

- relative imports carry the `.js` extension, even from a `.ts` file;
- no path aliases (`@/…`): `tsc` does not rewrite them and the runtime would
  crash. Relative paths only;
- locale files are imported with `with { type: 'json' }` and copied to `dist/`
  by the `assets` field in `nest-cli.json`.

## Docker

`docker-compose.yml` only provides Postgres (dev). The `Dockerfile` is a
multi-stage image for the API: built with Bun, run on `node:22-alpine` as a
non-root user.
