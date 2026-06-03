# Linear Clone V1 Plan

## Summary

Build a usable Linear-like Issue MVP on TanStack Start.

The app will support multi-workspace collaboration, team-scoped issues, authentication, PostgreSQL persistence, typed API procedures, and a dense product UI. The added stack is Drizzle ORM, Postgres, oRPC, Better Auth, TanStack Query, Resend, and BlockNote.

## Product Scope

V1 focuses on an Issue MVP:

- Workspaces and teams
- Workspace members with owner/admin/member roles
- Auth with email/password and Google OAuth
- Required email verification
- Password reset
- Invitations via Resend
- Team-scoped issues
- Custom workflow statuses per team
- Issue list and issue detail/editor
- Minimal projects
- Markdown/rich comments
- Basic filters
- Member settings

Deferred from v1:

- Realtime collaboration
- Saved views
- Labels
- Cycles
- Issue relationships/blockers
- Attachments/uploads
- Command menu
- Issue email notifications
- Postgres RLS

## Architecture

Use Better Auth as the source of truth for users, sessions, organizations, teams, memberships, roles, and invitations.

Use domain tables for Linear-specific data:

- Projects
- Issue statuses
- Issues
- Comments
- Team issue counters

Use UUID strings for domain table IDs.

Use app-layer tenant checks in every protected server/API path. Postgres RLS is deferred.

## Routing

Use this app URL shape:

```txt
/:workspaceSlug/:teamKey/...
```

Required routes:

```txt
/
/login
/onboarding
/:workspaceSlug/:teamKey/issues
/:workspaceSlug/:teamKey/issues/$issueKey
/:workspaceSlug/:teamKey/projects
/:workspaceSlug/settings/members
/api/auth/$
/api/rpc/$
```

Root route behavior:

- If unauthenticated, redirect to `/login`.
- If authenticated with no workspace, redirect to `/onboarding`.
- If authenticated with workspace/team, redirect to the active/default team issues route.

When a user opens a workspace slug different from the active organization:

- If they are a member, set that workspace as active and continue.
- If not, reject/redirect with an authorization-safe error.

## Data Model

Issues are team-scoped and use identifiers like:

```txt
CORE-123
```

The issue number is generated transactionally from a per-team counter.

Issue fields:

- ID
- Team ID
- Project ID, optional
- Status ID
- Assignee ID, optional
- Creator ID
- Issue number
- Issue key
- Title
- BlockNote JSON description
- Derived plain/search text
- Priority
- Created timestamp
- Updated timestamp
- Archived timestamp, optional

Priority values:

- No priority
- Low
- Medium
- High
- Urgent

Statuses are customizable per team, but use fixed categories for behavior:

- Backlog
- Unstarted
- Started
- Completed
- Canceled

Projects are minimal:

- Name
- Slug
- Description
- Lead
- Status
- Created timestamp
- Updated timestamp
- Archived timestamp, optional

Comments use BlockNote JSON, author/timestamps, and owner/admin deletion rules.

## API Layer

Use oRPC under `/api/rpc/$`.

Use typed internal contracts with:

- Zod input schemas
- Zod output schemas where useful
- Structured errors
- Auth middleware
- Active organization/team resolution
- Strict ownership and tenant checks

Use TanStack Query through oRPC for UI data loading, mutations, cache invalidation, and loading states.

## Auth And Email

Configure Better Auth with:

- Drizzle Postgres adapter
- Email/password
- Google OAuth
- Email verification required
- Password reset
- Organization plugin
- Teams
- Roles: owner, admin, member
- Invitations

Use Resend for:

- Email verification
- Password reset
- Workspace invitations

Do not send issue activity notifications in v1.

## UI

Use shadcn-style local components with Tailwind and lucide icons.

Required UI surfaces:

- Login/signup screen
- Onboarding flow for workspace + default team creation
- App shell with sidebar
- Workspace switcher
- Team switcher
- Issue list
- Issue detail/editor
- Issue create/edit flows
- Basic filters
- Project list
- Member settings
- Invite member flow

Use BlockNote client-only for issue descriptions and comments.

Store BlockNote JSON as the canonical document format. Generate derived plain text/search text separately.

Disable or defer file/image uploads.

## Local Development

Add:

- Docker Compose Postgres
- `.env.example`
- Drizzle config
- Migration scripts
- Seed script

Required scripts:

```json
{
	"db:generate": "drizzle-kit generate",
	"db:migrate": "drizzle-kit migrate",
	"db:studio": "drizzle-kit studio",
	"db:seed": "bun run src/server/db/seed.ts"
}
```

Required env values:

```txt
DATABASE_URL=
BETTER_AUTH_SECRET=
APP_ORIGIN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
```

## Testing

Run the existing checks:

```bash
bun run lint
bun run fmt:check
bun run test
bun --bun run build
```

Add Vitest integration tests with a test Postgres database for:

- Migrations
- Seed data
- Auth session setup
- Workspace onboarding
- Organization/team authorization
- Cross-tenant denial
- Issue creation
- Concurrent issue counter generation
- Issue filtering
- Project linking
- Comment create/edit/delete
- Archive behavior
- Invitation flow
- Role restrictions

Add focused UI smoke tests for:

- Login route
- Onboarding redirect
- Protected route redirect
- Issue list render
- Issue detail render
- BlockNote client-only loading

## Acceptance Criteria

V1 is complete when:

- A new user can sign up, verify email, create a workspace and team, and land in the issues screen.
- A user can log in with email/password or Google.
- An owner/admin can invite members by email.
- A member can create, edit, filter, assign, comment on, and archive issues.
- Issues use stable team keys like `CORE-123`.
- Projects can be created and linked to issues.
- Users cannot access or mutate data outside their active authorized workspace/team.
- The app builds successfully with TanStack Start.
- DB setup is reproducible locally with Docker Compose and Drizzle migrations.
