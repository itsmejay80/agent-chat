# Deployment Guide

This guide covers deploying the agent-chat application using **free tier** services.

## Architecture

| Component | Platform | Cost |
|-----------|----------|------|
| Dashboard | Vercel | Free |
| Agent Server | Fly.io | Free |
| Database | Supabase | Free |

---

## Prerequisites

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- [Vercel account](https://vercel.com) (sign up with GitHub)
- Supabase project with database set up
- GitHub repository with your code

---

## 1. Deploy Agent Server to Fly.io

### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# or using curl
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login to Fly

```bash
fly auth login
```

### Step 3: Create the Fly App

```bash
# Navigate to repository root
cd /path/to/agent-chat

# Create a new app (choose a unique name)
fly apps create your-app-name

# Update fly.toml with your app name
# Edit apps/agent-server/fly.toml and change:
# app = "your-app-name"
```

### Step 4: Set Environment Secrets

```bash
fly secrets set \
  GOOGLE_GENAI_API_KEY="your-google-genai-api-key" \
  DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" \
  SUPABASE_URL="https://[ref].supabase.co" \
  SUPABASE_ANON_KEY="your-supabase-anon-key" \
  SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key" \
  INTERNAL_API_TOKEN="$(openssl rand -hex 32)" \
  --app your-app-name
```

> **Important:** Use the Supabase **Connection Pooling** URL for `DATABASE_URL`, not the direct connection.
> Find it in: Supabase Dashboard → Settings → Database → Connection Pooling

> **Security:** The `INTERNAL_API_TOKEN` is required for the `/api/internal/reload/:chatbotId` endpoint. Generate a secure random token (the command above does this automatically). Store this token securely - you'll need it when calling the reload endpoint from your dashboard.

### Step 5: Deploy

```bash
# Deploy from repository root
fly deploy --config apps/agent-server/fly.toml

# Or if you're in the apps/agent-server directory:
# fly deploy --dockerfile Dockerfile
```

### Step 6: Verify Deployment

```bash
# Check status
fly status --app your-app-name

# View logs
fly logs --app your-app-name

# Test health endpoint
curl https://your-app-name.fly.dev/api/health
```

Your agent server is now live at: `https://your-app-name.fly.dev`

---

## 2. Deploy Dashboard to Vercel

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Select your `agent-chat` repository

### Step 2: Configure Build Settings

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `apps/dashboard`
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)

### Step 3: Add Environment Variables

Add these in the Vercel dashboard:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Step 4: Deploy

Click **"Deploy"** and wait for the build to complete.

Your dashboard is now live at: `https://your-project.vercel.app`

---

## 3. Update Widget Configuration

After deployment, update the widget embed code to use your production agent server URL:

```html
<script 
  src="https://your-app-name.fly.dev/widget/chat-widget.js" 
  data-chatbot-id="your-chatbot-id"
  data-server-url="https://your-app-name.fly.dev"
></script>
```

---

## Useful Commands

### Fly.io

```bash
# View app status
fly status

# View logs (live)
fly logs

# SSH into the machine
fly ssh console

# Scale up (if needed)
fly scale memory 512

# Restart the app
fly apps restart your-app-name

# View secrets (names only)
fly secrets list
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from CLI
vercel --cwd apps/dashboard

# Deploy to production
vercel --prod --cwd apps/dashboard
```

---

## Troubleshooting

### Agent Server won't start

1. Check logs: `fly logs --app your-app-name`
2. Verify secrets are set: `fly secrets list --app your-app-name`
3. Test locally with Docker:
   ```bash
   docker build -f apps/agent-server/Dockerfile -t agent-server .
   docker run -p 3001:3001 --env-file apps/agent-server/.env agent-server
   ```

### Database connection issues

- Ensure you're using the **pooler** connection string
- Check that `DATABASE_URL` is correctly set in Fly secrets
- Verify Supabase isn't blocking the connection (check allowed IPs)

### Widget not loading

- Check CORS settings in agent-server
- Verify the `data-server-url` points to your Fly.io URL
- Check browser console for errors

---

## Cost Optimization

### Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| **Fly.io** | 3 shared VMs, 160GB bandwidth |
| **Vercel** | 100GB bandwidth, unlimited deployments |
| **Supabase** | 500MB database, 1GB storage |

### Tips to Stay Free

1. **Fly.io:** Keep `auto_stop_machines = true` to scale to zero when idle
2. **Vercel:** Static pages are unlimited; API routes have limits
3. **Supabase:** Monitor database size; optimize queries

