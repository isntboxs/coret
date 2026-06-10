# Linear Clone V1 Plan

## Summary

Build a usable Linear-like Issue MVP on TanStack Start.

The app will support multi-workspace collaboration, team-scoped issues, authentication, PostgreSQL persistence, typed API procedures, and a dense product UI. The added stack is Drizzle ORM, Postgres, oRPC, Better Auth, TanStack Query, Resend, and BlockNote.

## Product Scope

V1 focuses on an Issue MVP:

- Workspaces and teams
- Public and private teams
- Workspace members with owner/admin/member roles
- OAuth-only auth with Google and GitHub
- Provider-verified email required
- Invitations via Resend
- Team-scoped issues
- Moving issues between teams
- Custom workflow statuses per team
- Issue list and issue detail/editor
- Issue templates
- Linear-like projects
- Project milestones
- Markdown/rich comments
- Basic issue activity timeline
- Issue subscriptions
- Member mentions
- Issue attachments and file uploads
- Basic filters
- Issue labels and label groups
- Issue relations and sub-issues
- Cycles
- Saved issue views
- My Issues
- Issue estimates
- Issue due dates
- Command menu
- Workspace search
- Linear-like issue composer
- Limited bulk issue actions
- Archive and unarchive
- Team settings
- Workspace settings
- Member settings

Deferred from v1:

- Realtime collaboration
- Bulk issue move between teams
- Bulk issue delete
- Bulk issue relation changes
- Persistent undo system
- Triage
- Sub-teams
- Initiatives
- Standalone documents
- Project and document templates
- Recurring issues
- Mermaid diagrams
- Document mentions
- Synced external comments
- AI comment summaries
- Inline comments on descriptions
- Issue email notifications
- Notification delivery
- Inbox
- View subscriptions
- Mention notifications
- Auto-close and auto-archive
- Hard-delete grace flow
- Postgres RLS

## Architecture

Use Better Auth as the source of truth for users, sessions, organizations, teams, memberships, roles, and invitations.

Better Auth provides the authentication, organization, team, member, invitation, active organization, and active team primitives. Linear-like access behavior is implemented in the app's domain policy layer:

- Better Auth organizations map to workspaces.
- Better Auth members map to workspace members.
- Better Auth teams map to teams.
- Better Auth team members map to joined team membership and private-team access.
- Public team visibility is derived from workspace membership, not only from team membership.
- Private team visibility requires team membership.
- Domain policies must resolve `canViewTeam`, `canJoinTeam`, `canViewIssue`, `canCreateIssueInTeam`, `canAssignIssueToUser`, and `canViewProjectTeamAssociation`.
- Team records need Linear-specific fields such as team key, visibility, creator, and manager-ready metadata.
- V1 uses workspace roles plus team creator/manager metadata instead of a full team-role system.

Reference docs:

- https://better-auth.com/docs/plugins/organization#usage
- https://linear.app/docs/teams
- https://linear.app/docs/private-teams

Use domain tables for Linear-specific data:

- Projects
- Project statuses
- Project milestones
- Issue statuses
- Issues
- Issue key history
- Issue templates
- Comments
- Issue activities
- Issue subscriptions
- Issue attachments
- Team issue counters
- Issue labels
- Label groups
- Issue relations
- Cycles
- Issue views

Use UUID strings for domain table IDs.

Use app-layer tenant checks in every protected server/API path. Postgres RLS is deferred.

RLS is deferred, but policy-first server architecture is required:

- All oRPC procedures call shared policy functions before reading or mutating protected data.
- Attachment download and preview routes call the same issue/project visibility policies.
- Workspace search applies visibility filters before ranking or returning results.
- Project list and detail queries filter private team associations according to viewer access.
- Issue key resolver never reveals whether an inaccessible issue key exists.
- Policy tests must cover cross-workspace denial, private team denial, project partial visibility, attachment denial, search denial, and issue key alias denial.

Reference docs:

- https://linear.app/docs/private-teams
- https://better-auth.com/docs/plugins/organization#usage
- https://linear.app/docs/slack

Access control follows Linear's public/private team model:

- Teams have visibility: public or private.
- Workspace members can view and join public teams.
- Private team issues are visible only to members of that private team.
- A private team's identity and team-specific issue context must not leak through multi-team project views to non-members.
- Projects associated with both public and private teams remain visible through the teams the viewer can access.
- Non-members of a private team can see only the project context available through public or otherwise accessible teams.
- Sharing private team issues with non-members, private team guest exceptions, exports, and integration caveats are deferred.

Permission model:

- Workspace roles are owner, admin, and member.
- Team records track the creator.
- Public teams can be viewed, joined, and left by workspace members.
- Workspace owner/admin can update, archive, or remove teams.
- Team creators can update basic team settings.
- Private team work is visible only to team members.
- Workspace owner/admin and the private team creator can manage private team membership in v1.
- A full team owner/manager role system is deferred, but naming should allow it later.

Reference docs:

- https://linear.app/docs/private-teams
- https://linear.app/docs/teams
- https://linear.app/docs/sub-teams

## Routing

Use this app URL shape:

```txt
/:workspaceSlug/teams/:teamKey/...
```

Required routes:

