# --- Build stage: compile the Vite app to static assets ---
FROM oven/bun:1 AS build
WORKDIR /app

# Install deps first (layer-cached unless the lockfile changes)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the static site. VITE_* vars are baked in at build time, so the
# GoatCounter site code must be present here (passed as a build arg by CI).
COPY . .
ARG VITE_GOATCOUNTER_SITE
ENV VITE_GOATCOUNTER_SITE=$VITE_GOATCOUNTER_SITE
RUN bun run build

# --- Runtime stage: serve dist/ with nginx ---
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
