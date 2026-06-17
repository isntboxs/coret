# Core Issue Loop PRD

This PRD defines the smallest shippable milestone on the path to the larger [Linear Clone V1 Plan](./prd.md). It narrows the first release to the Core Issue Loop: Workspace Members can create, find, and update issues inside a public Team's workflow.

## 1. Executive Summary

**Problem Statement**:
The current V1 plan is too broad for a first implementation milestone. It includes private teams, projects, cycles, labels, comments, attachments, custom views, command menu, search, invitations, and rich editor behavior before the basic issue loop has been proven end-to-end.

**Proposed Solution**:
Ship a focused Core Issue Loop first. The app will support OAuth sign-in, session-gated Workspace Creation on `/`, Welcome Flow setup, public Teams, default Workflow Statuses, issue creation, issue list/detail, and issue property updates through the existing TanStack Start, Better Auth, Drizzle, oRPC, and TanStack Query stack.

**Success Criteria**:

- A signed-in user with no Workspace can create a Workspace, get a Default Team, complete or skip Welcome Flow steps, and land at `/:workspaceSlug/team/:teamKey/active`.
- A Workspace Member can create an Issue with a title and receive a stable team-scoped issue key such as `CORE-1`.
- A Workspace Member can view, filter lightly, and open Issues in a Team issue list without leaving the Workspace context.
- A Workspace Member can update title, description, Workflow Status, assignee, priority, estimate, and due date from Issue detail.
- Protected routes and oRPC procedures reject unauthenticated users and users outside the Issue's Workspace.

Source basis:

- Existing local docs: [Linear Clone V1 Plan](./prd.md), [Coret glossary](../../CONTEXT.md), and [ADR 0001](../adr/0001-better-auth-with-domain-policies.md).
- Linear docs references already used by the parent V1 plan: https://linear.app/docs/conceptual-model, https://linear.app/docs/creating-issues, https://linear.app/docs/configuring-workflows, https://linear.app/docs/default-team-pages, https://linear.app/docs/workspaces, https://linear.app/docs/login-methods, https://linear.app/docs/profile, https://linear.app/docs/github, https://linear.app/docs/slack, https://linear.app/docs/invite-members, https://linear.app/docs/account-preferences, and https://linear.app/docs/teams.
- Better Auth organization model reference: https://better-auth.com/docs/plugins/organization#usage.

## 2. User Experience & Functionality

**User Personas**:

- **First Workspace Owner**: A signed-in user setting up a new Workspace and first Team.
- **Workspace Member**: A person who belongs to a Workspace and manages Issues in public Teams.

**User Stories**:

- As a First Workspace Owner, I want OAuth to return me to `/` and show Workspace Creation when I have no Workspace so that the first setup step is clear.
- As a First Workspace Owner, I want to create a Workspace and Default Team so that I can start tracking issues immediately.
- As a First Workspace Owner, I want to complete or skip Welcome Flow setup steps so that my profile, invitations, integrations, and update preferences are captured before I enter the app.
- As a Workspace Member, I want to see a Team's Issues so that I can understand current work.
- As a Workspace Member, I want to create an Issue quickly so that new work is captured without setup overhead.
- As a Workspace Member, I want to open and update an Issue so that the Issue reflects its current status and ownership.
- As a Workspace Member, I want Issue access to stay inside my Workspace so that another Workspace's Issues are not visible or mutable.

**Acceptance Criteria**:

- Workspace Creation and Welcome Flow:
  - `/login` supports Google and GitHub OAuth only.
  - OAuth callback and new-user callback URLs return to `/`.
  - `/` shows the public landing/Get started page when no signed-in session exists.
  - `/` renders Workspace Creation when a signed-in user has no Workspace.
  - `/` redirects signed-in users with an active Workspace and Team to `/:workspaceSlug/team/:teamKey/active`.
  - Workspace Creation creates a Workspace and one Default Team in one completed user flow.
  - The Default Team name comes from the Workspace name.
  - The Default Team receives a generated Team key, default timezone, default Workflow Statuses, and a Team Issue Counter.
  - Workspace Creation sets the active Workspace and active Team on the session.
  - After Workspace Creation, the user lands at `/:workspaceSlug/welcome`.
  - `/onboarding`, if present for compatibility, redirects to `/` and is not a new product surface.

