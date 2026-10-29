# Vizi — Real-Time Collaborative Whiteboard

<div align="center">

![Vizi Banner](https://res.cloudinary.com/dsf4t9wmc/image/upload/v1792592070/Vizi_OG_qhcxb3.png)

**A high-performance, low-latency collaborative infinite canvas built to demonstrate distributed real-time systems, fault tolerance, and fluid visual interaction.**

[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-000000?style=flat&logo=turborepo&logoColor=white)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![WebSockets](https://img.shields.io/badge/Protocol-WebSockets-010101?style=flat&logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![pnpm](https://img.shields.io/badge/Package_Manager-pnpm-F69220?style=flat&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Overview](.agent/wiki/project-overview.md) • [Architecture](.agent/wiki/architecture.md) • [Guidelines](AGENTS.md)

</div>

---

## 💡 Overview

**Vizi** is a lightweight yet powerful collaborative whiteboard application designed from the ground up for instantaneous visual ideation.

Unlike traditional whiteboard tools weighed down by account creation, onboarding funnels, and heavy collaboration runtimes, Vizi offers **zero-friction entry**: create a room with one click, share a link or scan a QR code, and collaborate in real-time with sub-50ms peer synchronization.

Beyond its intuitive drawing interface, Vizi serves as an engineering showcase for **low-latency state synchronization, custom canvas rendering, and network fault tolerance** under unpredictable connection conditions.

---

## ✨ Key Features

- **🚀 Instant, Zero-Authentication Rooms**: Create anonymous collaborative rooms instantly. Anyone with the link or QR code can participate seamlessly without account sign-ups.
- **♾️ Infinite Canvas**: Pan, zoom (10% to 500%), and navigate an unbounded 2D workspace with double-buffered, hardware-accelerated rendering.
- **🎨 Primitive Shape Engine**:
  - **Rectangle**: Corner rounding, fill, border weight, and solid/dashed strokes.
  - **Ellipse**: Circular and oval geometry with customizable styling.
  - **Line & Arrow**: Multi-point segments and directional vectors with customizable arrowheads.
  - **Pen (Freehand)**: Low-latency smooth curve interpolation with pressure awareness.
  - **Centered Text Overlay**: Direct centered text labelling on any primitive shape.
- **⚡ Low-Latency Real-Time Sync**: Bi-directional WebSocket transport delivering live shape manipulation and multiplayer cursor presence.
- **🛡️ Fault Tolerance & Offline Drawing**:
  - **Optimistic Rendering**: Canvas mutations take effect locally in $<16\text{ms}$.
  - **Offline Outbox Queue**: Draw uninterrupted through network blips; pending mutations are queued and replayed upon reconnection.
  - **Last-Write-Wins (LWW) Conflict Resolution**: Monotonic version vectors ensure deterministic state convergence without state corruption.
- **📦 Import & Export Ecosystem**:
  - Export to high-resolution **PNG** (cropped bounding box with padding) or multi-format **PDF**.
  - Export to version-validated **JSON** schemas, and import canvas documents back at any time.

---

## 🏗️ Monorepo Architecture

Vizi is built as a modular **Turborepo** monorepo managed with `pnpm workspaces`:

```
vizi/
├── .env.dev                     # Root dev env (injects NEXT_PUBLIC_* build args for Docker)
├── .env.prod                    # Root prod env (injects NEXT_PUBLIC_* build args for Docker)
├── docker-compose.yml           # Multi-service local production container orchestration
├── apps/
│   ├── web/                     # Next.js (App Router), React, Tailwind CSS, shadcn/ui
│   │   ├── Dockerfile           # Multi-stage Next.js standalone container build
│   │   ├── .env.development    # Local development environment configuration
│   │   └── .env.production     # Production runtime environment configuration
│   └── server/                  # Dedicated Node.js WebSocket synchronization server
│       ├── Dockerfile           # Multi-stage Node.js server container build
│       ├── .env.dev             # Local development environment configuration
│       └── .env.prod            # Production runtime environment configuration
├── packages/
│   ├── protocol/                # Shared WebSocket message envelopes, payload schemas & events
│   ├── canvas-engine/           # Shared geometry, coordinate transforms & hit-testing math
│   ├── typescript-config/       # Base TypeScript configurations
│   └── eslint-config/           # Unified linting rules
├── .agent/
│   └── wiki/                    # Engineering knowledge base & architecture documentation
└── docs/                        # Formal PRD, Architecture, and DB schema specifications
```

---

## 🔄 Real-Time Synchronization & Fault Tolerance

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Client A (Offline)
    actor Bob as Client B (Online)
    participant S as WebSocket Server

    Alice->>Alice: Draw Rectangle (Optimistic render < 16ms)
    Note over Alice: Network dropped; queued in Outbox
    Alice->>Alice: Auto-reconnect with Exponential Backoff
    Alice->>S: WS Reconnect + sync:request(lastKnownVersion)
    S-->>Alice: sync:state(missingEvents)
    Alice->>S: Flush Outbox (element:create, opId=x)
    S->>S: LWW Version Check & De-duplication
    S-->>Bob: Broadcast element:create (opId=x)
    Bob->>Bob: Render element on Canvas
```

---

## 🛠️ Tech Stack

| Layer                         | Technology                                                                                                              |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Monorepo Engine**           | [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/)                                                            |
| **Web Frontend**              | [Next.js (App Router)](https://nextjs.org/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI**              | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide Icons                             |
| **Canvas Engine**             | HTML5 `<canvas>` with custom double-buffered rendering pipeline                                                         |
| **Real-Time Backend**         | Node.js, [WebSockets (`ws`)](https://github.com/websockets/ws), in-memory room pool                                     |
| **Shared Protocol**           | Zod schema validation & shared TypeScript interfaces                                                                    |
| **Container & Orchestration** | [Docker](https://www.docker.com/), Multi-stage Dockerfiles, [Docker Compose](https://docs.docker.com/compose/)          |

---

## ⚙️ Environment Variables Architecture

With the introduction of Docker, environment variables are organized into a structured two-tier hierarchy across the root and each workspace application:

```
vizi/
├── .env.dev                 # [ROOT] Dev build-time variables (NEXT_PUBLIC_*)
├── .env.prod                # [ROOT] Prod build-time variables (NEXT_PUBLIC_*)
├── apps/
│   ├── web/
│   │   ├── .env.development # Local Next.js dev variables
│   │   └── .env.production  # Web container runtime variables (used by compose)
│   └── server/
│       ├── .env.dev         # Local Server dev variables
│       └── .env.prod        # Server container runtime variables (used by compose)
```

### 1. Root-Level Environment Files (`.env.dev`, `.env.prod`)
The root environment files currently have **one specific purpose**: providing the `NEXT_PUBLIC_*` environment variables (`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`) during Docker image builds.

> [!IMPORTANT]
> **Why Root Env Files Exist**: Next.js statically bakes all `NEXT_PUBLIC_*` variables into client-side JavaScript bundles at **build time** during `next build`. Because Docker images are built before containers run, these variables cannot simply be supplied at runtime. Docker Compose interpolates them from the root environment file and passes them as Docker `build.args` to `apps/web/Dockerfile`.

### 2. Application-Level Environment Files
- **`apps/server/`**:
  - `.env.dev`: Local development configuration (Postgres host/port, dev CORS origins). Loaded automatically when running `pnpm dev` via `tsx watch --env-file=".env.dev"`.
  - `.env.prod`: Container runtime configuration (internal Docker network Postgres host, production CORS origins). Referenced directly by `docker-compose.yml` (`env_file: apps/server/.env.prod`).
- **`apps/web/`**:
  - `.env.development`: Next.js development environment configuration loaded during `next dev`.
  - `.env.production`: Container runtime configuration referenced by `docker-compose.yml` (`env_file: apps/web/.env.production`).

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) `>= 20.0.0`
- [pnpm](https://pnpm.io/) `>= 9.0.0`
- [Docker](https://docs.docker.com/engine/install/) & [Docker Compose](https://docs.docker.com/compose/) (optional, for containerized execution)

---

### Option A: Local Development (Bare Metal / Turborepo)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/vizi.git
   cd vizi
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Verify App Environment Files:**

   Ensure that `apps/server/.env.dev` and `apps/web/.env.development` are configured for your local environment (e.g. database credentials and connection URLs).

4. **Start the Development Servers:**

   ```bash
   pnpm dev
   ```

   Turborepo will concurrently start:
   - **Web Application**: `http://localhost:3000`
   - **WebSocket & HTTP Server**: `http://localhost:4000` (`ws://localhost:4000/ws`)

5. **Build and Lint:**

   ```bash
   pnpm build
   pnpm lint
   ```

---

### Option B: Running with Docker Compose

When building and running the multi-container stack with Docker Compose, **you must explicitly specify which root environment file to use via the `--env-file` flag**.

> [!WARNING]
> **Explicit `--env-file` Flag Required**: By default, Docker Compose looks for a file named `.env` in the current working directory. Because this project separates root build variables into `.env.dev` and `.env.prod`, compose will not automatically load an environment file without the `--env-file` flag.

#### 1. Build and Run in Development Mode

To build and run containers pointing to local development endpoints:

```bash
# Build images with development build-args
docker compose --env-file .env.dev build

# Start services in the background
docker compose --env-file .env.dev up -d
```

#### 2. Build and Run in Production Mode

To build and run containers pointing to production endpoints:

```bash
# Build images with production build-args
docker compose --env-file .env.prod build

# Start services in the background
docker compose --env-file .env.prod up -d
```

#### 3. View Logs and Teardown

```bash
# Follow logs
docker compose --env-file .env.prod logs -f

# Stop and remove containers
docker compose --env-file .env.prod down
```

---

## 📖 Documentation & Wiki

For in-depth specifications and implementation details, consult the internal documentation:

- **[Project Overview](.agent/wiki/project-overview.md)** — Core mechanics, shape properties, canvas navigation, import/export formats.
- **[System Architecture](.agent/wiki/architecture.md)** — Turborepo boundary rules, WebSocket protocol, state synchronization, and fault-tolerance patterns.
- **[Agent Rules](AGENTS.md)** — Guidelines for AI agents and contributors working in this codebase.

---
