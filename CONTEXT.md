# Coret

Coret is a Linear-like workspace for organizing product work around teams, issues, workflows, and projects.

## Language

**Workspace**:
The top-level collaboration container where members belong and shared organization settings live.
_Avoid_: Organization, account

**Workspace Member**:
A person who belongs to a workspace and can participate according to their workspace role and team memberships.
_Avoid_: User, collaborator

**Workspace Settings**:
Workspace-level configuration for identity, members, invitations, labels, and project statuses.
_Avoid_: Admin panel, organization settings

**Team**:
The primary work boundary for issues, issue identifiers, workflows, and team-level access.
_Avoid_: Group, squad

**Team Member**:
A workspace member who has joined a team; for private teams, team membership grants access to that team's private work.
_Avoid_: Team user, assigned member

**Team Manager**:
A workspace member allowed to manage a team's settings and membership.
_Avoid_: Team admin, team owner

**Team Settings**:
Team-specific configuration for identity, access, workflow, labels, templates, and cycles.
_Avoid_: Team preferences, team configuration

**Private Team**:
A team whose issues and private team context are visible only to members of that team.
_Avoid_: Hidden team, restricted group

**Issue**:
A unit of work owned by exactly one team and identified within that team's issue sequence.
_Avoid_: Task, ticket

**Issue Key History**:
A record of previous issue identifiers that still resolve to the current issue after team moves.
_Avoid_: Alias, redirect

**Issue Template**:
A reusable issue draft that pre-fills issue content and properties during creation.
_Avoid_: Form, preset

**Recurring Issue**:
A scheduled generator that creates new issues from a repeated cadence and preset issue content.
_Avoid_: Repeating task, scheduled task

**Workflow Status**:
A team-specific state that places an issue within that team's workflow.
_Avoid_: State, column

**Project**:
A workspace-level planned body of work with a clear outcome that groups related issues and can span multiple teams.
_Avoid_: Roadmap, initiative

**Project Status**:
A workspace-level state used to describe a project's lifecycle.
_Avoid_: Workflow status, project state

**Project Milestone**:
A stage or checkpoint within a single project used to organize that project's issues.
_Avoid_: Phase, release

**Project Team Association**:
A relationship that makes a project available within a team while keeping the project itself at the workspace level.
_Avoid_: Project ownership, team project

**Issue Label**:
A workspace-scoped or team-scoped marker used to categorize issues.
_Avoid_: Tag, category

**Label Group**:
A named grouping of issue labels where an issue can use at most one label from the group.
_Avoid_: Label folder, label category

**Issue Relation**:
A typed relationship between two issues, such as related, blocking, or duplicate.
_Avoid_: Link, dependency

**Duplicate Issue**:
An issue that has been marked as a duplicate of a canonical issue.
_Avoid_: Copy, repeated issue

**Sub-Issue**:
An issue that is nested under a parent issue while still keeping its own owning team.
_Avoid_: Checklist item, child task

**Cycle**:
A team-specific timebox used to prioritize issues for a recurring work period.
_Avoid_: Sprint, release

**Issue View**:
A saved dynamic issue list defined by filters and display preferences.
_Avoid_: Saved filter, report

**My Issues**:
A personal issue surface for work assigned to, created by, or subscribed to by a workspace member.
_Avoid_: Inbox, personal board

**Estimate**:
An optional issue effort value used to summarize workload in issue views and cycles.
_Avoid_: Story points, hours

**Due Date**:
An optional calendar date by which an issue is expected to be completed.
_Avoid_: Deadline, target date

**Command Menu**:
A global action surface for navigating and changing workspace objects through contextual commands.
_Avoid_: Search modal, launcher

**Workspace Search**:
A workspace-scoped search surface for finding accessible issues and projects.
_Avoid_: Global search, command search

**Triage**:
A team-specific intake queue for reviewing issues before they enter the team's normal workflow.
_Avoid_: Inbox, backlog

**Archive**:
A historical area for work items that are no longer active but remain restorable and referenceable.
_Avoid_: Trash, deletion

**Comment**:
A user-authored discussion entry on an issue or project surface.
_Avoid_: Message, reply

**Activity**:
A system-authored timeline event that records a meaningful change to a work item.
_Avoid_: Audit log, history

**Issue Subscription**:
A member's expressed interest in an issue for future notification and inbox behavior.
_Avoid_: Watch, follow

**Mention**:
A structured reference to a workspace member inside editable content.
_Avoid_: Tagging, ping

**Attachment**:
A file or link attached to an issue to provide supporting context.
_Avoid_: Upload, resource

**Link Preview**:
Metadata shown for a link attachment so members can understand the linked resource before opening it.
_Avoid_: Unfurl, embed