```txt
/
/login
/onboarding
/:workspaceSlug/my/issues
/:workspaceSlug/issues/$issueKey
/:workspaceSlug/teams/:teamKey
/:workspaceSlug/teams/:teamKey/issues
/:workspaceSlug/teams/:teamKey/issues/active
/:workspaceSlug/teams/:teamKey/issues/backlog
/:workspaceSlug/teams/:teamKey/issues/archive
/:workspaceSlug/teams/:teamKey/issues/$issueKey
/:workspaceSlug/teams/:teamKey/cycles
/:workspaceSlug/teams/:teamKey/cycles/current
/:workspaceSlug/teams/:teamKey/cycles/upcoming
/:workspaceSlug/teams/:teamKey/cycles/$cycleId
/:workspaceSlug/teams/:teamKey/projects
/:workspaceSlug/teams/:teamKey/views
/:workspaceSlug/teams/:teamKey/views/$viewId
/:workspaceSlug/teams/:teamKey/settings
/:workspaceSlug/projects
/:workspaceSlug/projects/$projectSlug
/:workspaceSlug/projects/$projectSlug/issues
/:workspaceSlug/views
/:workspaceSlug/views/$viewId
/:workspaceSlug/settings
/:workspaceSlug/settings/members
/api/auth/$
/api/rpc/$
```

Issue URL rules:

- Canonical issue detail route is `/:workspaceSlug/teams/:teamKey/issues/$issueKey`.
- Workspace-level issue resolver route is `/:workspaceSlug/issues/$issueKey`.
- The resolver finds the issue by current or historical issue key and redirects to the canonical route when the viewer has access.
- Issue key history is stored so old issue keys continue to resolve after a move between teams.
- Inaccessible or unknown issue keys return an authorization-safe not found response.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/editing-issues

Moving an issue between teams follows Linear's documented behavior:

- Single-issue move between teams is included in v1.
- Undo move is deferred.
- Bulk move is deferred.
- The target team must be in the same workspace and accessible to the actor.
- Moving an issue generates a new issue number and issue key in the target team transactionally.
- The old issue key is stored in issue key history.
- Old issue URLs and workspace-level issue resolver URLs redirect to the current canonical route.
- Status maps to a status with the same name in the target team when available.
- If no same-name status exists, status maps to the first status in the same category.
- Cycle is removed.
- Team labels are removed unless matching labels exist in the target team or workspace.
- Project is removed unless the project is associated with the target team.
- Relations remain.
- Priority, estimate, due date, description, comments, attachments, and subscriptions remain.

Reference docs:

- https://linear.app/docs/editing-issues
- https://linear.app/docs/conceptual-model
- https://linear.app/docs/teams

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
- Project milestone ID, optional
- Cycle ID, optional
- Status ID
- Assignee ID, optional
- Creator ID
- Parent issue ID, optional
- Issue number
- Issue key
- Previous issue keys
- Title
- BlockNote JSON description
- Derived plain/search text
- Priority
- Estimate, optional
- Due date, optional
- Labels
- Attachments
- Created timestamp
- Updated timestamp
- Started timestamp, optional
- Completed timestamp, optional
- Canceled timestamp, optional
- Archived timestamp, optional

### Editor content requirements

- The server must validate every incoming BlockNote JSON description against the BlockNote schema before storing it.
- The server must reject a BlockNote JSON description larger than 256 KB or nested deeper than 16 levels to limit denial-of-service risk.
- Malformed or malicious BlockNote JSON description payloads must be rejected with clear validation error codes and must not be partially stored.
- Derived plain/search text must be extracted only from a validated BlockNote JSON description and must be sanitized or escaped before indexing, rendering, or logging to prevent XSS.
- Node-level validation for a BlockNote JSON description must verify referenced workspace member IDs exist and that private-team references respect the viewer's private-team access rules.
- Derived plain/search text must not include inaccessible private-team names, member references, or other text derived from BlockNote JSON description nodes the actor cannot access.

Issue templates are included in v1:

- Templates can be scoped to the workspace or a specific team.
- Templates pre-fill the issue composer.
- Template fields include name, description content, default status, priority, estimate, labels, assignee, project, and cycle.
- Team settings can list, create, edit, and archive issue templates.
- The composer can create an issue from a template.
- Project templates and document templates are deferred.
- Sub-team template inheritance is deferred.
- Recurring issues are deferred, but the issue template model should not block them later.

Reference docs:

- https://linear.app/docs/creating-issues
- https://linear.app/docs/teams
- https://linear.app/docs/sub-teams

Priority values:

- No priority
- Low
- Medium
- High
- Urgent

Estimate values:

- No estimate
- 1
- 2
- 3
- 5
- 8
- 13
- 21

Statuses are customizable per team, but use fixed categories for behavior:

- Backlog
- Unstarted
- Started
- Completed
- Canceled
- Duplicate, reserved

Workflow status rules:

- Team statuses have name, color, description, category, position, and default flag.
- Duplicate category/status is reserved and cannot be user-created.
- Each team must have at least one status in Backlog, Unstarted, Started, Completed, and Canceled.
- Statuses can be reordered only within their category.
- A team has one default status, selected from Backlog or Unstarted.
- Active issue views include Unstarted and Started statuses.
- Backlog issue views include Backlog statuses.
- All issue views exclude archived issues but include Completed and Canceled statuses.
- Issue timestamps track category transitions with `startedAt`, `completedAt`, and `canceledAt`.
- Moving out of Completed clears `completedAt`.
- Moving out of Canceled clears `canceledAt`.

Reference docs:

- https://linear.app/docs/configuring-workflows
- https://linear.app/docs/default-team-pages
- https://linear.app/docs/google-sheets

Projects follow Linear's project model:

- Name
- Slug
- Summary
- Description
- Icon, optional
- Workspace ID
- Associated teams
- Lead
- Members
- Status
- Priority
- Start date/timeframe, optional
- Target date/timeframe, optional
- Created timestamp
- Updated timestamp
- Completed timestamp, optional
- Canceled timestamp, optional
- Archived timestamp, optional

