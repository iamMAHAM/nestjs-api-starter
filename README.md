# NestJS API Starter

Base for all my NestJS APIs. Derived from
`nextjs-nestjs-prisma-postgres-biome-starter`, cut down to the API alone
(no monorepo, no frontend).

| Area            | Choice                                                     |
| --------------- | ---------------------------------------------------------- |
| Config          | `@nestjs/config` + `ConfigService`, Zod-validated at boot  |
| Runtime         | Node ≥ 24, **native ESM**, NestJS 12                       |
| Package manager | Bun                                                        |
| Lint / format   | Biome 2 (`biome.jsonc`)                                    |
| Git hooks       | Lefthook (pre-commit + pre-push)                           |
| Auth            | Better Auth + `@thallesp/nestjs-better-auth`               |
| ORM             | Prisma 7 (driver adapter `@prisma/adapter-pg`)             |
| Validation      | Zod 4 through Nest's built-in Standard Schema support      |
| i18n            | i18next — messages **and** validation errors are localized |
| API docs        | Swagger, generated from the Zod schemas                    |
| Logging         | Pino (`nestjs-pino`) with `x-request-id`                   |
| Tests           | Vitest (unit + e2e)                                        |
| Security        | Helmet, CORS, `@nestjs/throttler`, proxy-aware client IP   |
| CI              | GitHub Actions + Dependabot                                |

## Getting started

```bash
cp .env.example .env
openssl rand -base64 32          # → BETTER_AUTH_SECRET
bun install                      # also runs `prisma generate`
docker compose up -d             # Postgres 18
bun run db:migrate
bun run dev                      # http://localhost:4000 — docs at /docs
```

## Scripts

| Script                                                                       | Purpose                                              |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| `bun run dev`                                                                | Watch mode (tsc)                                     |
| `bun run build` / `start`                                                    | Build, then run `dist/main.js`                       |
| `bun run check` / `check:fix`                                                | Biome lint + format                                  |
| `bun run check-types`                                                        | `tsc --noEmit`                                       |
| `bun run test` / `test:e2e` / `test:cov`                                     | Vitest                                               |
| `bun run db:generate` / `db:push` / `db:migrate` / `db:deploy` / `db:studio` | Prisma                                               |
| `bun run auth:generate`                                                      | Regenerate the Better Auth models in `schema.prisma` |
| `bun run i18n:gen-types`                                                     | Regenerate the translation types                     |
| `bun run i18n:check`                                                         | Check key parity across locales                      |

## Layout

```
.
├── prisma/
│   ├── schema.prisma                 models (Better Auth + your own)
│   └── migrations/                   versioned migrations (committed)
├── prisma.config.ts                  Prisma 7 CLI config — holds the datasource URL
├── src/
│   ├── main.ts                       bootstrap: logger, Swagger, listen
│   ├── app.setup.ts                  configureApp(): proxy, helmet, CORS, prefix
│   ├── app.module.ts                 ConfigModule + global pipe, guard, filters
│   ├── env.ts                        Zod env schema + AppConfigService type
│   │
│   ├── auth/
│   │   ├── auth.config.ts            createAuth(env) factory
│   │   ├── auth.cli.ts               entry point for the Better Auth CLI only
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
│   │   ├── filters/                  business · schema validation · catch-all
│   │   ├── http/                     client IP · request id · @SchemaResponse
│   │   └── pipes/                    locale-aware validation pipe
│   │
│   ├── validators/                   shared Zod schemas
│   │   ├── auth/                     sign-in · sign-up · password
│   │   └── shared/                   locale · pagination · iso-date
│   │
│   ├── modules/
│   │   ├── health/                   liveness + database readiness probe
│   │   └── users/                    reference module — copy this one
│   │       ├── users.dto.ts          Zod schemas + inferred types
│   │       ├── users.service.ts      business logic, throws BusinessError
│   │       ├── users.controller.ts   routes, @Body({ schema }), @SchemaResponse
│   │       └── users.service.spec.ts
│   │
│   └── generated/prisma/             Prisma client (gitignored)
│
├── test/                             e2e specs
├── .github/                          CI + Dependabot
├── biome.jsonc · lefthook.yml        lint/format + git hooks
├── vitest.config.ts · .e2e.ts        unit + e2e runners
└── Dockerfile · docker-compose.yml   API image + Postgres 18
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
environment itself. The Better Auth CLI (`auth generate`) imports that file standalone to
derive the Prisma models — it runs with no Nest container, so no `ConfigService`.
The file does nothing but `createAuth(validateEnv(process.env))`; the app never
imports it.

## Conventions

**Errors.** Throw `BusinessError` with a `namespace:CODE` code (see
`src/common/errors/error-codes.ts`). The code doubles as the i18n key: it stays
raw until the filter, which translates it into the request locale. Clients
always get the same envelope:

```json
{
	"statusCode": 404,
	"code": "users:USER_NOT_FOUND",
	"message": "No user found with id nope."
}
```

So a frontend can branch on `code` without ever parsing prose.

**Locale.** Resolved by middleware in this order: `x-locale` header →
`Accept-Language`, then stored in an `AsyncLocalStorage`. Zod's
_built-in_ messages ("Invalid URL") are translated too: `LocaleAwareValidationPipe`
passes the request's locale pack to each parse.

**Validation.** Pass a Zod schema to the parameter decorator —
`@Body({ schema })`, `@Query({ schema })`, `@Param('id', { schema })` — and the
global `LocaleAwareValidationPipe` validates and transforms it. Type the
parameter with `z.output<typeof schema>`. Responses go through
`@SchemaResponse(schema)`, which strips unknown fields via
`StandardSchemaSerializerInterceptor` and documents the response in Swagger.

**Adding a translation.** Edit `src/i18n/locales/<locale>/<ns>.json`, then run
`bun run i18n:gen-types`. The pre-commit hook rejects a commit where one locale
has drifted from another.

**Auth.** `AuthModule` registers a **global** guard: every route is protected by
default. Use `@Public()` to open a route and `@Session()` to read the session.
Better Auth serves `/api/auth/*`, excluded from the `/v1` prefix (so is
`/health`). Other users are exposed without their email (`publicUserSchema`); only
`/v1/users/me` returns it. Email verification is not enabled — wire a mailer and
set `requireEmailVerification` before opening sign-up in production.

**Behind a proxy.** Set `TRUST_PROXY` (hop count or proxy IPs/CIDRs) so `req.ip`
is the real client. It feeds both rate limiters: Nest's throttler directly, and
Better Auth through the `x-client-ip` header `clientIpMiddleware` rewrites on
every request. Leave it `false` when the API is exposed directly.

**Cookies.** `AUTH_COOKIE_SAME_SITE=lax` (default) covers a frontend on the same
site (`app.example.com` + `api.example.com`). Use `none` only for a frontend on
another site; it requires HTTPS. CORS is driven by `CORS_ORIGINS` alone.

## Two traps specific to this stack

**1 — `import type` breaks dependency injection.** NestJS resolves constructor
dependencies from the metadata `emitDecoratorMetadata` writes, which requires a
_value_ import. Biome cannot tell that apart from a genuine type-only import,
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

`docker-compose.yml` only provides Postgres (dev, bound to localhost). The
`Dockerfile` is a multi-stage image for the API: built with Bun, run on
`node:26-alpine` as a non-root user, with a `HEALTHCHECK` on `/health`.
Migrations run from a separate target:

```bash
docker build --target migrate -t api-migrate .
docker run --rm -e DATABASE_URL=… api-migrate
```