- Welcome Flow:
  - `/:workspaceSlug/welcome` is accessible only to Workspace Members of that Workspace.
  - Welcome progress is persisted so refreshes and deep links resume the current incomplete step.
  - Step 1 captures profile picture, name, username, and title.
  - Step 2 lets the user copy an invitation link and enter invitee emails in a textarea separated by commas.
  - Step 2 allows empty input and treats it as a skipped invitation step.
  - Step 3 offers GitHub authentication or skip.
  - Step 4 shows Slack connect as a skip-only deferred step and requires no Slack credentials or backend Slack integration.
  - Step 5 captures changelog opt-in, onboarding email opt-in, and a follow link/action.
  - Finishing Welcome redirects to `/:workspaceSlug/team/:teamKey/active`.

- Team issue list:
  - `/:workspaceSlug/team/:teamKey/active` renders active issues for the selected Team.
  - `/:workspaceSlug/team/:teamKey/backlog` renders backlog issues for the selected Team.
  - `/:workspaceSlug/team/:teamKey/archive` renders archived issues for the selected Team.
  - The list shows issue key, title, Workflow Status, assignee, priority, estimate, due date, and updated timestamp.
  - The active and backlog lists exclude archived issues.
  - The list supports lightweight filters for Workflow Status and assignee.
  - Empty, loading, and error states are implemented.
  - Legacy `/:workspaceSlug/teams/:teamKey/issues/active`, `/:workspaceSlug/teams/:teamKey/issues/backlog`, and `/:workspaceSlug/teams/:teamKey/issues/archive` routes redirect to the singular canonical routes.

- Issue creation:
  - A create issue action is available from the team issue list.
  - Title is required.
  - Description, assignee, priority, estimate, due date, and Workflow Status are optional or defaulted.
  - If no Workflow Status is selected, the Team's default Workflow Status is used.
  - Issue number generation is transactional through `team_issue_counter`.
  - The created issue key uses the Team key and generated issue number.
  - The creator is stored as the signed-in user.

- Issue detail and updates:
  - `/:workspaceSlug/team/:teamKey/issues/$issueKey` renders the canonical issue detail route.
  - The detail page shows title, description, Workflow Status, assignee, creator, priority, estimate, due date, created timestamp, and updated timestamp.
  - A Workspace Member can update title, description, Workflow Status, assignee, priority, estimate, and due date.
  - Moving an issue into a Started, Completed, or Canceled status category updates `startedAt`, `completedAt`, or `canceledAt` consistently.
  - Moving an issue out of Completed clears `completedAt`.
  - Moving an issue out of Canceled clears `canceledAt`.
  - Updates return authoritative records and refresh list/detail state through TanStack Query invalidation.

- Access control:
  - Every protected oRPC procedure requires an authenticated session.
  - Every issue read/write verifies workspace membership.
  - Public Team issues are visible to Workspace Members.
  - Cross-workspace issue reads and writes return an authorization-safe error.
  - Private Team behavior is intentionally outside this PRD.

**Non-Goals**:

- Private Teams and private-team visibility rules.
- Workspace member admin and role-management UI.
- Invitation delivery is limited to the Welcome Flow invite step; full invitation settings and resend/cancel management are deferred.
- Team settings beyond default public Team creation.
- Workflow Status customization UI.
- Projects, Project Milestones, Project Statuses, and multi-team project behavior.
- Cycles.
- Labels and Label Groups.
- Comments, Activity timeline, Issue Subscriptions, and Mentions.
- Attachments, file upload, link previews, object storage, and SSRF guard work.
- Issue Relations, Duplicate Issue behavior, Sub-Issues, and moving issues between teams.
- Issue Templates and recurring issues.
- Saved Issue Views, custom display options, manual ordering, and drag/drop.
- My Issues, Workspace Search, Command Menu, and broad keyboard shortcut coverage.
- Realtime collaboration, notification delivery, Inbox, and email notifications.
- Postgres RLS.
- BlockNote rich editor. Core Issue Loop may use a plain textarea and store a minimal validated description representation.

