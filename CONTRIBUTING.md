# Contributing

Thanks for considering contributing to `reliable-node-utils`.

## Setup

```bash
git clone <repo-url>
cd qsk
npm install
```

## Development

- **Build:** `npm run build` (or `npm run dev` for watch)
- **Lint:** `npm run lint` (fix with `npm run lint:fix`)
- **Format:** `npm run format:check` / `npm run format`
- **Typecheck:** `npm run typecheck`
- **Tests:** `npm run test` (watch: `npm run test:watch`)
- **Coverage:** `npm run test:coverage` (target 90%+ for new code)

## Code standards

- TypeScript strict mode; no `any` without justification.
- Public API: JSDoc with `@param`, `@returns`, `@throws`, and at least one `@example` (TS and optionally JS).
- Named exports only; no default export from the package.
- New utilities: add under the right domain (`async/`, `fn/`, `object/`, `guards/`) and re-export from `src/index.ts`.
- Tests: mirror `src/` under `tests/`, cover edge cases and async behavior.

## Pull requests

1. Branch from `main`, make changes, run lint/format/typecheck/test.
2. Add or update tests for new or changed behavior.
3. For user-facing changes, add a **changeset**: `npx changeset`, choose type (patch/minor/major) and describe the change.
4. Open a PR; CI will run lint, format check, typecheck, and tests.

## CHANGELOG strategy

- We use [Changesets](https://github.com/changesets/changesets). Adding a changeset (`.md` file under `.changeset/`) drives the next release’s version and CHANGELOG.
- On release, `changeset version` updates versions and the CHANGELOG from changesets; no manual CHANGELOG edits for versioned releases.
- For small fixes or doc-only changes, use a patch changeset or skip a changeset if the maintainer will add one before release.

## Security

- Run `npm audit` locally; CI runs `npm audit --audit-level=high` (may be non-blocking).
- Do not commit secrets or tokens; use GitHub secrets (e.g. `NPM_TOKEN`) for publishing.
