# Server-App als Container-Image.
# Multi-Stage: Stufe "build" kompiliert TypeScript mit allen Abhaengigkeiten,
# Stufe "runtime" enthaelt nur das kompilierte JavaScript und die
# Produktivabhaengigkeiten (kein TypeScript, kein Vitest, keine Quellen).

# ---------- Stufe 1: Build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Zuerst nur die Paketdateien kopieren: Solange sie sich nicht aendern,
# verwendet Docker die zwischengespeicherte Schicht mit npm ci wieder.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# ---------- Stufe 2: Laufzeit ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Nicht als root laufen: das node-Image bringt den Benutzer "node" mit.
USER node

EXPOSE 3000

# Prueft den Endpunkt /health mit Node selbst (kein curl/wget im Image noetig).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec-Form: node laeuft als PID 1 und erhaelt SIGTERM direkt (siehe src/index.ts).
CMD ["node", "dist/src/index.js"]
