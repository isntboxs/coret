import { and, eq } from 'drizzle-orm'

import type { db } from '#/db'
import {
	memberTable,
	organizationTable,
	teamMemberTable,
	teamTable,
} from '#/db/schemas/auth'

type Database = typeof db

export async function findWorkspaceMembershipBySlug(
	database: Database,
	userId: string,
	workspaceSlug: string
) {
	const workspace = await database.query.organizationTable.findFirst({
		where: eq(organizationTable.slug, workspaceSlug),
	})

	if (!workspace) return null

	const membership = await database.query.memberTable.findFirst({
		where: and(
			eq(memberTable.organizationId, workspace.id),
			eq(memberTable.userId, userId)
		),
	})

	if (!membership) return null

	return { workspace, membership }
}

export async function findAccessibleTeamByKey(
	database: Database,
	userId: string,
	workspaceSlug: string,
	teamKey: string
) {
	const workspaceMembership = await findWorkspaceMembershipBySlug(
		database,
		userId,
		workspaceSlug
	)

	if (!workspaceMembership) return null

	const team = await database.query.teamTable.findFirst({
		where: and(
			eq(teamTable.organizationId, workspaceMembership.workspace.id),
			eq(teamTable.key, teamKey.toUpperCase())
		),
	})

	if (!team) return null

	if (team.visibility === 'private') {
		const teamMembership = await database.query.teamMemberTable.findFirst({
			where: and(
				eq(teamMemberTable.teamId, team.id),
				eq(teamMemberTable.userId, userId)
			),
			columns: { id: true },
		})

		if (!teamMembership) return null
	}

	return {
		...workspaceMembership,
		team,
	}
}
