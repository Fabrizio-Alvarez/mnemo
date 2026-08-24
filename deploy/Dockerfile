# Imagen de deploy para Fly.io — build de Next standalone.
# Local: docker build -f deploy/Dockerfile -t mnemo-web . (desde la raíz)
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# --- deps: instalar con lockfile (capa cacheable) ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/domain/package.json packages/domain/
COPY packages/db/package.json packages/db/
# el schema va en deps: el postinstall de packages/db corre `prisma generate`
COPY packages/db/prisma packages/db/prisma
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# --- build: prisma generate + next build standalone ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY packages/domain packages/domain
COPY packages/db packages/db
COPY apps/web apps/web
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
WORKDIR /app/apps/web
RUN pnpm --filter @mnemo/db exec prisma generate && pnpm build

# --- runtime: solo el standalone + estáticos + engine de prisma ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
# el standalone referencia el client generado dentro de node_modules
COPY --from=build /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/.pnpm/prisma*/node_modules/prisma ./node_modules/prisma

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
