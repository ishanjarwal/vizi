# System Architecture — Vizi

## 1. Monorepo Organization (Turborepo)

Vizi is organized as a standard Turborepo monorepo using `pnpm` workspaces. This guarantees clean boundaries, strict type sharing, and reproducible caching.

```
vizi/
├── .env.dev                    # Root dev env (injects NEXT_PUBLIC_* build args for Docker)
├── .env.prod                   # Root prod env (injects NEXT_PUBLIC_* build args for Docker)
├── docker-compose.yml          # Multi-container orchestration (server, web, healthchecks)
├── apps/
│   ├── web/                    # Next.js (App Router), React, Tailwind, shadcn/ui
│   │   ├── Dockerfile          # Multi-stage standalone Next.js container build
│   │   ├── .env.development   # Local Next.js dev variables
│   │   ├── .env.production    # Production web runtime variables (compose env_file)
│   │   ├── app/                # Route definitions (/ and /room/[id])
│   │   ├── components/         # Canvas UI, toolbar, properties panel, modals
│   │   ├── hooks/              # useCanvas, useWebSocket, useSyncState
│   │   └── lib/                # Canvas rendering pipeline & math utilities
│   └── server/                 # Lightweight Node.js WebSocket Server
│       ├── Dockerfile          # Multi-stage Node.js server container build
│       ├── docker-entrypoint.sh# Container bootstrap & DB preparation
│       ├── .env.dev            # Local server dev variables (tsx watch --env-file)
│       ├── .env.prod           # Production server runtime variables (compose env_file)
│       ├── src/
│       │   ├── room/           # Room manager & in-memory room lifecycle
│       │   ├── websocket/      # Connection handlers & router
│       │   ├── sync/           # Conflict resolution & broadcast logic
│       │   └── index.ts        # Server entrypoint
├── packages/
│   ├── protocol/               # Shared WS message types, payload schemas, events
│   ├── canvas-engine/          # Shared geometric types, bounding box & hit test math
│   ├── typescript-config/      # Shared tsconfig bases
│   └── eslint-config/          # Shared linting rules
├── .agent/                     # Agent instructions, skills, and project wiki
├── docs/                       # Long-form specifications and records
├── turbo.json                  # Turborepo task pipeline
├── pnpm-workspace.yaml         # Workspace package definitions
└── package.json                # Root package manifest
```

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client["Web Client (apps/web)"]
        UI["UI Layer\n(Toolbar / Modals / Canvas View)"]
        Engine["Canvas Engine\n(Double-buffered Canvas / WebGL)"]
        Store["Local State Manager\n(Active Elements Map)"]
        Queue["Offline / Outbox Queue\n(Pending Operations)"]
        WSClient["WebSocket Client\n(Auto-reconnect & Heartbeat)"]

        UI -->|Interactions| Engine
        Engine -->|Optimistic Mutations| Store
        Store -->|Enqueue Op| Queue
        Queue -->|Send Message| WSClient
    end

    subgraph Transport["Real-Time Channel"]
        WS["Full-Duplex WebSockets (ws / wss)"]
    end

    subgraph Server["Real-Time Server (apps/server)"]
        WSServer["WebSocket Gateway\n(Connection Pooling & Auth-free Rooms)"]
        RoomMgr["Room Manager\n(Active Rooms in Memory)"]
        SyncEngine["Conflict Resolution Engine\n(LWW + Version Checking)"]
        StoreAdapter["Persistence / Snapshot Adapter\n(In-memory / Disk cache)"]

        WSServer --> RoomMgr
        RoomMgr --> SyncEngine
        SyncEngine --> StoreAdapter
    end

    WSClient <-->|Bi-directional Events| WS
    WS <-->|Room Routing| WSServer
