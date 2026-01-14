# Project Architecture

## Overview

This is a **multi-tenant chatbot platform** built with:
- **Dashboard**: Next.js 15 with Supabase Auth/PostgREST for the admin interface
- **Agent Server**: Fastify + Google ADK + Drizzle ORM for the chat API
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Migrations**: Drizzle (`drizzle/`)

---

## Project Directory Structure

```
agent-chat/
├── apps/
│   ├── agent-server/           # Fastify + Google ADK chat server
│   │   ├── config/
│   │   │   ├── cache.ts        # In-memory config cache
│   │   │   ├── loader.ts       # Chatbot/widget config loader
│   │   │   └── supabase.ts     # Supabase admin client
│   │   ├── services/
│   │   │   └── supabase-session-service.ts  # ADK session persistence
│   │   ├── widget/
│   │   │   ├── chat-widget.js  # Embeddable widget script
│   │   │   └── chat-widget.css
│   │   ├── agent.ts            # Base agent definition
│   │   ├── agent-factory.ts    # Dynamic agent creation
│   │   └── server.ts           # Fastify server entry
│   │
│   └── dashboard/              # Next.js 15 admin dashboard
│       └── src/
│           ├── app/
│           │   ├── (auth)/     # Auth route group
│           │   │   ├── login/
│           │   │   ├── signup/
│           │   │   └── forgot-password/
│           │   ├── (dashboard)/ # Protected route group
│           │   │   ├── page.tsx           # Overview/home
│           │   │   ├── layout.tsx         # Dashboard layout
│           │   │   └── chatbots/
│           │   │       ├── page.tsx       # Chatbots list
│           │   │       ├── new/           # Create chatbot
│           │   │       └── [id]/
│           │   │           ├── page.tsx   # Chatbot detail
│           │   │           ├── settings/  # Model settings
│           │   │           ├── widget/    # Widget config
│           │   │           ├── knowledge/ # Knowledge base
│           │   │           └── analytics/ # Analytics
│           │   ├── api/
│           │   │   └── chatbots/
│           │   │       ├── route.ts       # List/Create
│           │   │       └── [id]/
│           │   │           ├── route.ts   # Get/Update/Delete
│           │   │           └── widget/    # Widget config
│           │   └── callback/              # OAuth callback
│           ├── components/
│           │   ├── ui/         # shadcn/ui components
│           │   ├── layout/     # Sidebar, Header
│           │   ├── chatbots/   # Chatbot components
│           │   └── widget/     # Widget config components
│           ├── lib/
│           │   └── supabase/   # Supabase clients
│           └── middleware.ts   # Auth middleware
│
├── packages/
│   └── shared/                 # Shared types package
│       └── src/
│           ├── types/
│           │   ├── agent.ts
│           │   ├── widget.ts
│           │   ├── knowledge.ts
│           │   └── conversation.ts
│           └── database.types.ts  # Generated Supabase types
│
├── supabase/
│   ├── config.toml             # Supabase config
│   └── migrations/             # Database migrations
│
└── docs/
    └── architecture.md         # This file
```

---

## Database Entity Relationship Diagram

