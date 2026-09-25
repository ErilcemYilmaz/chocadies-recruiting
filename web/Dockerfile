# SPA Web-App (Kapitel 4.3) als Container-Image, Kapitel 4.4.1.
# Stufe "build" erzeugt mit Vite statische Dateien, Stufe "runtime" liefert
# sie mit nginx aus und leitet /v1 an die Server-App weiter.

# ---------- Stufe 1: Build ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Prototyp-Anmeldung (siehe src/auth/AuthKontext.tsx): Vite schreibt diese
# Werte beim Build fest ins JavaScript. In der CI bleiben sie leer, die
# Anmeldung ist dort also nicht moeglich. Lokal uebergibt docker compose sie
# aus web/.env.local (siehe docs/deployment.md). Solche Images nie pushen.
ARG VITE_DEMO_EMAIL=""
ARG VITE_DEMO_PASSWORT=""
ARG VITE_DEMO_NAME=""
ARG VITE_DEMO_ROLLE=""
ARG VITE_API_TOKEN=""

COPY . .
RUN VITE_DEMO_EMAIL="$VITE_DEMO_EMAIL" \
    VITE_DEMO_PASSWORT="$VITE_DEMO_PASSWORT" \
    VITE_DEMO_NAME="$VITE_DEMO_NAME" \
    VITE_DEMO_ROLLE="$VITE_DEMO_ROLLE" \
    VITE_API_TOKEN="$VITE_API_TOKEN" \
    npm run build

# ---------- Stufe 2: Auslieferung ----------
FROM nginx:alpine AS runtime

# Adresse der Server-App. Das nginx-Image ersetzt ${API_UPSTREAM} beim Start
# in der Vorlage (envsubst). Lokal: Dienst "server" aus docker-compose.yml.
ENV API_UPSTREAM=http://server:3000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/index.html || exit 1