```

---

## 3. Real-Time WebSocket Protocol

All WebSocket frames transmit strictly-typed JSON messages defined in `@vizi/protocol`.

### 3.1 Message Envelope Specification

```typescript
export interface BaseMessage<TType extends string, TPayload> {
  type: TType;
  roomId: string;
  senderId: string;
  timestamp: number;
  payload: TPayload;
}
```

### 3.2 Core Event Catalog

| Event Name        | Direction                          | Description                                                                 |
| :---------------- | :--------------------------------- | :-------------------------------------------------------------------------- |
| `room:join`       | Client $\to$ Server                | Client requests to join a room with their ephemeral profile (name, color).  |
| `room:joined`     | Server $\to$ Client                | Server returns current room snapshot (elements, active peers).              |
| `presence:cursor` | Client $\rightleftharpoons$ Server | Ephemeral cursor coordinates `(x, y)` for multiplayer pointers (throttled). |
| `element:create`  | Client $\rightleftharpoons$ Server | Creation of one or more canvas elements.                                    |
| `element:update`  | Client $\rightleftharpoons$ Server | Mutation of existing elements (drag, resize, color, text).                  |
| `element:delete`  | Client $\rightleftharpoons$ Server | Soft-deletion / tombstoning of element IDs.                                 |
| `sync:request`    | Client $\to$ Server                | Request missing mutations after recovering from disconnection.              |
| `heartbeat:ping`  | Client $\rightleftharpoons$ Server | Keep-alive ping/pong frames every 5 seconds.                                |

---

## 4. State Synchronization & Conflict Resolution (LWW)

### 4.1 Last-Write-Wins (LWW) with Monotonic Versioning

To achieve near-zero latency without heavyweight CRDT operational overhead, Vizi employs **Element-Level Last-Write-Wins (LWW)** backed by version numbers and timestamps:

1. **Local Optimistic Mutation**:
   - The user draws or edits a shape.
   - The local element is immediately updated in memory.
   - The client increments `element.version += 1` and sets `element.updatedAt = Date.now()`.
2. **Server Ingestion & Reconciliation**:
   - The server inspects incoming `element:update`.
   - If `incoming.version > current.version` OR (`incoming.version === current.version` AND `incoming.updatedAt > current.updatedAt`), the change is accepted and persisted.
   - If accepted, the server broadcasts the accepted state to all other peers in the room.
3. **Idempotency & Deduplication**:
   - Every mutation payload contains an `opId: string` (UUID).
   - If an operation is received twice (e.g., due to network replay), the duplicate is dropped silently.
4. **Tombstone Deletion**:
   - Deleted elements are marked with `isDeleted: true` and retained for a grace period. This prevents an out-of-order delayed update from resurrecting an element that was previously deleted.

### 4.2 Orphaned & Inactive Room Lifecycle (Inngest Worker)

To prevent unbounded database growth and clear orphaned data, the backend integrates an **Inngest scheduled worker** (`cleanup-orphaned-rooms`):
- **Trigger**: Runs periodically on a cron schedule (`ROOM_CLEANUP_CRON`, default: hourly `0 * * * *`) and on-demand via event `vizi/rooms.cleanup`.
- **Retention Rule**: Rooms and associated canvas elements that have not been modified or accessed for $\ge 1$ day (`ROOM_RETENTION_MS`, default: 24h) are identified.
- **Active Session Safety**: If a candidate room has connected WebSocket peers in memory or recent in-memory activity, it is automatically protected and skipped.
- **Atomic Deletion**: Stale rooms and their canvas elements are atomically deleted from the database in a transaction and evicted from memory.

---

## 5. Fault Tolerance & Network Resilience

### 5.1 Connection State Machine

```mermaid
stateDiagram-v2
    [*] --> CONNECTING
    CONNECTING --> CONNECTED : Handshake Success
    CONNECTED --> RECONNECTING : Socket Closed / Heartbeat Missed
    RECONNECTING --> CONNECTING : Exponential Backoff Timer
    RECONNECTING --> OFFLINE : Max Retries or Network Down
    OFFLINE --> RECONNECTING : Browser Online Event
