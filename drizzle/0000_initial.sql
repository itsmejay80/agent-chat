-- Drizzle baseline migration.
--
-- This was bootstrapped from the previous Supabase SQL migrations under
-- `supabase/migrations/*` so we can move migration execution to Drizzle.
--
-- From here forward:
-- - Edit schema in `packages/db/src/schema.ts`
-- - Generate new migrations with `bun run db:generate`
-- - Apply migrations with `bun run db:migrate`

-- -----------------------------------------------------------------------------
-- 20240101000000_enable_extensions.sql
-- -----------------------------------------------------------------------------
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- 20240101000001_create_tenants.sql
-- -----------------------------------------------------------------------------
-- Tenants table (organizations/accounts)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Subscription/billing info
  plan VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),

  -- Limits based on plan
  max_chatbots INTEGER DEFAULT 1,
  max_messages_per_month INTEGER DEFAULT 1000,
  max_knowledge_sources INTEGER DEFAULT 5,

  -- Usage tracking
  messages_this_month INTEGER DEFAULT 0,
  usage_reset_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for slug lookups
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 20240101000002_create_users.sql
-- -----------------------------------------------------------------------------
-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,

  -- Role within tenant
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),

  -- Preferences
  preferences JSONB DEFAULT '{}',

  -- Timestamps
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 20240101000003_create_chatbots.sql
-- -----------------------------------------------------------------------------
-- Chatbots table (agents)
CREATE TABLE chatbots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),

  -- AI configuration
  system_prompt TEXT NOT NULL DEFAULT 'You are a helpful assistant.',
  model VARCHAR(100) DEFAULT 'gemini-2.0-flash',
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2048 CHECK (max_tokens >= 100 AND max_tokens <= 8192),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_chatbots_tenant_id ON chatbots(tenant_id);
CREATE INDEX idx_chatbots_is_active ON chatbots(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_chatbots_updated_at
  BEFORE UPDATE ON chatbots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 20240101000004_create_widget_configs.sql
-- -----------------------------------------------------------------------------
-- Widget configurations table
CREATE TABLE widget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chatbot_id UUID NOT NULL UNIQUE REFERENCES chatbots(id) ON DELETE CASCADE,

  -- Position
  position VARCHAR(20) DEFAULT 'bottom-right'
    CHECK (position IN ('bottom-right', 'bottom-left', 'top-right', 'top-left')),

  -- Theme
  primary_color VARCHAR(7) DEFAULT '#6366f1',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#1f2937',
  font_family VARCHAR(255) DEFAULT 'Inter, system-ui, sans-serif',
  border_radius INTEGER DEFAULT 12 CHECK (border_radius >= 0 AND border_radius <= 24),

  -- Branding
  title VARCHAR(50) DEFAULT 'Chat with us',
  subtitle VARCHAR(100),
  welcome_message VARCHAR(500) DEFAULT 'Hi! How can I help you today?',
  placeholder VARCHAR(100) DEFAULT 'Type your message...',

  -- Launcher
  launcher_icon VARCHAR(20) DEFAULT 'chat'
    CHECK (launcher_icon IN ('chat', 'message', 'help', 'custom')),
  launcher_icon_url TEXT,

  -- Behavior
  auto_open BOOLEAN DEFAULT false,
  auto_open_delay INTEGER DEFAULT 3000 CHECK (auto_open_delay >= 0 AND auto_open_delay <= 60000),
  show_branding BOOLEAN DEFAULT true,

  -- Security
  allowed_domains TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for chatbot lookups
CREATE INDEX idx_widget_configs_chatbot_id ON widget_configs(chatbot_id);

-- Trigger for updated_at
CREATE TRIGGER update_widget_configs_updated_at
  BEFORE UPDATE ON widget_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 20240101000005_create_knowledge_sources.sql
-- -----------------------------------------------------------------------------
-- Knowledge sources table
CREATE TABLE knowledge_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,

  -- Source type
  type VARCHAR(20) NOT NULL CHECK (type IN ('file', 'url', 'text', 'sitemap')),
  name VARCHAR(255) NOT NULL,

  -- File-specific fields
  file_url TEXT,
  file_name VARCHAR(255),
  file_mime_type VARCHAR(100),
  file_size INTEGER,

  -- URL-specific fields
  source_url TEXT,

  -- Text-specific fields
  text_content TEXT,

  -- Processing status
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  chunks_count INTEGER DEFAULT 0,

  -- Timestamps
  last_processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_knowledge_sources_chatbot_id ON knowledge_sources(chatbot_id);
CREATE INDEX idx_knowledge_sources_status ON knowledge_sources(status);

-- Trigger for updated_at
CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 20240101000006_create_knowledge_chunks.sql
-- -----------------------------------------------------------------------------
-- Knowledge chunks table with vector embeddings
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Vector embedding (768 dimensions for Google's text-embedding models)
  embedding vector(768),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  token_count INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_knowledge_chunks_source_id ON knowledge_chunks(source_id);
CREATE INDEX idx_knowledge_chunks_chatbot_id ON knowledge_chunks(chatbot_id);

-- Vector similarity index using HNSW for fast approximate nearest neighbor search
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);

-- -----------------------------------------------------------------------------
-- 20240101000007_create_conversations.sql
-- -----------------------------------------------------------------------------
-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,

  -- Visitor info
  visitor_id VARCHAR(255),
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),

  -- Context
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  country VARCHAR(2),
  city VARCHAR(100),

  -- Status
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'closed', 'archived')),

  -- Metrics
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  avg_response_time INTEGER, -- in milliseconds

  -- AI-generated summary
  summary TEXT,
  topics TEXT[] DEFAULT '{}',
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Timestamps
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_visitor_id ON conversations(visitor_id);

-- Trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 20240101000008_create_messages.sql
-- -----------------------------------------------------------------------------
-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Message content
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Metadata
  token_count INTEGER,
  latency_ms INTEGER, -- Response time for assistant messages
  model VARCHAR(100),

  -- Tool usage tracking
  tool_calls JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_role ON messages(role);

-- -----------------------------------------------------------------------------
-- 20240101000009_create_analytics_events.sql
-- -----------------------------------------------------------------------------
-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Event info
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',

  -- Session/visitor info
  session_id VARCHAR(255),
  visitor_id VARCHAR(255),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Context
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  country VARCHAR(2),
  city VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX idx_analytics_events_chatbot_id ON analytics_events(chatbot_id);
CREATE INDEX idx_analytics_events_tenant_id ON analytics_events(tenant_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

-- Composite index for common analytics queries
CREATE INDEX idx_analytics_events_chatbot_type_created
  ON analytics_events(chatbot_id, event_type, created_at DESC);

-- -----------------------------------------------------------------------------
-- 20240101000010_create_match_knowledge_chunks.sql
-- -----------------------------------------------------------------------------
-- RPC function for vector similarity search on knowledge chunks
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(768),
  match_chatbot_id UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  source_id UUID,
  chatbot_id UUID,
  content TEXT,
  metadata JSONB,
  token_count INTEGER,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.source_id,
    kc.chatbot_id,
    kc.content,
    kc.metadata,
    kc.token_count,
    kc.created_at,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.chatbot_id = match_chatbot_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_knowledge_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_knowledge_chunks TO service_role;

-- -----------------------------------------------------------------------------
-- 20240101000011_create_rls_policies.sql
-- -----------------------------------------------------------------------------
-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ======================
-- TENANTS POLICIES
-- ======================

-- Users can view their own tenant
CREATE POLICY "Users can view own tenant"
  ON tenants FOR SELECT
  USING (id = get_user_tenant_id());

-- Only owners can update tenant
CREATE POLICY "Owners can update tenant"
  ON tenants FOR UPDATE
  USING (id = get_user_tenant_id())
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = tenants.id
      AND users.role = 'owner'
    )
  );

-- ======================
-- USERS POLICIES
-- ======================

-- Users can view users in their tenant
CREATE POLICY "Users can view tenant members"
  ON users FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins/owners can manage users in their tenant
CREATE POLICY "Admins can manage tenant users"
  ON users FOR ALL
  USING (
    tenant_id = get_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('owner', 'admin')
    )
  );

-- ======================
-- CHATBOTS POLICIES
-- ======================

-- Users can view chatbots in their tenant
CREATE POLICY "Users can view tenant chatbots"
  ON chatbots FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can create chatbots in their tenant
CREATE POLICY "Users can create chatbots"
  ON chatbots FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Users can update chatbots in their tenant
CREATE POLICY "Users can update tenant chatbots"
  ON chatbots FOR UPDATE
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Admins/owners can delete chatbots
CREATE POLICY "Admins can delete chatbots"
  ON chatbots FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('owner', 'admin')
    )
  );

-- ======================
-- WIDGET_CONFIGS POLICIES
-- ======================

-- Users can manage widget configs for their tenant's chatbots
CREATE POLICY "Users can view widget configs"
  ON widget_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = widget_configs.chatbot_id
      AND c.tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Users can manage widget configs"
  ON widget_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = widget_configs.chatbot_id
      AND c.tenant_id = get_user_tenant_id()
    )
  );

-- ======================
-- KNOWLEDGE_SOURCES POLICIES
-- ======================