---

## Security Considerations

The agent server includes the following security measures:

### Rate Limiting

All public endpoints are rate-limited to **100 requests per minute per IP**. This protects against:
- DDoS attacks
- Resource exhaustion
- Abuse of the chat API

The rate limiter returns a `429 Too Many Requests` response when exceeded.

### Internal API Authentication

The `/api/internal/reload/:chatbotId` endpoint requires authentication via the `x-internal-token` header:

```bash
# Example: Triggering a config reload
curl -X POST https://your-app-name.fly.dev/api/internal/reload/your-chatbot-id \
  -H "x-internal-token: your-internal-api-token"
```

**Required environment variable:** `INTERNAL_API_TOKEN`

If calling from the dashboard, add this token to the dashboard's environment and include it in reload requests.

### Knowledge Base Sanitization

User-submitted knowledge base content is automatically sanitized before being injected into the system prompt:

1. **Pattern filtering:** Common prompt injection patterns are redacted
2. **Delimiter wrapping:** Content is wrapped in code blocks with clear boundaries
3. **Instruction separation:** The model is instructed to treat knowledge as untrusted reference material

This mitigates prompt injection attacks via knowledge base content.

### Recommendations for Production

Before going to production, consider implementing these additional security measures (see `SECURITY.md` for full details):

| Priority | Item |
|----------|------|
| P1 | Add input validation to chat messages (max 5000 chars) |
| P1 | Implement session expiration (24-48 hour TTL) |
| P1 | Add audit logging for sensitive operations |
| P2 | Restrict CORS to known domains |
| P2 | Add security headers (CSP, HSTS, X-Frame-Options) |
| P2 | Implement CSRF protection on dashboard |

---

## Upgrading for Production

When you're ready to scale:

1. **Fly.io:** Increase VM memory (`fly scale memory 512`)
2. **Fly.io:** Add more regions (`fly regions add lhr`)
3. **Supabase:** Upgrade to Pro plan for better performance
4. **Vercel:** Upgrade if you need more API route invocations

---

## CI/CD with GitHub Actions

This project includes automated CI/CD pipelines using GitHub Actions.

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** (`.github/workflows/ci.yml`) | All PRs and pushes | Lint, type-check, build |
| **Deploy Agent Server** (`.github/workflows/deploy-agent-server.yml`) | Push to `main` | Deploy to Fly.io |
| **Deploy Dashboard** (`.github/workflows/deploy-dashboard.yml`) | Push to `main` | Deploy to Vercel |

### Required GitHub Secrets

Add these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

#### For Fly.io Deployment

| Secret | How to get it |
|--------|---------------|
| `FLY_API_TOKEN` | Run `fly tokens create deploy -x 999999h` |

#### For Vercel Deployment

| Secret | How to get it |
|--------|---------------|
| `VERCEL_TOKEN` | [Create token](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | In `.vercel/project.json` after running `vercel link` |
| `VERCEL_PROJECT_ID` | In `.vercel/project.json` after running `vercel link` |

#### For Builds (Optional)

| Secret | Purpose |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard builds |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard builds |

### Setting Up CI/CD

#### 1. Get Fly.io Token

```bash
# Login to Fly
fly auth login

# Create a deploy token
fly tokens create deploy -x 999999h

# Copy the token and add to GitHub secrets as FLY_API_TOKEN
```

#### 2. Get Vercel Tokens

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project (run from apps/dashboard)
cd apps/dashboard
vercel link

# This creates .vercel/project.json with orgId and projectId
cat .vercel/project.json

# Create access token at https://vercel.com/account/tokens
# Add all three to GitHub secrets
```

#### 3. Add Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - `FLY_API_TOKEN`
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Workflow Behavior

#### On Pull Requests
- **CI** runs: linting, type-checking, build tests
- **Dashboard Preview** deploys to Vercel preview URL
- Preview URL is commented on the PR

#### On Push to Main
- **CI** runs all checks
- **Agent Server** deploys to Fly.io (if relevant files changed)
- **Dashboard** deploys to Vercel production (if relevant files changed)

### Manual Deployment

You can manually trigger deployments from the GitHub Actions tab:

1. Go to **Actions** tab in your repository
2. Select the workflow (e.g., "Deploy Agent Server")
3. Click **Run workflow**
4. Select branch and click **Run workflow**

### Monitoring Deployments

```bash
# Fly.io logs
fly logs --app your-app-name

# Vercel deployment status
vercel ls --cwd apps/dashboard
```