Project statuses are customizable and separate from issue workflow statuses:

- Project statuses are scoped to a workspace.
- Project status values have name, color, description, category, position, and default flag.
- Default project status categories are Planned, In Progress, Paused, Completed, and Canceled.
- Workspace admins can customize project statuses within those categories.
- Workspace project status settings are included in v1.
- Workspace owner/admin can create, edit, archive, and reorder project statuses.
- Project statuses can be reordered only within their category.
- Each project status category must keep at least one status.
- Seed defaults are Planned, In Progress, Paused, Completed, and Canceled.
- Project completion and cancellation timestamps track status category transitions.
- Moving out of Completed clears `completedAt`.
- Moving out of Canceled clears `canceledAt`.
- Project health/update reporting is deferred.
- Project status automations are deferred.

Reference docs:

- https://linear.app/docs/projects
- https://linear.app/docs/display-options
- https://linear.app/docs/initiative-and-project-updates

Project rules:

- A project belongs to one workspace.
- A project can be associated with multiple teams.
- A project must have at least one associated team.
- An issue can belong to zero or one project.
- An issue can only be assigned to a project when the issue's owning team is associated with that project.
- Team project pages show projects associated with that team.
- Workspace project pages show all projects in the workspace that the viewer can access.
- Project pages include an overview surface.
- Project pages include an issues tab.
- Project pages support project-attached issue views.
- Project pages include a properties sidebar for lead, members, status, priority, start timeframe, target timeframe, and associated teams.
- Project updates and health reports are deferred.

Project milestones follow Linear's project milestone model:

- A milestone belongs to exactly one project.
- An issue can belong to zero or one project milestone.
- An issue can only be assigned to a milestone if the issue belongs to that milestone's project.
- Project overview/sidebar can list milestones.
- Project issue views can filter and group by milestone.
- Complex milestone analytics are deferred.
- Cross-project milestones are out of scope.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/projects
- https://linear.app/docs/creating-issues

Comments use BlockNote JSON, author/timestamps, and owner/admin deletion rules.

Threaded comments are included in v1:

- Issues support top-level comments.
- Comments can have replies.
- Comment threads can be resolved and unresolved.
- Comment URLs can be copied.
- Comments can have file attachments.
- Users can create a new issue or sub-issue from a comment.
- Inline comments on issue descriptions are deferred.
- AI comment and thread summaries are deferred.
- Synced external comments are deferred.

Issue activity records meaningful system events:

- Issue created
- Status changed
- Assignee changed
- Priority changed
- Estimate changed
- Labels changed
- Project changed
- Cycle changed
- Relation changed
- Archived or unarchived

Comments and activities are shown together in the issue detail timeline.

Synced external comments are deferred until external integrations exist. AI comment summaries are deferred. Notification delivery is deferred; v1 emails are limited to workspace invitations.

Issue subscriptions are included as a lightweight data model:

- Issue subscribers are stored per issue and workspace member.
- Issue creators are subscribed automatically.
- Assignees are subscribed automatically.
- Members can manually subscribe or unsubscribe.
- Inbox UI is deferred.
- Notification delivery is deferred.
- View subscriptions are deferred.
- Mention-based subscriptions are deferred until mentions are explicitly designed.

Member mentions are included in v1 editor content:

- Issue descriptions and comments can contain structured member mention nodes.
- Mention picker results are limited to members the viewer is allowed to reference.
- In private team issues, users cannot mention members who are not members of that private team.
- Mention text contributes to derived plain/search text.
- Mention notification delivery is deferred.
- Mention-based auto-subscription is deferred.
- Document mentions are deferred because standalone documents are deferred.
- Mentions outside issue descriptions, comments, and supported project editor surfaces are deferred until those surfaces are designed.

Editor features deferred from v1:

- Mermaid diagrams.
- Document mentions.
- Synced external comments.
- AI comment and thread summaries.
- Inline comments on issue descriptions.

Reference docs:

- https://linear.app/docs/editor
- https://linear.app/docs/comment-on-issues
- https://linear.app/docs/project-documents

Issue attachments are included in v1:

- Issues can have file attachments.
- Issues can have link attachments.
- Link attachments store URL, optional title, source/type, creator, and timestamps.
- File attachments store file metadata, storage key, creator, and timestamps.
- Attachments appear in the issue detail/sidebar.
- The command menu can add and remove attachments.
- File/image upload UI is included in v1.
- Link attachments support rich previews in v1.
- External synced linkbacks are deferred until integrations exist.

Attachment storage:

- File binaries are stored outside Postgres in object storage.
- Local development uses MinIO through Docker Compose.
- Production uses an S3-compatible object storage provider such as Cloudflare R2 or AWS S3.
- The storage contract uses the S3-compatible API.
- Postgres stores attachment metadata and object storage keys.
- Upload and download flows use app-issued signed URLs or app proxy routes with policy checks.
- Private team access is checked before serving or downloading files.
- V1 file size limit is 25 MB.
- Broad file types are allowed, but executable and high-risk types are blocked.
- Removing a file attachment removes metadata and schedules blob deletion.
- Blocked file types include: .exe, .dll, .bat, .cmd, .sh, .ps1, .app, .dmg, .scr, .com, .pif, .jar, .vbs, .js, .msi, and files with application/x-msdownload, application/x-executable, or application/x-sh mime types.

Link previews:

