# Relay Voice Platform

Two Next.js 15 applications share one PostgreSQL database:

- `apps/tenant-frontend`: tenant operations dashboard and public Vapi calling page.
- `apps/superadmin-frontend`: platform-wide tenant, appointment, and database health views.

## Setup

1. Copy `.env.example` to `.env.local` inside each app, then provide the database URL. The Vapi variables are required by `tenant-frontend` only.
2. Run `npm install` at the repository root.

## Development

```bash
npm run dev
```

This starts the tenant frontend at `http://localhost:3000` and the platform dashboard at `http://localhost:3001`. The tenant portal uses `/dashboard/[tenantId]` and public calls use `/call/[tenantId]`. The platform dashboard exposes `/tenants`, `/appointments`, and `/status`.