-- Users can manage knowledge sources for their tenant's chatbots
CREATE POLICY "Users can view knowledge sources"
  ON knowledge_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = knowledge_sources.chatbot_id
      AND c.tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "Users can manage knowledge sources"
  ON knowledge_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = knowledge_sources.chatbot_id
      AND c.tenant_id = get_user_tenant_id()
    )
  );

-- ======================
-- KNOWLEDGE_CHUNKS POLICIES
-- ======================

-- Users can view knowledge chunks for their tenant's chatbots
CREATE POLICY "Users can view knowledge chunks"
  ON knowledge_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = knowledge_chunks.chatbot_id
      AND c.tenant_id = get_user_tenant_id()
    )
  );

-- Service role can manage chunks (for processing)
CREATE POLICY "Service role can manage chunks"
  ON knowledge_chunks FOR ALL
  USING (auth.role() = 'service_role');

-- ======================
-- CONVERSATIONS POLICIES
-- ======================

-- Users can view conversations for their tenant's chatbots
CREATE POLICY "Users can view conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = conversations.chatbot_id
      AND c.tenant_id = get_user_tenant_id()
    )
  );

-- Service role can manage conversations (from agent server)
CREATE POLICY "Service role can manage conversations"
  ON conversations FOR ALL
  USING (auth.role() = 'service_role');

-- ======================
-- MESSAGES POLICIES
-- ======================

-- Users can view messages for their tenant's conversations
CREATE POLICY "Users can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations conv
      JOIN chatbots c ON c.id = conv.chatbot_id
      WHERE conv.id = messages.conversation_id
      AND c.tenant_id = get_user_tenant_id()
    )
  );

-- Service role can manage messages (from agent server)
CREATE POLICY "Service role can manage messages"
  ON messages FOR ALL
  USING (auth.role() = 'service_role');

-- ======================
-- ANALYTICS_EVENTS POLICIES
-- ======================

-- Users can view analytics for their tenant
CREATE POLICY "Users can view tenant analytics"
  ON analytics_events FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Service role can create analytics events
CREATE POLICY "Service role can create analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ======================
-- PUBLIC ACCESS FOR WIDGET
-- ======================

-- Allow public read of active chatbot configs (for widget)
CREATE POLICY "Public can view active chatbot configs"
  ON chatbots FOR SELECT
  USING (is_active = true);

-- Allow public read of widget configs (for widget)
CREATE POLICY "Public can view widget configs"
  ON widget_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = widget_configs.chatbot_id
      AND c.is_active = true
    )
  );

-- -----------------------------------------------------------------------------
-- 20240101000012_create_handle_new_user.sql
-- -----------------------------------------------------------------------------
-- Function to handle new user signup
-- Creates a tenant and user record when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  tenant_slug TEXT;
BEGIN
  -- Generate a unique slug from email
  tenant_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  tenant_slug := tenant_slug || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);

  -- Create the tenant
  INSERT INTO tenants (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', SPLIT_PART(NEW.email, '@', 1)),
    tenant_slug
  )
  RETURNING id INTO new_tenant_id;

  -- Create the user record
  INSERT INTO users (id, tenant_id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    new_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to handle user profile updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', users.full_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', users.avatar_url),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on user update
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_update();

-- -----------------------------------------------------------------------------
-- 20240101000013_create_adk_sessions.sql
-- -----------------------------------------------------------------------------
-- ADK Sessions table - stores session metadata for Google ADK
CREATE TABLE adk_sessions (
  id VARCHAR(255) PRIMARY KEY,
  app_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  state JSONB DEFAULT '{}',
  last_update_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Session metadata (visitor info)
  visitor_id VARCHAR(255),
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),
  page_url TEXT,
  user_agent TEXT
);

-- Indexes for efficient lookups
CREATE INDEX idx_adk_sessions_app_user ON adk_sessions(app_name, user_id);
CREATE INDEX idx_adk_sessions_chatbot ON adk_sessions(chatbot_id);
CREATE INDEX idx_adk_sessions_last_update ON adk_sessions(last_update_time DESC);

