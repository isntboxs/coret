import { and, eq } from 'drizzle-orm'

import {
	memberTable,
	organizationTable,
	teamMemberTable,
	teamTable,
} from '#/server/db/schemas'
import { protectedProcedure } from '#/server/orpc/middlewares'

export const appContextRouter = protectedProcedure.appContext.handler(
	async ({ context, errors }) => {
		const { session, user } = context.auth
		const activeOrganizationId = session.activeOrganizationId ?? null
		const activeTeamId = session.activeTeamId ?? null

		const appSession = {
			id: session.id,
			userId: session.userId,
			activeOrganizationId,
			activeTeamId,
			expiresAt: session.expiresAt,
		}

		const appUser = {
			id: user.id,
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			image: user.image ?? null,
		}

		if (!activeOrganizationId) {
			if (activeTeamId) {
				throw errors.CONFLICT({
					message: 'Active team cannot be set without an active organization',
				})
			}

			return {
				user: appUser,
				session: appSession,
				activeOrganization: null,
				activeTeam: null,
				membership: null,
				membershipRole: null,
			}
		}

		const [activeOrganization] = await context.db
			.select({
				id: organizationTable.id,
				name: organizationTable.name,
				slug: organizationTable.slug,
				logo: organizationTable.logo,
			})
			.from(organizationTable)
			.where(eq(organizationTable.id, activeOrganizationId))

		if (!activeOrganization) {
			throw errors.NOT_FOUND({
				message: 'Active organization was not found',
			})
		}

		const [membership] = await context.db
			.select({
				id: memberTable.id,
				organizationId: memberTable.organizationId,
				role: memberTable.role,
			})
			.from(memberTable)
			.where(
				and(
					eq(memberTable.organizationId, activeOrganizationId),
					eq(memberTable.userId, session.userId)
				)
			)

		if (!membership) {
			throw errors.FORBIDDEN({
				message: 'You are not a member of the active organization',
			})
		}

		if (!activeTeamId) {
			return {
				user: appUser,
				session: appSession,
				activeOrganization,
				activeTeam: null,
				membership,
				membershipRole: membership.role,
			}
		}

		const [activeTeam] = await context.db
			.select({
				id: teamTable.id,
				name: teamTable.name,
				key: teamTable.key,
				organizationId: teamTable.organizationId,
			})
			.from(teamTable)
			.where(eq(teamTable.id, activeTeamId))

		if (!activeTeam) {
			throw errors.FORBIDDEN({
				message: 'Active team was not found',
			})
		}

		if (activeTeam.organizationId !== activeOrganizationId) {
			throw errors.CONFLICT({
				message: 'Active team does not belong to the active organization',
			})
		}

		const [teamMembership] = await context.db
			.select({ id: teamMemberTable.id })
			.from(teamMemberTable)
			.where(
				and(
					eq(teamMemberTable.teamId, activeTeamId),
					eq(teamMemberTable.userId, session.userId)
				)
			)

		if (!teamMembership) {
			throw errors.FORBIDDEN({
				message: 'You are not a member of the active team',
			})
		}

		return {
			user: appUser,
			session: appSession,
			activeOrganization,
			activeTeam,
			membership,
			membershipRole: membership.role,
		}
	}
)
