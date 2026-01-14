# Security Review Report

**Project:** Agent Chat
**Review Date:** January 2026
**Overall Security Posture:** 6.5/10 (Good foundation, needs hardening)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues](#critical-issues)
3. [High Priority Issues](#high-priority-issues)
4. [Medium Priority Issues](#medium-priority-issues)
5. [Low Priority Issues](#low-priority-issues)
6. [Security Strengths](#security-strengths)
7. [Recommendations](#recommendations)
8. [Compliance Considerations](#compliance-considerations)

---

## Executive Summary

This is a well-architected, type-safe full-stack application with good foundational security practices including multi-tenant isolation, authentication, and Row-Level Security (RLS). However, several security gaps should be addressed before production deployment.

**Technology Stack:**
- Frontend: Next.js 15, React 19
- Backend: Fastify 5.2.0 with Google ADK
- Database: PostgreSQL via Supabase with pgvector
- ORM: Drizzle ORM 0.45.1
- Authentication: Supabase Auth

---

## Critical Issues

### 1. Unauthenticated Cache Invalidation Endpoint

**Severity:** Critical (CVSS 6.5)
**Location:** `apps/agent-server/server.ts` - `POST /api/internal/reload/:chatbotId`

**Issue:**
The internal cache invalidation endpoint has no authentication. Any client with knowledge of chatbot IDs can trigger cache invalidation.

**Impact:**
- Performance degradation through forced cache misses
- Increased database load
- Potential denial of service

**Remediation:**
```typescript
// Option A: Add secret token authentication
fastify.post('/api/internal/reload/:chatbotId', async (request, reply) => {
  const authHeader = request.headers['x-internal-token'];
  if (authHeader !== process.env.INTERNAL_API_TOKEN) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  // ... existing logic
});

// Option B: Restrict to internal IPs only
```

---

### 2. Prompt Injection via Knowledge Base

**Severity:** Critical (CVSS 5.3)
**Location:** `apps/agent-server/agent-factory.ts`

**Issue:**
User-submitted knowledge base content is concatenated directly into the system prompt without sanitization.

```typescript
// Current vulnerable pattern
const fullInstruction = chatbot.system_prompt + knowledgePrompt;
```

**Impact:**
- Potential jailbreak attempts
- Model behavior manipulation
- Unintended information disclosure

**Remediation:**
- Sanitize knowledge base content before injection
- Use separate RAG context instead of prompt concatenation
- Implement content filtering for common jailbreak patterns

---

### 3. No Rate Limiting on Public Endpoints

**Severity:** Critical (CVSS 6.2)
**Location:** Agent Server public endpoints

**Affected Endpoints:**
- `POST /api/session` - Session creation
- `POST /api/chat` - Chat messages
- `GET /api/widget/:chatbotId/config` - Widget configuration

**Impact:**
- DDoS vulnerability
- Resource exhaustion
- Increased infrastructure costs

**Remediation:**
```typescript
import rateLimit from '@fastify/rate-limit';

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
});
```

---

## High Priority Issues

### 4. Service Role Key Exposure Risk

**Severity:** High (CVSS 7.5)
**Location:** `apps/agent-server/config/supabase.ts`

**Issue:**
`SUPABASE_SERVICE_ROLE_KEY` is used in the agent server, which bypasses all Row-Level Security protections.

**Impact:**
If the agent server is compromised, all RLS protections are bypassed, exposing all tenant data.

**Remediation:**
- Remove `SUPABASE_SERVICE_ROLE_KEY` from agent server
- Use RLS-enforced anon key for read operations
- Move admin operations to the dashboard (which already validates tenant ownership)

---

### 5. Missing Input Validation on Chat Messages

**Severity:** High (CVSS 5.4)
**Location:** `POST /api/chat` endpoint

**Issue:**
Message content is not validated for:
- Length limits
- Character encoding
- Prompt injection patterns

**Impact:**
- XSS via model output
- Resource exhaustion with large payloads
- Prompt injection attacks

**Remediation:**
```typescript
import { z } from 'zod';

const chatSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().max(255),
  appName: z.string().uuid(),
  message: z.string().min(1).max(5000),
});
```

---

### 6. Overly Permissive CORS Configuration

**Severity:** High (CVSS 4.3)
**Location:** `apps/agent-server/server.ts`

**Issue:**
```typescript
await fastify.register(cors, {
  origin: true,  // Allows ALL origins
});
```

**Impact:**
Widget embeddable on any site, broadening attack surface.

**Remediation:**
Use domain whitelist from `widget_configs.allowed_domains`:
```typescript
await fastify.register(cors, {
  origin: async (origin) => {
    // Validate against allowed_domains from database
    return isAllowedDomain(origin);
  },
});
```

---

## Medium Priority Issues

### 7. No Session Expiration

**Location:** `adk_sessions` table

**Issue:**
Sessions persist indefinitely until manual deletion.

**Remediation:**
- Add TTL column to sessions (recommended: 24-48 hours)
- Implement automatic cleanup job
- Add session refresh logic

---

### 8. No CSRF Protection

**Location:** Dashboard API routes

**Issue:**
State-changing operations lack CSRF token validation.

**Remediation:**
Implement CSRF tokens for all POST/PATCH/DELETE operations.

---

### 9. Verbose Error Messages

**Location:** API route error responses

**Issue:**
Console logs include error details visible in production logs.

**Remediation:**
- Return generic error messages to clients
- Log detailed errors to secure audit trail only

---

### 10. No Audit Logging

**Location:** All sensitive operations

**Issue:**
No logging for create/update/delete operations on chatbots, knowledge sources, etc.

**Remediation:**
Implement structured audit logging with:
- Timestamp
- User ID
- Operation type
- Resource affected
- IP address

---

## Low Priority Issues

### 11. Redirect Parameter XSS Risk

**Location:** `apps/dashboard/src/middleware.ts`

**Issue:**
`redirect` URL parameter stored without validation.

**Remediation:**
Validate redirect destinations against whitelist.

---

### 12. Missing Security Headers

**Location:** Next.js and Fastify configurations

**Missing Headers:**
- Content-Security-Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)

---

### 13. No Encryption at Rest for Sensitive Data

**Location:** `analytics_events`, visitor data

**Issue:**
Visitor emails and IP addresses stored in plaintext.

**Remediation:**
- Enable Supabase transparent encryption
- Hash IP addresses in analytics

---

## Security Strengths

| Feature | Status | Details |
|---------|--------|---------|
| Multi-Tenant Isolation | ✅ | RLS + application-level tenant_id filtering |
| SQL Injection Protection | ✅ | Drizzle ORM parameterized queries |
| Authentication | ✅ | Supabase Auth with JWT, HTTP-only cookies |
| Row-Level Security | ✅ | Enabled on all database tables |
| Secure Defaults | ✅ | HTTPS in production, secure session handling |
| Dependency Management | ✅ | Lock file committed, stable versions |
| Type Safety | ✅ | TypeScript throughout, Zod validation |
| Cascading Deletes | ✅ | Foreign key constraints properly configured |

---

## Recommendations

### Immediate (P0)

- [ ] Add authentication to `POST /api/internal/reload/:chatbotId`
- [ ] Implement rate limiting on public endpoints
- [ ] Sanitize knowledge base content before prompt injection

### Short-term (P1)

- [ ] Remove `SUPABASE_SERVICE_ROLE_KEY` from agent server
- [ ] Add input validation to chat messages (max 5000 chars)
- [ ] Implement session expiration (24-48 hour TTL)
- [ ] Add audit logging for sensitive operations

### Medium-term (P2)

- [ ] Implement CSRF protection
- [ ] Add comprehensive Zod validation to all endpoints
- [ ] Enable encryption at rest
- [ ] Add query timeout enforcement
- [ ] Enable Dependabot for dependency scanning
- [ ] Restrict CORS to known domains
- [ ] Implement Content Security Policy

### Long-term (P3)

- [ ] Implement secrets rotation
- [ ] Add penetration testing
- [ ] Implement API versioning
- [ ] Add comprehensive test coverage for security paths
- [ ] Implement request signing between services

---

## Compliance Considerations

### GDPR/CCPA Requirements

| Requirement | Current Status | Action Needed |
|-------------|----------------|---------------|
| User consent | ❌ Not implemented | Add consent management |
| Data deletion | ❌ No endpoints | Add deletion API |
| Data access | ❌ No endpoints | Add data export API |
| Privacy policy | ❌ Not visible | Add privacy policy page |
| Data retention | ❌ No limits | Define retention policies |

### Data Stored

- User profiles: email, full_name, avatar_url
- Visitor data: visitor_id, visitor_name, visitor_email, page_url, user_agent
- Analytics: ip_address, country, city, event_data

---

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email security concerns to the project maintainers
3. Include detailed steps to reproduce the issue
4. Allow reasonable time for a fix before public disclosure

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| January 2026 | 1.0 | Initial security review |