```mermaid
erDiagram
    tenants ||--o{ users : "has"
    tenants ||--o{ chatbots : "owns"
    tenants ||--o{ analytics_events : "tracks"

    chatbots ||--|| widget_configs : "has"
    chatbots ||--o{ knowledge_sources : "has"
    chatbots ||--o{ adk_sessions : "hosts"
    chatbots ||--o{ analytics_events : "tracks"

    knowledge_sources ||--o{ knowledge_chunks : "contains"

    adk_sessions ||--o{ adk_events : "contains"

    tenants {
        uuid id PK
        varchar name
        varchar slug UK
        varchar plan
        varchar stripe_customer_id
        varchar stripe_subscription_id
        int max_chatbots
        int max_messages_per_month
        int max_knowledge_sources
        int messages_this_month
        timestamptz usage_reset_at
        jsonb settings
        timestamptz created_at
        timestamptz updated_at
    }

    users {
        uuid id PK,FK
        uuid tenant_id FK
        varchar email
        varchar full_name
        text avatar_url
        varchar role
        jsonb preferences
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    chatbots {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar description
        text system_prompt
        varchar model
        decimal temperature
        int max_tokens
        boolean is_active
        jsonb settings
        timestamptz created_at
        timestamptz updated_at
    }

    widget_configs {
        uuid id PK
        uuid chatbot_id FK,UK
        varchar position
        varchar primary_color
        varchar background_color
        varchar text_color
        varchar font_family
        int border_radius
        varchar title
        varchar subtitle
        varchar welcome_message
        varchar placeholder
        varchar launcher_icon
        text launcher_icon_url
        boolean auto_open
        int auto_open_delay
        boolean show_branding
        text[] allowed_domains
        timestamptz created_at
        timestamptz updated_at
    }

    knowledge_sources {
        uuid id PK
        uuid chatbot_id FK
        varchar type
        varchar name
        text file_url
        varchar file_name
        varchar file_mime_type
        int file_size
        text source_url
        text text_content
        varchar status
        text error_message
        int chunks_count
        timestamptz last_processed_at
        timestamptz created_at
        timestamptz updated_at
    }

    knowledge_chunks {
        uuid id PK
        uuid source_id FK
        uuid chatbot_id FK
        text content
        vector embedding
        jsonb metadata
        int token_count
        timestamptz created_at
    }

    adk_sessions {
        varchar id PK
        varchar app_name
        varchar user_id
        uuid chatbot_id FK
        jsonb state
        timestamptz last_update_time
        timestamptz created_at
        varchar visitor_id
        varchar visitor_name
        varchar visitor_email
        text page_url
        text user_agent
    }

    adk_events {
        varchar id PK
        varchar session_id FK
        varchar invocation_id
        varchar author
        jsonb content
        jsonb actions
        bigint timestamp
        varchar branch
        text[] long_running_tool_ids
        jsonb grounding_metadata
        boolean partial
        boolean turn_complete
        varchar error_code
        text error_message
        jsonb custom_metadata
        jsonb usage_metadata
        varchar finish_reason
        timestamptz created_at
    }

    analytics_events {
        uuid id PK
        uuid chatbot_id FK
        uuid tenant_id FK
        varchar event_type
        jsonb event_data
        varchar session_id
        varchar visitor_id
        text page_url
        text user_agent
        inet ip_address
        varchar country
        varchar city
        timestamptz created_at
    }
```

---