-- -----------------------------------------------------------------------------
-- 20240101000014_create_adk_events.sql
-- -----------------------------------------------------------------------------
-- ADK Events table - stores conversation events for Google ADK
CREATE TABLE adk_events (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES adk_sessions(id) ON DELETE CASCADE,
  invocation_id VARCHAR(255) NOT NULL,
  author VARCHAR(255),

  -- LLM Response content
  content JSONB,
  actions JSONB DEFAULT '{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{},"requestedToolConfirmations":{}}',

  -- Event metadata
  timestamp BIGINT NOT NULL,
  branch VARCHAR(255),
  long_running_tool_ids TEXT[],

  -- Response metadata
  grounding_metadata JSONB,
  partial BOOLEAN DEFAULT FALSE,
  turn_complete BOOLEAN,
  error_code VARCHAR(100),
  error_message TEXT,
  custom_metadata JSONB,
  usage_metadata JSONB,
  finish_reason VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX idx_adk_events_session ON adk_events(session_id);
CREATE INDEX idx_adk_events_timestamp ON adk_events(timestamp);
CREATE INDEX idx_adk_events_session_timestamp ON adk_events(session_id, timestamp);

-- -----------------------------------------------------------------------------
-- 20240101000015_remove_conversations_messages.sql
-- -----------------------------------------------------------------------------
-- Remove old conversations/messages tables and their RLS policies
-- These are replaced by ADK's adk_sessions/adk_events tables

-- Drop RLS policies for conversations
DROP POLICY IF EXISTS "Users can view conversations" ON conversations;
DROP POLICY IF EXISTS "Service role can manage conversations" ON conversations;

-- Drop RLS policies for messages
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Service role can manage messages" ON messages;

-- Drop foreign key constraint from analytics_events that references conversations
ALTER TABLE IF EXISTS analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_conversation_id_fkey;

-- Disable RLS before dropping tables
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;

-- Drop tables (messages first due to foreign key constraint)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

-- Enable RLS on new ADK tables (service role access only)
ALTER TABLE adk_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE adk_events ENABLE ROW LEVEL SECURITY;

-- Service role policies for ADK tables
CREATE POLICY "Service role can manage sessions"
  ON adk_sessions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage events"
  ON adk_events FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 20240101000016_fix_handle_new_user_schema.sql
-- -----------------------------------------------------------------------------
-- Fix auth signup trigger failing due to missing search_path.
-- When GoTrue inserts into auth.users, the trigger runs with a search_path that
-- does not include public, so unqualified table names like `tenants` fail.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  tenant_slug TEXT;
BEGIN
  -- Generate a unique slug from email
  tenant_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  tenant_slug := tenant_slug || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);

  -- Create the tenant
  INSERT INTO public.tenants (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', SPLIT_PART(NEW.email, '@', 1)),
    tenant_slug
  )
  RETURNING id INTO new_tenant_id;

  -- Create the user record
  INSERT INTO public.users (id, tenant_id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    new_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', public.users.full_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', public.users.avatar_url),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Recreate triggers to ensure they reference the public functions.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- -----------------------------------------------------------------------------
-- 20240101000017_fix_get_user_tenant_id_schema.sql
-- -----------------------------------------------------------------------------
-- Fix tenant lookup failures caused by search_path issues.
-- PostgREST/Gotrue sessions may run with a search_path that doesn't include public,
-- so unqualified references like `users` can resolve incorrectly.

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id
  FROM public.users
  WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER
SET search_path = public;

-- -----------------------------------------------------------------------------
-- 20240101000018_fix_users_rls_recursion.sql
-- -----------------------------------------------------------------------------
-- Fix infinite recursion in RLS policies for public.users.

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER
SET search_path = public;

DROP POLICY IF EXISTS "Admins can manage tenant users" ON public.users;

CREATE POLICY "Admins can manage tenant users"
  ON public.users FOR ALL
  USING (
    tenant_id = public.get_user_tenant_id()
    AND public.is_current_user_admin()
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.is_current_user_admin()
  );

-- -----------------------------------------------------------------------------
-- 20240101000019_add_adk_read_policies.sql
-- -----------------------------------------------------------------------------
-- Allow authenticated dashboard users to read ADK sessions/events.
-- Writes remain restricted to service_role.

DROP POLICY IF EXISTS "Users can view tenant sessions" ON public.adk_sessions;
DROP POLICY IF EXISTS "Users can view tenant events" ON public.adk_events;

-- Sessions are scoped to a tenant via the related chatbot.
CREATE POLICY "Users can view tenant sessions"
  ON public.adk_sessions FOR SELECT
  TO authenticated
  USING (
    chatbot_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.chatbots c
      WHERE c.id = public.adk_sessions.chatbot_id
        AND c.tenant_id = public.get_user_tenant_id()
    )
  );

-- Events are scoped to a tenant via their session -> chatbot.
CREATE POLICY "Users can view tenant events"
  ON public.adk_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.adk_sessions s
      JOIN public.chatbots c ON c.id = s.chatbot_id
      WHERE s.id = public.adk_events.session_id
        AND c.tenant_id = public.get_user_tenant_id()
    )
  );
