# Agent Chat

A full-stack chatbot platform with a Next.js dashboard and Google ADK-powered agent server.

## Features

- **Multi-tenant architecture** with tenant isolation
- **Dashboard** for managing chatbots, widget configurations, and knowledge bases
- **Customizable chat widget** for embedding on websites
- **Knowledge base** with RAG (Retrieval-Augmented Generation)
- **Analytics** for tracking usage and conversations

## Documentation

- [Getting Started](./docs/getting-started.md) - Local development setup guide
- [Architecture](./docs/architecture.md) - Project architecture and data flow
- [Widget Integration](./docs/widget-integration.md) - How to embed the chat widget on your website
- [API Reference](./docs/api-reference.md) - Complete API documentation for the agent server and dashboard

## Tech Stack

- **Monorepo**: Bun workspaces
- **Dashboard**: Next.js 15, Supabase, shadcn/ui
- **Agent Server**: Google ADK, Fastify
- **Database**: Supabase (PostgreSQL + pgvector)
- **Embedding**: Google Generative AI

## Project Structure

```
agent-chat/
├── apps/
│   ├── agent-server/       # Fastify + Google ADK (port 3001)
│   └── dashboard/          # Next.js 15 admin dashboard
├── packages/
│   ├── db/                 # Drizzle ORM schema
│   └── shared/             # Shared TypeScript types
├── drizzle/                # Database migrations
├── docs/                   # Documentation folder
└── supabase/               # Supabase config
```

## Prerequisites

- Bun 1.2+
- Node.js 18+
- Docker (for local Supabase)
- Google AI API Key from [AI Studio](https://aistudio.google.com/apikey)

## Quick Start

```bash
# Install dependencies
bun install

# Start local Supabase
supabase start

# Run database migrations
bun run db:generate
bun run db:migrate

# Run all apps in development mode
bun dev
```

For detailed instructions, see the [Getting Started](./docs/getting-started.md) guide.

## Database (Drizzle)

Migrations are managed by Drizzle and live in `drizzle/`.

Common commands:
```bash
# Generate a new migration from schema changes
bun run db:generate

# Apply migrations to the target database
bun run db:migrate

# Open Drizzle Studio
bun run db:studio
```

## License

MIT
