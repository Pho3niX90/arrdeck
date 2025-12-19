# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Use the correct project name from angular.json
RUN npm run build -- --project=ArrDeck

# Stage 2: Build Backend
FROM node:22-alpine AS backend-build
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build
# Prune development dependencies
RUN npm prune --production

# Stage 3: Production
FROM node:22-alpine
WORKDIR /app

# Copy backend built files and dependencies
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./package.json

# Copy frontend built files to a static directory in backend
# Assuming output is dist/ArrDeck/browser based on application builder defaults
COPY --from=frontend-build /app/frontend/dist/ArrDeck/browser ./client

EXPOSE 4877

CMD ["node", "dist/main"]