- Link previews are included in v1 for issue link attachments.
- Preview metadata can include title, description, provider/source, favicon/image, and canonical URL.
- Preview fetching must avoid leaking private team URLs to unauthorized viewers.
- Failed previews fall back to the raw URL.
- Preview fetching happens server-side with SSRF guards.
- Only `http` and `https` URLs are fetched.
- Localhost, private IP ranges, link-local addresses, and cloud metadata addresses are blocked.
- Redirects are limited and every redirect target is revalidated.
- Fetches use short timeouts and response size caps.
- Preview extraction is limited to OpenGraph, Twitter card, and standard HTML title metadata.
- Preview metadata is cached by normalized URL.
- Preview fetch should run in the background so issue creation is not blocked.
- Members can refresh a preview manually.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/creating-issues
- https://linear.app/docs/notifications
- https://linear.app/docs/custom-views
- https://linear.app/docs/private-teams
- https://linear.app/docs/creating-issues
- https://linear.app/docs/slack
- https://linear.app/docs/gitlab

Issue relationships follow Linear's issue relation model:

- Supported relation types are related, blocking, blocked by, and duplicate.
- Blocking and blocked by are directional views of the same dependency relationship.
- Duplicate issues point to a canonical issue.
- Marking an issue as duplicate moves it into a reserved Duplicate workflow status/category.
- Sub-issues are represented in the v1 domain model through an optional parent issue.
- A sub-issue keeps its own owning team instead of inheriting the parent issue's team.
- V1 UI can keep relation management simple in the issue detail sidebar.
- Bulk relation actions, automatic relation creation from text mentions, and richer duplicate banners can come later.

Reference docs:

- https://linear.app/docs/issue-relations
- https://linear.app/docs/filters
- https://linear.app/docs/conceptual-model

Cycles follow Linear's team-specific cycle model:

- Cycles are scoped to a single team.
- Teams can enable or disable cycles.
- A cycle has a number/name, start date, and end date.
- Cycle state is derived from time as upcoming, current, or completed.
- An issue can belong to zero or one cycle.
- Team navigation shows Cycles only when cycles are enabled.
- V1 UI includes current cycle, upcoming cycle, and a cycle list.
- Cycle automations such as rollover and backlog movement can be deferred, but the model should support them later.
- Cycle schedule inheritance for sub-teams is out of scope until sub-teams are explicitly designed.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/teams
- https://linear.app/docs/default-team-pages

Issue views follow Linear's custom view model:

- Issue views are saved dynamic issue lists.
- V1 supports personal, team, workspace, and project-attached issue views.
- Issue views store typed filter AST configuration and display options.
- Team default views such as All, Active, and Backlog can be system views.
- Users can create a custom issue view from a filtered issue list.
- Favorite views can be supported by the model, but the UI can stay minimal.
- View subscriptions and Slack notifications are deferred.

Filters follow Linear's advanced-ready filtering model:

- Saved and temporary filters use a typed JSON AST rather than ad hoc strings.
- Filter groups support `AND` and `OR`.
- Nested groups are supported by the model, even if hidden in initial UI.
- V1 UI exposes common filters first: status, assignee, creator, priority, estimate, due date, labels, project, milestone, cycle, relations, subscriber, and content.
- Operators include is, is not, is any of, is none of, includes any, includes all, includes none, before, and after.
- Saved issue views persist the filter AST.
- URL search params can encode temporary filters, but the canonical saved format is the AST.

Reference docs:

- https://linear.app/docs/filters
- https://linear.app/docs/custom-views
- https://linear.app/docs/display-options

Display options follow Linear's issue view behavior:

- Issue views support list and board layouts.
- Issue views support grouping, ordering, and visible issue property configuration.
- Manual issue ordering is included in v1.
- Drag-and-drop issue ordering is included in v1 for supported list and board surfaces.
- Manual ordering updates the shared order for the relevant view or group.
- Group totals can show either issue count or total estimate.
- Issue lists can display due dates.
- Ordering can include due date.

Issue estimates follow Linear's optional estimate property:

- Estimates are optional on issues.
- V1 uses a Linear-like point scale: 1, 2, 3, 5, 8, 13, 21.
- Team estimate scale settings can be added later.
- Cycle pages can summarize total estimate.
- Capacity planning is deferred.

Issue due dates are included in v1:

- Issues can have an optional due date.
- Filters support due date before, after, and no due date.
- Due date notification delivery is deferred.
- Recurring issue coupling is deferred.

Reference docs:

- https://linear.app/docs/custom-views
- https://linear.app/docs/filters
- https://linear.app/docs/display-options
- https://linear.app/docs/creating-issues

Labels follow Linear's label model:

- Labels can be scoped to the workspace or to a specific team.
- Workspace labels are available across teams.
- Team labels are available only where relevant to that team.
- Label groups create one level of nesting.
- An issue can have many labels.
- An issue can have at most one label from the same label group.
- Labels can be archived to preserve historical issue context while preventing future use.
- Issue list filters must support filtering by label.

Reference docs:

- https://linear.app/docs/labels
- https://linear.app/docs/filters
- https://linear.app/docs/conceptual-model

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

Realtime transport is deferred, but v1 should still feel fast:

- No WebSocket or SSE transport in v1.
- TanStack Query mutations use optimistic updates for issue property changes, comments, and drag/drop ordering.
- Mutations return authoritative updated records.
- Targeted query invalidation keeps list, detail, project, cycle, and view data consistent.
- Light polling is acceptable for long-running background jobs such as link preview fetches.
- Simple field conflicts use last-write-wins unless a mutation needs stricter validation.
- Server-side policies and transactional writes remain authoritative.
- Manual ordering mutations must be transactional.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/display-options
- https://linear.app/docs/notifications