## API Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["🌐 Client Applications"]
        Widget["Chat Widget<br/>(Embedded JS)"]
        Dashboard["Admin Dashboard<br/>(Next.js)"]
    end

    subgraph AgentServer["⚡ Agent Server (Fastify)"]
        direction TB
        AS_Health["GET /api/health"]
        AS_Session["POST /api/session"]
        AS_SessionEnd["POST /api/session/end"]
        AS_Chat["POST /api/chat"]
        AS_WidgetConfig["GET /api/widget/:chatbotId/config"]
        AS_Reload["POST /api/internal/reload/:chatbotId"]
    end

    subgraph DashboardAPI["📊 Dashboard API (Next.js)"]
        direction TB
        D_ListBots["GET /api/chatbots"]
        D_CreateBot["POST /api/chatbots"]
        D_GetBot["GET /api/chatbots/[id]"]
        D_UpdateBot["PATCH /api/chatbots/[id]"]
        D_DeleteBot["DELETE /api/chatbots/[id]"]
        D_GetWidget["GET /api/chatbots/[id]/widget"]
        D_UpdateWidget["PATCH /api/chatbots/[id]/widget"]
        D_Callback["GET /callback"]
    end

    subgraph Database["🗄️ Supabase (PostgreSQL)"]
        direction TB
        DB_Tenants[(tenants)]
        DB_Users[(users)]
        DB_Chatbots[(chatbots)]
        DB_Widget[(widget_configs)]
        DB_Knowledge[(knowledge_sources)]
        DB_Chunks[(knowledge_chunks)]
        DB_Sessions[(adk_sessions)]
        DB_Events[(adk_events)]
        DB_Analytics[(analytics_events)]
    end

    subgraph AI["🤖 AI Services"]
        Gemini["Google Gemini<br/>(LLM)"]
        Embeddings["Embeddings API<br/>(Vector Search)"]
    end

    %% Client to Server connections
    Widget --> AS_Session
    Widget --> AS_SessionEnd
    Widget --> AS_Chat
    Widget --> AS_WidgetConfig
    Dashboard --> DashboardAPI

    %% Agent Server to Database
    AS_Session --> DB_Chatbots
    AS_Session --> DB_Sessions
    AS_SessionEnd --> DB_Sessions
    AS_Chat --> DB_Sessions
    AS_Chat --> DB_Events
    AS_Chat --> DB_Chunks
    AS_WidgetConfig --> DB_Chatbots
    AS_WidgetConfig --> DB_Widget

    %% Dashboard API to Database
    D_ListBots --> DB_Users
    D_ListBots --> DB_Chatbots
    D_CreateBot --> DB_Chatbots
    D_CreateBot --> DB_Widget
    D_GetBot --> DB_Chatbots
    D_UpdateBot --> DB_Chatbots
    D_DeleteBot --> DB_Chatbots
    D_GetWidget --> DB_Widget
    D_UpdateWidget --> DB_Widget

    %% AI Service connections
    AS_Chat --> Gemini
    AS_Chat --> Embeddings
    Embeddings --> DB_Chunks

    classDef server fill:#4f46e5,stroke:#312e81,color:#fff
    classDef database fill:#059669,stroke:#065f46,color:#fff
    classDef client fill:#f59e0b,stroke:#b45309,color:#fff
    classDef ai fill:#ec4899,stroke:#be185d,color:#fff

    class AS_Health,AS_Session,AS_SessionEnd,AS_Chat,AS_WidgetConfig,AS_Reload,D_ListBots,D_CreateBot,D_GetBot,D_UpdateBot,D_DeleteBot,D_GetWidget,D_UpdateWidget,D_Callback server
    class DB_Tenants,DB_Users,DB_Chatbots,DB_Widget,DB_Knowledge,DB_Chunks,DB_Sessions,DB_Events,DB_Analytics database
    class Widget,Dashboard client
    class Gemini,Embeddings ai
```

---

## API Request Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    participant W as Chat Widget
    participant AS as Agent Server
    participant SS as SessionService
    participant DB as Supabase DB
    participant AI as Google Gemini

    Note over W,AI: Session Creation Flow
    W->>AS: POST /api/session<br/>{chatbotId, visitorId}
    AS->>DB: Query chatbots (validate)
    DB-->>AS: Chatbot config
    AS->>SS: createSession()
    SS->>DB: Insert adk_sessions
    DB-->>SS: Session created
    SS-->>AS: Session object
    AS-->>W: {sessionId, userId, appName}

    Note over W,AI: Chat Message Flow
    W->>AS: POST /api/chat<br/>{sessionId, userId, appName, message}
    AS->>SS: getSession()
    SS->>DB: Query adk_sessions
    DB-->>SS: Session data
    AS->>DB: Query chatbots (config)
    AS->>DB: Vector search knowledge_chunks
    DB-->>AS: Relevant context
    AS->>AI: Runner.runAsync()<br/>(agent + context)
    AI-->>AS: AI response events
    AS->>SS: appendEvent()
    SS->>DB: Insert adk_events
    SS->>DB: Update adk_sessions
    AS-->>W: {response, success}

    Note over W,AI: End Session Flow
    W->>AS: POST /api/session/end<br/>{sessionId, userId, appName}
    AS->>SS: deleteSession()
    SS->>DB: Delete adk_sessions (cascades events)
    AS-->>W: {success, message}

    Note over W,AI: Widget Config Flow
    W->>AS: GET /api/widget/:chatbotId/config
    AS->>DB: Query widget_configs + chatbots
    DB-->>AS: Config data
    AS-->>W: {config: {...}}
```

---

