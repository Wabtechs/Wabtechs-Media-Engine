# Wabtechs-Media-Engine

> **Central media service for the Wabtechs ecosystem** — handling image upload, processing, storage, and delivery for Bilengi, Dhayaro, Sante Connect, Archivium, and future applications.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/node.js-22+-green.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-10.4.1-fuchsia.svg)](https://pnpm.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:up

# 3. Run migrations
pnpm db:migrate

# 4. Start the API server
pnpm dev

# 5. Access the API at http://localhost:3000
```

## 📦 Features (MVP)

### Core Functionality

| Feature | Status |
|---------|--------|
| **Image Upload** | ✅ MIME validation, size limits, dimensions |
| **Image Processing** | ✅ Sharp: resize, compression, format conversion |
| **Media Profiles** | ✅ avatar, product, feed, story, reel-cover, banner, document, medical, generic |
| **Variants** | ✅ thumbnail, small, medium, large, original |
| **Storage Abstraction** | ✅ LocalStorage + S3-compatible (minimizes provider coupling) |
| **CDN Delivery** | ✅ URLs with Cache-Control/ETag headers |
| **Database** | ✅ PostgreSQL + Drizzle ORM |
| **Job Queue** | ✅ BullMQ + Redis (media.upload, media.optimize, media.generate_variants, media.cleanup) |
| **API v1** | ✅ `/api/v1/media/*` with auth + tenant isolation |
| **Security** | ✅ Rate limiting, MIME validation, file size limits, path traversal protection |
| **Privacy** | ✅ PUBLIC and PRIVATE modes with signed URLs |
| **Docker** | ✅ `docker compose up` (5 services: api, worker, postgres, redis, minio) |
| **Tests** | ✅ 4 test files (profiles, utils, image processing, storage) |
| **Type-check** | ✅ `pnpm typecheck` passes |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/media/upload` | `POST` | Upload media file (multipart) |
| `/api/v1/media/:id` | `GET` | Get media by ID (tenant-scoped) |
| `/api/v1/media/:id/variants` | `GET` | Get all variants for media |
| `/api/v1/media/:id/url` | `GET` | Get CDN URL for a variant |
| `/api/v1/media/:id/url` | `GET` | Get URL with `?width=` or `?variant=` |
| `/api/v1/media/:id/process` | `POST` | Queue processing job |
| `/api/v1/media/:id/process` | `POST` | Remove background |
| `/api/v1/media/:id` | `DELETE` | Soft-delete media |
| `/api/v1/media` | `GET` | List media by application/tenant |
| `/health` | `GET` | Health check |
| `/ready` | `GET` | Readiness check |

### Example: Upload & Get Variants

```ts
// Upload a file
const media = await mediaClient.upload(file, {
  applicationId: "bilengi",
  purpose: "product",
});

// Get variant URLs
const mediumUrl = media.variants.medium.url;
const smallUrl = media.variants.small.url;

// Remove background
await mediaClient.removeBackground(media.id);
```

## 🏗️ Architecture

```
wabtechs-core
     ↓ Contracts

Wabtechs-Media-Engine
     ↓ Implementation

@wabtechs/media-client
     ↓ Client SDK

Bilengi / Dhayaro / Sante Connect
     ↓ Consumers
```

### Directory Structure

```
src/
├── api/              # Fastify routes + middleware (auth, validation)
├── application/      # Application services (media, upload, delivery)
├── domain/           # Types, profiles, utils, events
├── infrastructure/   # DB, storage, queue, CDN providers
├── processors/       # Sharp-based image processing
├── workers/          # BullMQ workers (image optimization, cleanup)
└── providers/        # Background removal provider system

docker/
├── Dockerfile
└── docker-compose.yml

migrations/           # SQL migrations (Drizzle ORM)

tests/                # Vitest unit tests
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web Framework** | Fastify v5 |
| **Language** | TypeScript 5.8+ (strict mode) |
| **ORM** | Drizzle ORM |
| **Database** | PostgreSQL 16 |
| **Queue** | Redis + BullMQ |
| **Image Processing** | Sharp v0.33 |
| **Validation** | Zod 3.24 |
| **Package Manager** | pnpm 10.4.1 |
| **Containerization** | Docker + Docker Compose |

### Design Principles (from wabtechs-core)

- ✅ **No business logic in Core** — business lives in applications
- ✅ **No cross-module imports** — modules communicate via events
- ✅ **TypeScript strict** — `any` is forbidden
- ✅ **Zod mandatory** on all API inputs/outputs
- ✅ **`tenant_id` on every entity** — multi-tenant by default
- ✅ **Tests mandatory** — no merge without tests
- ✅ **No duplication** — shared utilities live in `@wabtechs/core`
- ✅ **Architecture changes** require ADR first

## 🐳 Docker Development

```bash
# Start all services (API, Worker, DB, Redis, MinIO)
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down

# Rebuild images
pnpm docker:build
```

### Services Included

| Service | Port | Description |
|---------|------|-------------|
| **media-api** | 3000 | Fastify API server |
| **media-worker** | — | BullMQ worker for image processing |
| **postgres** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis for job queue |
| **minio** | 9000 | S3-compatible object storage |

### Environment Variables

Copy `.env.example` and configure:

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/media_engine

# Redis
REDIS_URL=redis://localhost:6379

# Storage (local by default)
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./storage
CDN_BASE_URL=http://localhost:9000/media-engine

# Security
API_KEY_SALT=change-this-in-production
MAX_UPLOAD_SIZE_MB=50
RATE_LIMIT_MAX=100

# Processing
BACKGROUND_REMOVAL_PROVIDER=local
IMAGE_PROCESSING_CONCURRENCY=4
WORKER_CONCURRENCY=2
```

## 🛠️ Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start API in watch mode (`tsx watch src/server.ts`) |
| `pnpm start` | Start production server (`node dist/server.js`) |
| `pnpm build` | Compile TypeScript |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint issues |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm typecheck` | Run TypeScript type-check |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm docker:up` | Start Docker environment |
| `pnpm docker:down` | Stop Docker environment |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:push` | Push schema to DB |

### Adding a New Media Profile

1. Define the profile in `src/domain/profiles.ts`
2. Add variant configurations (maxWidth, maxHeight, quality, format)
3. The profile is automatically available via `getProfile('profilename')`

### Adding a New Image Format

1. Add the format to the `ImageFormat` type in `src/domain/types.ts`
2. Add handling in `src/processors/image/index.ts` (generateVariant, convertFormat)
3. Add the format to allowed MIME types in `src/domain/utils.ts`

## 📦 SDK Client (Future)

The `@wabtechs/media-client` package will depend on `@wabtechs/core` and provide:

```ts
import { MediaClient } from '@wabtechs/media-client';

const client = new MediaClient({ apiBaseUrl: 'http://localhost:3000' });

// Upload
const media = await client.upload(file, {
  applicationId: 'bilengi',
  purpose: 'product',
});

// Get variants
const mediumUrl = media.variants.medium.url;

// Background removal
await client.removeBackground(media.id);

// Get URL
const url = await client.getUrl(media.id, { variant: 'medium' });
```

## 📜 License

MIT © Wabtechs

## 🤝 Integration

This Media Engine is designed to be used by multiple Wabtechs applications without modification:

- **Bilengi** — product images, marketplace listings
- **Dhayaro** — document management, medical records
- **Sante Connect** — medical imaging, patient records
- **Archivium** — document archiving, compliance

Each application uses `applicationId` and `tenantId` to isolate their media assets.

```ts
// Example: Bilengi product image
const media = await mediaClient.upload(file, {
  applicationId: 'bilengi',
  purpose: 'product',
});

// Example: Dhayaro medical document
const media = await mediaClient.upload(file, {
  applicationId: 'dhayaro',
  purpose: 'medical',
  privacy: 'private',
});
```

---

*Built with ❤️ for the Wabtechs ecosystem.*