# Getting Started

This guide will help you set up the Agent Chat platform for local development.

## Prerequisites

Ensure you have the following installed on your machine:

- **Bun 1.2+**: The primary runtime and package manager
- **Node.js 18+**: Required for some compatibility features
- **Docker**: Required for running Supabase locally
- **Google AI API Key**: Get one from [AI Studio](https://aistudio.google.com/apikey)

## Local Development Setup

### 1. Clone and Install Dependencies

First, clone the repository and install the dependencies using Bun:

```bash
bun install
```

### 2. Local Supabase Setup

The project uses Supabase for database and authentication. To start a local Supabase instance:

```bash
supabase start
```

This will start several Docker containers. Once started, you will receive local credentials and URLs.

### 3. Environment Configuration

You need to set up environment variables for the agent server and dashboard.

#### Agent Server

Copy the example environment file in `apps/agent-server/`:

```bash
cp apps/agent-server/.env.example apps/agent-server/.env
```

Edit `apps/agent-server/.env` and set the following:

- `DATABASE_URL`: Set to `postgresql://postgres:postgres@127.0.0.1:54322/postgres` (default for local Supabase)
- `GOOGLE_GENAI_API_KEY`: Your API key from Google AI Studio

### 4. Database Migrations

Use Drizzle to generate and apply database migrations:

```bash
# Generate migrations from schema
bun run db:generate

# Apply migrations to the local database
bun run db:migrate
```

### 5. Running the Applications

You can run the entire platform or specific components:

#### Run all applications (Dashboard + Server)

```bash
bun dev
```

#### Run specific applications

```bash
# Run agent server only
bun run dev:server

# Run dashboard only
bun run dev:dashboard
```

The services will be available at:
- **Dashboard**: http://localhost:3000
- **Agent Server**: http://localhost:3001

### 6. Testing the Chat Widget

To test the embeddable chat widget locally, you can use the provided demo file:

1. Ensure the agent server is running on port 3001.
2. Open `apps/agent-server/widget/demo.html` in your browser.
3. You should see the chat widget launcher in the bottom right corner.
