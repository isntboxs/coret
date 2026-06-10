# ADR 0001 — Better Auth with Domain Policies

## Status

Accepted

## Context

V1 needs multi-workspace authentication, team-scoped access control, and a permission model that mirrors Linear's public/private team semantics. The stack already includes Better Auth with its organization plugin, which provides users, sessions, organizations (workspaces), teams, memberships, roles, and invitations out of the box.

Linear's access model requires fine-grained, domain-aware rules that go beyond what Better Auth or a generic RBAC layer provides:

- Public teams are visible to all workspace members; private teams are visible only to their members.
- Issues, attachments, search results, and project associations must respect team visibility.
- Issue key resolution must never reveal whether an inaccessible issue key exists.
- Projects spanning both public and private teams must show only the context the viewer is allowed to see.

These policies are tightly coupled to domain concepts (teams, issues, projects, cycles) that live outside Better Auth's data model.

## Decision

Use Better Auth's organization plugin as the source of truth for authentication and organizational primitives (workspaces, members, teams, team membership, roles, invitations). Implement Linear-like access control in explicit domain policy functions that run in the app layer.

Specifically:

- Better Auth organizations map to workspaces; Better Auth teams map to teams; Better Auth team members map to joined team membership.
- All oRPC procedures call shared policy functions (`canViewTeam`, `canJoinTeam`, `canViewIssue`, `canCreateIssueInTeam`, `canAssignIssueToUser`, `canViewProjectTeamAssociation`, etc.) before reading or mutating protected data.
- Attachment download/preview routes, workspace search, and issue key resolution invoke the same policies.
- Public team access is derived from workspace membership. Private team access requires joined team membership.
- V1 uses workspace roles (owner/admin/member) plus team creator metadata instead of a full team-role system.
- Postgres RLS is deferred; tenant isolation is enforced at the app layer.

## Consequences

### Benefits

- **Domain-aligned**: Policies live next to the domain logic they protect, making access rules readable and auditable in the same codebase that defines issues, projects, and teams.
- **Testable in isolation**: Policy functions can be unit-tested with focused scenarios — cross-workspace denial, private team denial, project partial visibility, attachment denial, search denial, and issue key alias denial — without requiring database-level tooling.
- **Flexible**: New domain rules (e.g., future sub-teams, team-level roles, guest access) can be added as functions without migrating RLS policies or managing row-level predicate complexity.
- **Single enforcement point**: Shared policy functions called by every server path avoid the split-brain risk of maintaining parallel app-layer and RLS rule sets.

### Tradeoffs

- **No defense in depth at the DB layer**: A bug in the app layer (missed policy check, new endpoint without a guard) can expose data. RLS would provide a safety net at the Postgres level.
- **Performance at scale**: App-layer policies require fetching membership/team data on each request. RLS can push filtering into the query planner. For V1's expected scale this is acceptable; caching and query design mitigate the cost.
- **Migration cost if RLS is added later**: Retrofitting RLS onto an established app-layer policy model requires writing equivalent row predicates and validating that both layers agree — a non-trivial effort.

## Alternatives

### Postgres RLS instead of app-layer policies

RLS would enforce tenant isolation at the database level, providing defense in depth regardless of application bugs. However:

- Linear's access model depends on domain context (team visibility, project-team associations, issue key history) that is awkward to express in RLS predicates.
- RLS predicates would duplicate logic already needed in the app layer for UI-visible authorization decisions (e.g., "can this user see this project's private-team context?").
- Maintaining two parallel rule sets increases the risk of divergence and makes policy changes harder to reason about.
- Testing RLS predicates requires database-level test infrastructure that the V1 stack does not yet provide.

RLS is explicitly deferred (see PRD, "Deferred from v1"), not rejected. The app-layer policy architecture is designed so that RLS can be layered in later as a secondary enforcement mechanism if the product outgrows the single-layer model.

### Better Auth organization plugin roles only

Better Auth's built-in roles (owner, admin, member) cover workspace-level permissions but do not model team-level visibility, per-issue access, or cross-entity rules like project partial visibility. Relying solely on Better Auth roles would require encoding domain semantics into role metadata or middleware, which is less explicit and harder to test than dedicated policy functions.