## Dashboard API Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant D as Dashboard (Next.js)
    participant Auth as Supabase Auth
    participant DB as Supabase DB

    Note over U,DB: Authentication Flow
    U->>D: Login request
    D->>Auth: OAuth/Email auth
    Auth-->>D: Session token
    D-->>U: Redirect to dashboard

    Note over U,DB: List Chatbots Flow
    U->>D: GET /api/chatbots
    D->>Auth: Validate session
    Auth-->>D: User data
    D->>DB: Get user's tenant_id
    D->>DB: Query chatbots (by tenant)
    DB-->>D: Chatbot list
    D-->>U: [{chatbot1}, {chatbot2}, ...]

    Note over U,DB: Create Chatbot Flow
    U->>D: POST /api/chatbots<br/>{name, system_prompt, ...}
    D->>Auth: Validate session
    D->>DB: Insert chatbots
    DB-->>D: New chatbot
    D->>DB: Insert widget_configs (defaults)
    DB-->>D: Widget config
    D-->>U: {chatbot: {...}}

    Note over U,DB: Update Widget Flow
    U->>D: PATCH /api/chatbots/[id]/widget<br/>{primary_color, title, ...}
    D->>Auth: Validate session
    D->>DB: Upsert widget_configs
    DB-->>D: Updated config
    D-->>U: {widget: {...}}
```

---

## System Components Overview

```mermaid
flowchart LR
    subgraph Frontend["Frontend Layer"]
        A[("🌐 Chat Widget<br/>Embeddable JS")]
        B[("📊 Dashboard<br/>Next.js 15")]
    end

    subgraph Backend["Backend Layer"]
        C[("⚡ Agent Server<br/>Fastify + ADK")]
        D[("🔐 API Routes<br/>Next.js API")]
        SS[("💾 SessionService<br/>ADK Persistence")]
    end

    subgraph Data["Data Layer"]
        E[("🗄️ PostgreSQL<br/>Supabase")]
        F[("🔍 pgvector<br/>Embeddings")]
        G[("📁 Storage<br/>File uploads")]
    end

    subgraph External["External Services"]
        H[("🤖 Google Gemini<br/>LLM")]
        I[("💳 Stripe<br/>Payments")]
        J[("🔑 Supabase Auth<br/>Authentication")]
    end

    A --> C
    B --> D
    C --> SS
    SS --> E
    C --> F
    C --> H
    D --> E
    D --> J
    E --> G
    B --> I
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant M as Middleware
    participant D as Dashboard
    participant Auth as Supabase Auth
    participant DB as Supabase DB

    Note over U,DB: Signup Flow (New User)
    U->>D: Navigate to /signup
    D-->>U: Render signup form
    U->>D: Submit {email, password, name}
    D->>Auth: signUp({email, password})
    Auth-->>D: User created
    Note over D: Trigger: handle_new_user()
    Auth->>DB: Create tenant (auto)
    Auth->>DB: Create user record (auto)
    D-->>U: Redirect to /login

    Note over U,DB: Login Flow
    U->>D: Navigate to /login
    D-->>U: Render login form
    U->>D: Submit {email, password}
    D->>Auth: signInWithPassword()
    Auth-->>D: Session + tokens
    D-->>U: Set cookies, redirect to /

    Note over U,DB: Protected Route Access
    U->>M: Request /chatbots
    M->>Auth: getUser() from cookies
    Auth-->>M: User data or null
    alt User authenticated
        M->>D: Continue to route
        D-->>U: Render page
    else Not authenticated
        M-->>U: Redirect to /login
    end

    Note over U,DB: OAuth Flow (Google)
    U->>D: Click "Sign in with Google"
    D->>Auth: signInWithOAuth({provider: 'google'})
    Auth-->>U: Redirect to Google
    U->>Auth: Authorize
    Auth-->>D: Callback to /callback
    D->>Auth: exchangeCodeForSession()
    Auth-->>D: Session tokens
    D-->>U: Redirect to /