## 3. AI System Requirements

Not applicable. Core Issue Loop is a product workflow milestone and does not include AI features.

## 4. Technical Specifications

**Architecture Overview**:

- TanStack Start owns routing, SSR document shell, and API route mounting.
- Better Auth owns users, sessions, Workspaces through organizations, Workspace Members, Teams, Team Members, and OAuth sign-in.
- Drizzle and Postgres own persistence.
- oRPC under `/api/rpc/$` owns typed server procedures and structured errors.
- TanStack Query owns client-side fetching, mutations, cache invalidation, and optimistic UI where low-risk.
- Domain policy functions remain the only supported access-control path for protected data.

Current codebase baseline:

- Auth, Better Auth organization plugin, Drizzle schemas, oRPC base/protected procedures, login UI, and Workspace Creation UI already exist.
- Domain tables already include Teams, Workflow Statuses, Issues, Issue Key History, and Team Issue Counters.
- Workspace Creation must be expanded from simple Workspace creation to Workspace plus Default Team creation.
- Welcome Flow route/API implementation still needs to be added.
- Route/API implementation for Teams and Issues still needs to be added.

Core data model:

- `user`, `session`, `account`, `organization`, `member`, `team`, and `team_member` come from the Better Auth-backed schema.
- `team.visibility` must be set to `public` for all Teams created by Core Issue Loop.
- `issue_status` stores Team-specific Workflow Statuses with fixed behavior categories.
- `team_issue_counter` stores the next issue number for each Team.
- `issue` stores the Issue record, including team, status, assignee, creator, issue number, issue key, title, description, derived text, priority, estimate, due date, lifecycle timestamps, and archive timestamp.
- `issue_key_history` can remain in the schema but issue moves and old-key redirects are out of scope for this PRD.

Default Workflow Statuses:

- Backlog: `Backlog`
- Unstarted: `Todo`
- Started: `In Progress`
- Completed: `Done`
- Canceled: `Canceled`

Routing:

- `/`
- `/login`
- `/:workspaceSlug/welcome`
- `/:workspaceSlug/team/:teamKey/active`
- `/:workspaceSlug/team/:teamKey/backlog`
- `/:workspaceSlug/team/:teamKey/archive`
- `/:workspaceSlug/team/:teamKey/issues/$issueKey`
- `/api/auth/$`
- `/api/rpc/$`

oRPC procedures:

- `workspace.createWithDefaultTeam`
- `workspace.listMine`
- `welcome.updateProfile`
- `welcome.inviteTeammates`
- `welcome.connectGithub`
- `welcome.updateSubscriptions`
- `team.listByWorkspace`
- `team.getByKey`
- `issueStatus.listByTeam`
- `issue.listByTeam`
- `issue.getByKey`
- `issue.create`
- `issue.update`

Procedure behavior:

- Inputs use Zod schemas.
- Outputs are typed and stable enough for TanStack Query hooks.
- Mutations return the updated authoritative entity.
- Errors distinguish validation, unauthorized, forbidden, not found, and conflict cases.
- `workspace.createWithDefaultTeam` input is `name`, `slug`, and optional `region`.
- `workspace.createWithDefaultTeam` output is `workspace`, `defaultTeam`, `welcomeRequired: true`, and `redirectTo`.
- `workspace.createWithDefaultTeam` sets active Workspace and active Team on the session.
- `welcome.updateProfile` accepts profile picture URL/blob reference, name, username, and title.
- `welcome.inviteTeammates` accepts comma-separated emails parsed into invitations and allows empty input for skip.
- `welcome.connectGithub` records OAuth start/complete or skipped state.
- `welcome.updateSubscriptions` records changelog opt-in and onboarding email opt-in.
- `issue.create` runs issue counter increment and issue insert in one database transaction.

