# Better Auth with domain policies

V1 uses Better Auth's organization plugin for authentication, workspaces, workspace members, invitations, teams, and joined team membership, but keeps Linear-like access control in explicit domain policy functions. Public team access is derived from workspace membership, private team access requires joined team membership, and Postgres RLS is deferred in favor of shared app-layer policies plus focused policy tests for private teams, multi-team projects, search, attachments, and issue key resolution.