```

---

## Dashboard Layout Structure

```mermaid
flowchart TB
    subgraph RootLayout["Root Layout (layout.tsx)"]
        direction TB
        Providers["Providers<br/>(Theme, Supabase)"]
    end

    subgraph AuthGroup["(auth) Route Group"]
        direction TB
        AuthLayout["Auth Layout<br/>(centered, minimal)"]
        Login["/login"]
        Signup["/signup"]
        Forgot["/forgot-password"]
    end

    subgraph DashGroup["(dashboard) Route Group"]
        direction TB
        DashLayout["Dashboard Layout"]

        subgraph LayoutComponents["Layout Components"]
            Sidebar["Sidebar<br/>- Navigation<br/>- Chatbot list"]
            Header["Header<br/>- User menu<br/>- Notifications"]
        end

        subgraph Pages["Pages"]
            Overview["/ (Overview)<br/>Stats cards"]
            ChatbotsList["/chatbots<br/>List all bots"]
            ChatbotNew["/chatbots/new<br/>Create form"]

            subgraph ChatbotDetail["/chatbots/[id]"]
                BotLayout["Chatbot Layout<br/>(tabs navigation)"]
                BotOverview["Overview"]
                BotSettings["/settings"]
                BotWidget["/widget"]
                BotKnowledge["/knowledge"]
                BotAnalytics["/analytics"]
            end
        end
    end

    RootLayout --> AuthGroup
    RootLayout --> DashGroup
    AuthLayout --> Login
    AuthLayout --> Signup
    AuthLayout --> Forgot
    DashLayout --> LayoutComponents
    DashLayout --> Pages
    BotLayout --> BotOverview
    BotLayout --> BotSettings
    BotLayout --> BotWidget
    BotLayout --> BotKnowledge
    BotLayout --> BotAnalytics
```

---

## Dashboard Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `(auth)/login/page.tsx` | Email/password login form |
| `/signup` | `(auth)/signup/page.tsx` | Registration form (creates tenant + user) |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | Password reset request |
| `/` | `(dashboard)/page.tsx` | Overview with stats cards |
| `/chatbots` | `(dashboard)/chatbots/page.tsx` | List of all chatbots |
| `/chatbots/new` | `(dashboard)/chatbots/new/page.tsx` | Create new chatbot form |
| `/chatbots/[id]` | `(dashboard)/chatbots/[id]/page.tsx` | Chatbot overview/detail |
| `/chatbots/[id]/settings` | `(dashboard)/chatbots/[id]/settings/page.tsx` | Model config (temperature, etc.) |
| `/chatbots/[id]/widget` | `(dashboard)/chatbots/[id]/widget/page.tsx` | Widget customization |
| `/chatbots/[id]/knowledge` | `(dashboard)/chatbots/[id]/knowledge/page.tsx` | Knowledge base management |
| `/chatbots/[id]/analytics` | `(dashboard)/chatbots/[id]/analytics/page.tsx` | Usage analytics |

---

## Model Relationships Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| `tenants` → `users` | **One-to-Many** | A tenant has multiple users |
| `tenants` → `chatbots` | **One-to-Many** | A tenant owns multiple chatbots |
| `tenants` → `analytics_events` | **One-to-Many** | Tenant-level analytics |
| `users` → `auth.users` | **One-to-One** | Extends Supabase auth |
| `chatbots` → `widget_configs` | **One-to-One** | Each chatbot has one widget config |
| `chatbots` → `knowledge_sources` | **One-to-Many** | A chatbot has multiple knowledge sources |
| `chatbots` → `adk_sessions` | **One-to-Many** | A chatbot has multiple ADK sessions |
| `chatbots` → `analytics_events` | **One-to-Many** | Chatbot-level analytics |
| `knowledge_sources` → `knowledge_chunks` | **One-to-Many** | Source split into chunks |
| `adk_sessions` → `adk_events` | **One-to-Many** | Session contains conversation events |

---

## API Endpoints Summary

### Agent Server (`/apps/agent-server`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/session` | Create new chat session |
| `POST` | `/api/session/end` | End and delete a chat session |
| `POST` | `/api/chat` | Send message and get AI response |
| `GET` | `/api/widget/:chatbotId/config` | Get widget configuration |
| `POST` | `/api/internal/reload/:chatbotId` | Reload chatbot config (internal) |

### Dashboard API (`/apps/dashboard`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/chatbots` | List all chatbots for tenant |
| `POST` | `/api/chatbots` | Create new chatbot |
| `GET` | `/api/chatbots/[id]` | Get single chatbot |
| `PATCH` | `/api/chatbots/[id]` | Update chatbot |
| `DELETE` | `/api/chatbots/[id]` | Delete chatbot |
| `GET` | `/api/chatbots/[id]/widget` | Get widget config |
| `PATCH` | `/api/chatbots/[id]/widget` | Update widget config |