Security & Privacy:

- No protected procedure may trust `workspaceSlug`, `teamKey`, `issueKey`, or user-submitted IDs without resolving them server-side.
- Workspace membership is checked before returning any workspace, team, status, or issue data.
- Assignee changes can only target Workspace Members in the same Workspace.
- Status changes can only target Workflow Statuses belonging to the issue's Team.
- Issue keys must not expose cross-workspace records.
- Private Team records, if present from future work or manual data, are not part of the required Core Issue Loop behavior and should not be created by Core Issue Loop UI.

Local development:

- Use the existing Docker Compose Postgres setup.
- Use `bunx drizzle-kit push` during pre-V1 schema iteration.
- Do not generate or commit migration files until the larger V1 schema is marked stable in the parent PRD.
- A minimal seed should create one workspace, one public Team, default Workflow Statuses, a team issue counter, and several Issues across statuses.

Testing:

- Run:

```bash
bun run lint
bun run fmt:check
bun run test
bun --bun run build
```

- Add focused tests for:
  - Protected oRPC procedure rejection when unauthenticated.
  - OAuth callback/new user lands on `/`.
  - Signed-in user with no Workspace sees Workspace Creation on `/`.
  - Workspace Creation creates Workspace, Default Team, Team key, default Workflow Statuses, Team Issue Counter, active session Workspace, and active session Team.
  - Workspace Creation redirects to `/:workspaceSlug/welcome`.
  - Welcome Flow steps can be completed or skipped according to scope.
  - Slack Welcome step is skip-only and does not require Slack credentials.
  - Welcome finish redirects to `/:workspaceSlug/team/:teamKey/active`.
  - Old plural Team routes redirect to singular canonical routes.
  - Cross-workspace access to `/:workspaceSlug/welcome` and Team pages remains authorization-safe.
  - Issue creation generates sequential issue keys under concurrent requests.
  - Issue list excludes cross-workspace Issues.
  - Issue detail denies cross-workspace access.
  - Issue update rejects statuses from another Team.
  - Issue update rejects assignees outside the Workspace.
  - Completed and canceled timestamp transitions.

## 5. Risks & Roadmap

**Phased Rollout**:

- **Core Issue Loop**: OAuth, Workspace Creation on `/`, Welcome Flow, public teams, default Workflow Statuses, issue list, issue create, issue detail, and issue update.
- **Scale Step 1**: Workspace invitations, member admin, Team settings, and Workflow Status customization.
- **Scale Step 2**: Private Teams and the full policy matrix from ADR 0001.
- **Scale Step 3**: Projects, Project Milestones, Labels, Cycles, and saved Issue Views.
- **Scale Step 4**: Comments, Activity, subscriptions, mentions, attachments, command menu, workspace search, and richer Linear-like workflows.

**Technical Risks**:

- Better Auth Team primitives may not cover all Linear-like Team metadata without careful adapter/schema handling.
- Issue counter generation must be transactionally safe before any UI polish matters.
- A plain textarea description can become migration debt if the stored representation does not leave a clean path to BlockNote JSON.
- Deferring Private Teams reduces first milestone complexity, but policy functions still need names and boundaries that match ADR 0001.
- Existing broad schema can tempt implementation to pull in deferred features too early.

**Scale-Up Contract**:

- Keep the canonical domain terms from [CONTEXT.md](../../CONTEXT.md).
- Keep Team as the Issue boundary.
- Keep issue keys team-scoped.
- Keep Workflow Statuses Team-specific.
- Keep app-layer policy functions as the access-control boundary.
- Keep Private Teams deferred from this PRD but compatible with the accepted ADR and the parent V1 plan.
