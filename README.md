# Siattu

**S**imple **I**nvoice **A**nd **T**ime **T**racking **U**tility — an extremely bare-bones web app for freelancers to create invoices and track billable time for clients.

Built with Next.js 16, NextAuth.js, Prisma 7 (SQLite via better-sqlite3), Bootstrap 5, and `@react-pdf/renderer` for PDF invoice generation.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite connection string, e.g. `file:./data.db` (local) or `file:/data/data.db` (Docker) |
| `AUTH_SECRET` | Yes | Secret used to sign session JWTs. Generate one with `openssl rand -hex 32` |
| `NEXTAUTH_URL` | Recommended | Canonical URL of the app, e.g. `http://localhost:3000`. Required for auth callbacks to work correctly behind a reverse proxy. |

---

## Local Development

**Prerequisites:** Node.js 20+

```bash
# 1. Install dependencies
#    --force is required due to a peer-dep conflict in the dependency tree
npm install --force

# 2. Create a .env file
#    Copy the values below and fill them in
cat > .env <<'EOF'
DATABASE_URL=file:./data.db
AUTH_SECRET=          # openssl rand -hex 32
NEXTAUTH_URL=http://localhost:3000
EOF

# 3. Generate the Prisma client and apply the schema
npx prisma generate
npx prisma db push

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000/setup](http://localhost:3000/setup) to create your account on first run.

**Note:** After any change to `prisma/schema.prisma`, re-run `npx prisma db push` and restart the dev server. The Prisma client is cached on `globalThis` and HMR will not reload it.

---

## Building for Production (without Docker)

```bash
npm install --force
npx prisma generate
npm run build
npx prisma db push   # applies schema to the production database
npm start
```

---

## Docker

The image is published to Docker Hub at [dmbob/siattu](https://hub.docker.com/r/dmbob/siattu). A new image is pushed automatically on every commit to `main` (tagged `:latest`) and on every `vX.Y.Z` git tag (tagged `:X.Y.Z` and `:X.Y`).

### Quick start with Docker Compose (recommended)

1. **Edit `docker-compose.yml`** — set a real `AUTH_SECRET` and update `NEXTAUTH_URL` if deploying anywhere other than localhost:

   ```yaml
   environment:
     DATABASE_URL: file:/data/data.db   # leave as-is; /data is the volume mount
     AUTH_SECRET: <output of: openssl rand -hex 32>
     NEXTAUTH_URL: https://your-domain.com
   ```

2. **Pull and start:**

   ```bash
   docker compose up -d
   ```

   To build locally from source instead, replace `image: dmbob/siattu:latest` with `build: .` in `docker-compose.yml` and run `docker compose up --build`.

   The SQLite database is persisted in `./data/data.db` on the host (created automatically). The schema is applied automatically on each container start before the app comes up.

3. **First run:** open [http://localhost:3000/setup](http://localhost:3000/setup) to create your account.

### Without Compose (raw Docker)

```bash
docker run -d \
  -p 3000:3000 \
  -v "$(pwd)/data:/data" \
  -e DATABASE_URL="file:/data/data.db" \
  -e AUTH_SECRET="<your-secret>" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  --name siattu \
  dmbob/siattu:latest
```

### How it works

- The image builds the Next.js app and pre-compiles the Prisma client.
- On startup, `prisma db push` creates or migrates the SQLite database, then `next start` serves the app.
- The database file lives at `/data/data.db` inside the container. Mount a host directory there to persist data across container restarts.
- `better-sqlite3` is a native addon compiled during the Docker build; no extra setup is needed at runtime.

---

## CI / Docker Hub publishing

The GitHub Actions workflow at [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml) handles builds and pushes automatically. It requires two secrets set in the repository (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username (`dmbob`) |
| `DOCKERHUB_TOKEN` | A Docker Hub access token (create one at hub.docker.com → Account Settings → Personal access tokens) |

To publish a versioned release, create and push a git tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will push both `dmbob/siattu:1.0.0` and `dmbob/siattu:1.0` to Docker Hub alongside `:latest`.

---

## Linting

```bash
npm run lint
```