## Auth And Email

Configure Better Auth with:

- Drizzle Postgres adapter
- Google OAuth
- GitHub OAuth
- Provider-verified email required
- Organization plugin
- Teams
- Roles: owner, admin, member
- Invitations

Use Resend for:

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
- Lightweight team home
- My Issues
- Workspace search
- Issue list
- Issue detail/editor
- Issue create/edit flows
- Global issue composer
- Command menu
- Basic filters
- Project list
- Workspace projects page
- Team projects page
- Project overview page
- Project issues tab
- Project properties sidebar
- Team settings
- Workspace settings
- Member settings
- Invite member flow

Use BlockNote client-only for issue descriptions and comments.

Store BlockNote JSON as the canonical document format. Generate derived plain text/search text separately.

File/image uploads are included in v1 issue attachments.

Team Home follows a lightweight version of Linear's team home:

- `/:workspaceSlug/teams/:teamKey` opens the team home.
- Team home shows team name, team key, visibility, and members.
- Team home links to Issues, Active, Backlog, Cycles, Projects, Views, and Archive.
- Documents, pinned resources, and team resource management are deferred.
- Clicking a team in the sidebar opens team home.
- Root/default app redirects can still land users on the default team issue view.

Reference docs:

- https://linear.app/docs/default-team-pages
- https://linear.app/docs/teams
- https://linear.app/docs/conceptual-model

Team Settings follow a focused subset of Linear's team settings:

- General settings include team name, team key, visibility, and timezone.
- Members settings show joined members.
- Public team members can join and leave.
- Private team managers can add and remove private team members.
- Workflow status settings are included.
- Label and label group settings are included.
- Issue template settings are included.
- Cycle enable/config settings are included.
- Team archive/retirement and team deletion are deferred.
- Slack, GitHub/GitLab, issue email intake, Triage, and recurring issue settings are deferred.

Reference docs:

- https://linear.app/docs/teams
- https://linear.app/docs/configuring-workflows
- https://linear.app/docs/labels
- https://linear.app/docs/creating-issues
- https://linear.app/docs/default-team-pages

Workspace Settings are included with a focused admin scope:

- Workspace profile settings include name, slug, and optional logo.
- Members settings list workspace members.
- Owners/admins can invite members.
- Owners/admins can update workspace member roles: owner, admin, member.
- Owners/admins can remove workspace members, subject to last-owner protection.
- Invitation settings show pending invitations and allow cancel/resend.
- Workspace label and label group settings are included.
- Project status settings are included.
- Billing is deferred.
- Integrations are deferred.
- AI settings are deferred.
- Notification preference settings are deferred.
- Workspace deletion is deferred.

Reference docs:

- https://linear.app/docs/labels
- https://linear.app/docs/projects
- https://better-auth.com/docs/plugins/organization#usage

My Issues follows Linear's personal issue surface:

- `/:workspaceSlug/my/issues` opens My Issues.
- V1 includes Assigned, Created, and Subscribed tabs or saved system views.
- My Issues reuses the normal issue list and display options.
- My Issues respects private team access.
- Focus grouping is deferred.
- Inbox is deferred.
- Notification delivery is deferred.
- My Issues is reachable from the sidebar and command menu.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/notifications
- https://linear.app/docs/display-options

Archive behavior follows Linear's archive model:

- Issues, projects, and cycles have `archivedAt`.
- Default active views exclude archived records.
- Team archive views expose archived issues, projects, and cycles.
- Archived issue and project links still open.
- Archived records are read-only unless restored.
- Manual archive and unarchive are included in v1.
- Auto-close, auto-archive rules, and hard-delete grace-period flows are deferred.

Reference docs:

- https://linear.app/docs/default-team-pages
- https://linear.app/docs/teams
- https://linear.app/docs/configuring-workflows

Command menu follows Linear's action model:

- Opens with Cmd/Ctrl K.
- Supports navigation to teams, issues, projects, cycles, and issue views.
- Exposes workspace search results for accessible issues and projects.
- Supports creating issues.
- Supports issue property actions for status, assignee, priority, estimate, labels, cycle, and project.
- Supports basic relation actions: relate, mark blocking/blocked, and mark duplicate.
- Supports limited bulk issue actions for selected issues.
- Uses an internal action registry so future features can add contextual commands without reshaping the UI.
- Full Linear command coverage and broad shortcut coverage can come later.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/filters
- https://linear.app/docs/display-options

Workspace search is included in v1:

- Search is scoped to one workspace.
- Search finds accessible issues by key, title, derived description text, comments, labels, project, and assignee.
- Search finds accessible projects by name, summary, and description.
- Search is available through the command menu/search surface.
- Search respects private team access and project visibility rules.
- Search uses Postgres text-search/trigram-ready design.
- External search services are out of scope.
- Document search is out of scope.
- AI search is out of scope.
- Cross-workspace search is out of scope.

Bulk issue actions follow a limited v1 subset of Linear's bulk action model:

- Users can multi-select issues in list and board views.
- Bulk update supports status, assignee, priority, estimate, due date, labels, project, cycle, and archive.
- Bulk move between teams is deferred.
- Bulk relation changes are deferred.
- Bulk delete is deferred.
- Each issue is checked individually for access and field validity.
- Server responses include per-issue success and failure summaries.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/editing-issues
- https://linear.app/docs/filters

Undo is deferred from v1:

- No general Cmd/Ctrl Z undo system.
- No persistent reversible action log.
- Optimistic mutations roll back locally only when the server request fails.
- Drag/drop ordering rolls back locally if the ordering mutation fails.
- Undo for move, bulk updates, and property changes can be added later through explicit action history.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/editing-issues
- https://linear.app/docs/display-options

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/filters
- https://linear.app/docs/labels

Issue creation follows Linear's composer model:

- `C` opens the create issue modal from app pages.
- The composer defaults to the team from the current route or view.
- Required issue fields are title and status.
- Optional composer fields include description, assignee, priority, estimate, due date, labels, project, and cycle.
- Creating from a project, cycle, or filtered view pre-fills matching issue properties where possible.
- Creating from an issue template pre-fills issue content and properties.
- Fullscreen composer mode is deferred.
- URL-prefilled issue creation is deferred.
- Draft persistence can be local-only in v1.

Reference docs:

- https://linear.app/docs/creating-issues
- https://linear.app/docs/conceptual-model
- https://linear.app/docs/default-team-pages

## Confirmed Linear-like Decisions

### Team as the issue boundary

Linear's team pages and workflow documentation treat teams as the primary place where issues, active/backlog views, and issue statuses live. V1 follows that shape:

- Workspaces are collaboration and membership containers.
- Teams are the primary boundary for issues, workflow statuses, issue keys, issue counters, and team-level access.
- Teams can be public or private.
- Every issue belongs to exactly one owning team.
- Workflow statuses are team-specific.
- Projects are workspace-level bodies of work that can span multiple teams, while each issue still belongs to exactly one owning team.
- Private team issues are visible only to members of that private team.

Workflow statuses are customizable within fixed categories. Those categories drive Active, Backlog, terminal timestamps, and Duplicate behavior.

Reference docs:

- https://linear.app/docs/default-team-pages
- https://linear.app/docs/configuring-workflows
- https://linear.app/docs/private-teams
- https://linear.app/docs/google-sheets

### Private teams are v1 access control

Linear's team access model makes public teams broadly visible within a workspace while private teams restrict issue visibility to team members. V1 includes this basic private team behavior so issue, project, and view queries are designed with the right visibility rules from the beginning.

Reference docs:

- https://linear.app/docs/private-teams
- https://linear.app/docs/teams

### Better Auth is the membership primitive, not the whole policy

Better Auth's organization plugin can manage workspaces, workspace members, invitations, teams, and joined team membership. V1 uses those primitives but keeps Linear-like public/private team access, issue permissions, assignment rules, and multi-team project visibility in an explicit domain policy layer.

Postgres RLS is deferred from v1, but shared app-layer policy functions and a focused policy test suite are required.

Reference docs:

- https://better-auth.com/docs/plugins/organization#usage
- https://linear.app/docs/teams
- https://linear.app/docs/private-teams
- https://linear.app/docs/slack

### Team permissions are simplified in v1

Linear has richer team-management semantics, especially around private teams. V1 keeps permissioning simple by combining workspace roles with team creator/manager metadata, while avoiding a separate team-role system until the product needs it.

Reference docs:

- https://linear.app/docs/teams
- https://linear.app/docs/private-teams
- https://better-auth.com/docs/plugins/organization#usage

### Projects match Linear's multi-team model

Linear projects are workspace-level units of work with a clear outcome or planned completion date. They can be shared across multiple teams, while each issue can only be associated with one project at a time. V1 follows that model instead of treating projects as minimal single-team records.

V1 includes Linear-like project surfaces: workspace and team project pages, project overview, project issues tab, project-attached issue views, and a project properties sidebar. Project updates and health reporting are deferred.

Project milestones are included in v1 as project-scoped stages for organizing and filtering project issues.

Project statuses are customizable workspace-level lifecycle states, separate from team-specific issue workflow statuses. Workspace project status settings are included in v1 with simple owner/admin customization.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/projects
- https://linear.app/docs/private-teams
- https://linear.app/docs/initiative-and-project-updates
- https://linear.app/docs/creating-issues

### Labels are v1 domain objects

Linear treats labels as a core issue organization and filtering primitive, with workspace-level labels, team-level labels, and label groups. V1 includes labels in the domain model instead of deferring them, while keeping the management UI simple.

Reference docs:

- https://linear.app/docs/labels
- https://linear.app/docs/filters

### Issue relations and sub-issues are v1 domain objects

Linear exposes issue relationships and hierarchy as issue properties and filters. V1 includes relations and parent/sub-issue structure in the domain model so blockers, duplicates, related issues, and hierarchy can scale without reshaping issues later.

Reference docs:

- https://linear.app/docs/issue-relations
- https://linear.app/docs/filters
- https://linear.app/docs/conceptual-model

### Cycles are v1 domain objects

Linear treats cycles as team-specific planning timeboxes, separate from projects and releases. V1 includes cycles in the domain model with lightweight views so issue filtering and team navigation can grow in a Linear-like direction.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/teams
- https://linear.app/docs/default-team-pages

### Triage is deferred from v1

Linear treats Triage as a team-specific intake queue with its own view, actions, and automation surface. V1 defers Triage so the first release can focus on normal team workflows, issue views, projects, cycles, labels, relations, and ordering.

Reference docs:

- https://linear.app/docs/triage
- https://linear.app/docs/configuring-workflows
- https://linear.app/docs/teams

### Sub-teams are deferred from v1

Linear supports hierarchical sub-teams with inherited settings for statuses, cycles, labels, templates, membership, and privacy constraints. V1 keeps teams flat to reduce access-control and inheritance complexity, while avoiding naming and architecture that assumes teams can never become hierarchical.

Reference docs:

