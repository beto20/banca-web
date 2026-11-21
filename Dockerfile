# --- Stage 1: build the Angular app ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies against the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: serve the static build with Nginx ---
FROM nginx:1.27-alpine

# SPA routing + /api reverse-proxy (listens on 8080, see nginx.conf).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular's application builder emits straight into dist/ (browser base = "").
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