```

### 5.2 Resilient Reconnection Flow

1. **Heartbeat Failure Detection**:
   - Client and server exchange `ping` / `pong` frames every 5s.
   - If no reply is received within 3s, the socket is immediately terminated and reconnection begins.
2. **Exponential Backoff with Jitter**:
   - Retry intervals: $500\text{ms} \to 1000\text{ms} \to 2000\text{ms} \to 4000\text{ms}$ (capped at 10s) with $\pm 20\%$ randomized jitter to prevent thundering herds.
3. **Offline Outbox Mutation Queue**:
   - When disconnected, client drawing operations are written to an in-memory `mutationQueue`.
   - The user continues drawing uninterrupted.
   - Upon reconnection, the client sends `sync:request` with its `lastKnownServerVersion`, flushes its pending `mutationQueue`, and reconciles incoming server state.

---

## 6. Docker Containerization & Environment Configuration

### 6.1 Multi-Stage Container Pipeline

The repository includes production Dockerfiles for each service and a unified `docker-compose.yml` for containerized environments:

- **`apps/server/Dockerfile`**:
  - Multi-stage build (Node 22-slim base, builder with pnpm corepack, protocol compilation, Prisma generation, tsup build).
  - Unprivileged `vizi` user (UID 1001) for runtime isolation.
  - Custom `docker-entrypoint.sh` executing Prisma migrations before starting the Node process.
  - Integrated HTTP `/health` check via `wget`.
- **`apps/web/Dockerfile`**:
  - Multi-stage standalone Next.js build.
  - Injects `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` build arguments during `next build`.
  - Unprivileged `nextjs` user (UID 1001) running Next.js standalone output (`apps/web/server.js`).
  - Web service depends on `server` reaching healthy status (`condition: service_healthy`).

### 6.2 Two-Tier Environment Variable Architecture

Environment variables are partitioned between root-level build triggers and app-level service runtimes:

```
vizi/
├── .env.dev                    # Root: Dev NEXT_PUBLIC_* variables for Docker image builds
├── .env.prod                   # Root: Prod NEXT_PUBLIC_* variables for Docker image builds
├── apps/
│   ├── web/
│   │   ├── .env.development    # Next.js dev server variables (pnpm dev)
│   │   └── .env.production     # Next.js standalone container runtime variables
│   └── server/
│       ├── .env.dev            # Server dev variables (loaded via tsx --env-file)
│       └── .env.prod           # Server container runtime variables
```

#### Why Root Environment Files Exist
Next.js compiles public environment variables (`NEXT_PUBLIC_*`) directly into static JavaScript bundles at **build time** during `next build`. When building Docker images, these values must be present in the Docker build context. 

Docker Compose bridges this by reading `${NEXT_PUBLIC_API_URL}` and `${NEXT_PUBLIC_WS_URL}` from the root environment file and forwarding them as `args` to `apps/web/Dockerfile`. The root `.env.dev` and `.env.prod` exist specifically for this purpose.

#### Application-Level Runtime Isolation
- `apps/server/.env.prod`: Injected into `vizi-server` at container runtime via `docker-compose.yml` (`env_file: apps/server/.env.prod`) to configure internal Docker networking (`postgres:5432`), CORS origins, and heartbeat thresholds.
- `apps/web/.env.production`: Injected into `vizi-web` at container runtime via `docker-compose.yml` (`env_file: apps/web/.env.production`).

### 6.3 Docker Compose CLI & `--env-file` Requirement

By default, Docker Compose looks for a file named `.env` in the working directory. Because this project uses environment-explicit root files (`.env.dev` and `.env.prod`), **the `--env-file` parameter must be provided explicitly** whenever invoking Docker Compose:

```bash
# Development container build and startup
docker compose --env-file .env.dev build
docker compose --env-file .env.dev up -d

# Production container build and startup
docker compose --env-file .env.prod build
docker compose --env-file .env.prod up -d

# Teardown
docker compose --env-file .env.prod down
```

---

## 7. Guidelines for AI Coding Agents

When implementing features or modifying existing code in this repository:

1. **Type Locations**:
   - All shared data models, element schemas, and WS message types **must** live in `packages/protocol` or `packages/canvas-engine`.
   - Never redefine canvas elements or message envelopes locally inside `apps/web` or `apps/server`.
2. **Canvas Render Loop Separation**:
   - Keep the rendering loop independent from React's component re-render lifecycle. Use `requestAnimationFrame` and an explicit canvas renderer class/function to prevent React render thrashing during high-frequency drags.
3. **Validate External Boundaries**:
   - Always validate WebSocket payloads at the server gateway before modifying the room state.
4. **No Auth Logic**:
   - Do not introduce user tables, JWT tokens, cookies, or authentication middleware. The application is strictly link-based and anonymous.
5. **Preserve Documentation Integrity**:
   - If an architecture decision or data structure changes, update both this wiki and the files in `docs/`.