- https://linear.app/docs/sub-teams
- https://linear.app/docs/teams
- https://linear.app/docs/private-teams

### Initiatives are deferred from v1

Linear initiatives organize projects around longer-term company goals. V1 defers initiatives so the first release can focus on workspaces, teams, issues, projects, milestones, cycles, views, and collaboration primitives without becoming a full strategic planning layer.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/custom-views
- https://linear.app/docs/initiative-and-project-updates

### Standalone documents are deferred from v1

Linear supports documents as team and project resources, but documents add another editable object type, permission surface, search target, and navigation area. V1 keeps BlockNote focused on issue descriptions, comments, and project descriptions; attachments and links cover supporting context.

Reference docs:

- https://linear.app/docs/default-team-pages
- https://linear.app/docs/conceptual-model
- https://linear.app/docs/linear-agent

### Recurring issues are deferred from v1

Linear recurring issues automatically create new issue instances on a cadence, often from issue templates. V1 defers recurring issues because they require scheduling, team timezone behavior, recurrence rules, retry handling, and background job infrastructure; issue templates should remain compatible with adding recurring issues later.

Reference docs:

- https://linear.app/docs/creating-issues
- https://linear.app/docs/teams
- https://linear.app/docs/filters

### Team home is lightweight in v1

Linear teams have a home page for team context and navigation. V1 includes a lightweight team home with identity, members, and shortcuts, while deferring documents, pinned resources, and team resource management.

Reference docs:

- https://linear.app/docs/default-team-pages
- https://linear.app/docs/teams
- https://linear.app/docs/conceptual-model

### Team settings are focused in v1

Linear team settings cover a wide set of team-specific features. V1 includes the settings needed for team identity, access, workflow statuses, labels, templates, and cycles, while deferring integrations, Triage, recurring issues, and destructive team lifecycle flows.

Reference docs:

- https://linear.app/docs/teams
- https://linear.app/docs/configuring-workflows
- https://linear.app/docs/labels
- https://linear.app/docs/creating-issues
- https://linear.app/docs/default-team-pages

### Workspace settings are focused in v1

V1 includes the workspace settings required for identity, members, invitations, workspace labels, and project statuses. Billing, integrations, AI settings, notification preferences, and workspace deletion are deferred.

Reference docs:

- https://linear.app/docs/labels
- https://linear.app/docs/projects
- https://better-auth.com/docs/plugins/organization#usage

### Command menu is a v1 interaction surface

Linear's command menu is a core way to navigate and take contextual actions. V1 includes a limited command menu backed by an action registry so the app feels Linear-like while keeping the initial action set controlled.

Workspace search is included through the command menu/search surface for accessible issues and projects.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/filters
- https://linear.app/docs/display-options
- https://linear.app/docs/labels

### Issue creation is modal-first

Linear centers issue creation on a fast composer that can be opened from anywhere and pre-filled from context. V1 includes a global create issue modal with contextual defaults so creating work from team, project, cycle, and filtered views stays fast.

Issue templates are included in v1 as reusable composer presets for issue content and properties. Project templates, document templates, sub-team template inheritance, and recurring issues are deferred.

Reference docs:

- https://linear.app/docs/creating-issues
- https://linear.app/docs/conceptual-model
- https://linear.app/docs/teams
- https://linear.app/docs/sub-teams

### Archive behavior is v1, automation is deferred

Linear keeps inactive work referenceable through archive views instead of treating removal as immediate deletion. V1 includes manual archive and restore behavior for issues, projects, and cycles, while deferring auto-close, auto-archive, and hard-delete grace flows.

Reference docs:

- https://linear.app/docs/default-team-pages
- https://linear.app/docs/teams
- https://linear.app/docs/configuring-workflows

### Comments and activity are v1 timeline primitives

Linear issue detail combines user discussion with a history of meaningful issue changes. V1 includes rich comments and basic issue activity events in one timeline, while deferring synced external comments and notification delivery until external integrations and notification preferences exist.

Reference docs:

- https://linear.app/docs/conceptual-model
- https://linear.app/docs/creating-issues
- https://linear.app/docs/notifications

### Issue subscriptions are v1 data, delivery is deferred

Linear uses subscriptions to decide which issue updates matter to a member. V1 stores issue subscriptions and basic subscribe/unsubscribe behavior so Inbox and notification delivery can be added later without backfilling interest state.

Reference docs:

- https://linear.app/docs/notifications
- https://linear.app/docs/custom-views
- https://linear.app/docs/conceptual-model

### Member mentions are v1 editor content

Linear allows members to reference each other in collaborative content, while private team issues restrict who can be mentioned. V1 includes structured member mentions in issue descriptions and comments, without notification or auto-subscription side effects.

Reference docs:

- https://linear.app/docs/notifications
- https://linear.app/docs/private-teams
- https://linear.app/docs/conceptual-model

### Attachments are v1 issue context

Linear uses both links and files to keep supporting context attached to issues. V1 includes issue link attachments, rich link previews, and file uploads, while deferring synced integration linkbacks.

Reference docs:

- https://linear.app/docs/creating-issues
- https://linear.app/docs/slack
- https://linear.app/docs/gitlab

### Issue views are v1 domain objects

Linear uses custom views as durable filtered surfaces for issues, with filters and display options persisted beyond a single browsing session. V1 includes saved issue views so filtering, team navigation, and project-attached views do not need a later data-model rewrite.

Manual issue ordering and drag-and-drop are included in v1 because Linear treats manual ordering as shared workspace state rather than a purely personal display preference.

Issue estimates are included in v1 so display totals and cycle summaries can represent workload, even before full capacity planning exists.

Basic My Issues is included as a personal issue surface for assigned, created, and subscribed issues. Inbox and Focus grouping are deferred.

Filters are stored as a typed JSON AST so saved views can grow toward Linear's advanced filters without changing the persistence format.

Realtime transport is deferred, but optimistic mutations and targeted invalidation are required for Linear-like speed.

Reference docs:

- https://linear.app/docs/custom-views
- https://linear.app/docs/filters
- https://linear.app/docs/display-options
- https://linear.app/docs/creating-issues
- https://linear.app/docs/conceptual-model
- https://linear.app/docs/notifications

## Local Development

Add:

- Docker Compose Postgres
- Docker Compose MinIO
- `.env.example`
- Drizzle config
- Migration scripts
- Seed script

Pre-V1 migration rule:

- Until V1 is complete, do not create, commit, or apply Postgres migration files for feature work. This reduces migration-file conflicts while the schema is still moving quickly.
- Keep migration scripts in the project, but treat them as inactive placeholders during V1 implementation.
- Use the current Drizzle schema plus local setup/seed workflow for development resets during V1. Generate the consolidated migration set only after the V1 schema stabilizes.

### Pre-V1 schema reset workflow

- When pulling schema changes under the Pre-V1 migration rule, reset local data and apply the current schema with:

```bash
docker compose down -v
docker compose up -d postgres minio
bunx drizzle-kit push
bun run db:seed
```

- To detect schema drift, run `bunx drizzle-kit check` before committing schema changes and compare the Drizzle schema files against the local database state after `bunx drizzle-kit push`. If the check or push surfaces differences, update the Drizzle schema files first, rerun the reset workflow, and include the diff in the PR.
- Re-enable migration generation only when the repo flag `V1-SCHEMA-STABLE=false` is toggled to `V1-SCHEMA-STABLE=true` in this Pre-V1 migration rule section. Until then, do not commit generated migration files.

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
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=
PUBLIC_ATTACHMENT_MAX_MB=25
```

Seed script should create a rich demo workspace:

- Workspace: `Coret Demo`.
- Public teams: `CORE`, `DES`.
- Private team: `SEC`.
- Custom workflow statuses per team.
- Workspace labels, team labels, and label groups.
- Multi-team project spanning `CORE` and `DES`.
- Private-team-only project for `SEC`.
- Project milestones.
- Current and upcoming cycles for public teams.
- Issues across statuses with assignees, labels, estimates, and due dates.
- A moved issue with old issue key history.
- Related, blocking, duplicate, and sub-issue examples.
- Saved views and My Issues-relevant subscriptions.
- Link attachment preview seed data.
- No real file blobs are required for the seed.

## Testing

Run the existing checks:

```bash
bun run lint
bun run fmt:check
bun run test
bun --bun run build
```

Add Vitest integration tests with a test Postgres database for:

- Schema setup without applying Postgres migration files before V1 completion
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

### Attachment policy integration tests

- Add `attachments.test.ts` once `uploadAttachment`, `downloadAttachment`, and `linkPreviewFetch` or `ssrfGuard` exist.
- Reuse `setupTestDb`, `seedWorkspace` or `seedData`, `createUserSession`, and `createProject` helpers so tests exercise real auth/session and workspace policy paths.
- Validate `uploadAttachment` allows an authorized issue member to upload a permitted file within the 25 MB limit.
- Validate `uploadAttachment` rejects files over 25 MB, blocked executable/high-risk file types, and uploads by users without private-team access.
- Validate `downloadAttachment` allows an authorized issue member and returns 403 or an equivalent denial for cross-tenant users, workspace non-members, and private-team non-members.
- Validate `linkPreviewFetch` or `ssrfGuard` blocks localhost and private IP targets, follows at most 5 redirects, and fails on redirect loops or redirects to private IP targets.

Add focused UI smoke tests for:

- Login route
- Onboarding redirect
- Protected route redirect
- Issue list render
- Issue detail render
- BlockNote client-only loading

## Acceptance Criteria

V1 is complete when:

- A new user can sign in with Google or GitHub using a provider-verified email, create a workspace and team, and land in the issues screen.
- Email/password auth and password reset are not available in v1.
- An owner/admin can invite members by email.
- Users can create public and private teams during normal workspace use.
- Team settings and workspace settings cover the v1 settings scope.
- Teams have customizable issue workflows with fixed behavior categories.
- Workspaces have customizable project statuses.
- A member can create, edit, filter, assign, comment on, and archive issues.
- Issues support labels, label groups, relations, sub-issues, due dates, estimates, attachments, threaded comments, activity, and subscriptions.
- Issues can move between teams with new issue keys and old-key redirects.
- Issues use stable team keys like `CORE-123`.
- Saved issue views use the filter AST and display options.
- Issue lists support drag/drop manual ordering.
- Cycles and My Issues are usable.
- Projects can be created, associated with multiple teams, linked to issues, and organized with milestones.
- Private team visibility works in team, issue, project, search, attachment, and issue key resolver flows.
- Command menu and workspace search can find and act on accessible work.
- File uploads use object storage and enforce app-layer download/upload policy checks.
- Users cannot access or mutate data outside their authorized workspace/team/project visibility.
- Policy tests cover cross-workspace denial, private team denial, project partial visibility, attachment denial, search denial, and issue key alias denial.
- The app builds successfully with TanStack Start.
- DB and object storage setup are reproducible locally with Docker Compose, Drizzle schema setup, MinIO, and the seed script. Postgres migration generation/application remains deferred until V1 completion.
