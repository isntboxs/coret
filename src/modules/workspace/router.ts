import { and, eq } from 'drizzle-orm'

import {
	memberTable,
	organizationTable,
	sessionTable,
	teamTable,
} from '#/db/schemas/auth'
import { auth } from '#/modules/auth/auth.server'
import type { CreateWorkspaceOutput } from '#/modules/workspace/schemas'
import { ensureWorkspaceCreationDefaults } from '#/modules/workspace/server/organization-hooks.server'
import type { ORPCContext } from '#/server/orpc/context.server'
import { getOrpcLogger } from '#/server/orpc/logger.server'
import { protectedProcedure } from '#/server/orpc/procedures'
import { withBetterAuthErrorHandling } from '#/server/orpc/utils'

function mapBetterAuthOrganizationToWorkspace(
	organization: Awaited<ReturnType<typeof auth.api.createOrganization>>
): CreateWorkspaceOutput {
	return {
		...organization,
		members: organization.members.map((member) => {
			if (!member) {
				return member
			}

			return {
				...member,
				workspaceId: member.organizationId,
			}
		}),
	}
}

function applyResponseHeaders(headers: Headers, context: ORPCContext) {
	const logger = getOrpcLogger(context)

	headers.forEach((value, key) => {
		if (key.toLowerCase() === 'set-cookie') {
			logger?.debug('setting cookie header')
			context.resHeaders?.append('Set-Cookie', value)
			return
		}

		logger?.debug({ key, value }, 'setting header')
		context.resHeaders?.set(key, value)
	})
}

function activeTeamPath(workspaceSlug: string, teamKey: string) {
	return `/${workspaceSlug}/team/${teamKey}/active`
}

export const workspaceRouter = {
	create: protectedProcedure.workspace.create.handler(
		async ({ context, input }) => {
			const { keepCurrentActiveWorkspace, ...workspaceInput } = input

			const org = await withBetterAuthErrorHandling(() =>
				auth.api.createOrganization({
					headers: context.headers,
					body: {
						...workspaceInput,
						keepCurrentActiveOrganization: keepCurrentActiveWorkspace,
						userId: context.auth.user.id,
					},
					returnHeaders: true,
				})
			)

			applyResponseHeaders(org.headers, context)

			return mapBetterAuthOrganizationToWorkspace(org.response)
		}
	),

	createWithDefaultTeam:
		protectedProcedure.workspace.createWithDefaultTeam.handler(
			async ({ context, input, errors }) => {
				const org = await withBetterAuthErrorHandling(() =>
					auth.api.createOrganization({
						headers: context.headers,
						body: {
							name: input.name,
							slug: input.slug,
							keepCurrentActiveOrganization: false,
						},
						returnHeaders: true,
					})
				)

				applyResponseHeaders(org.headers, context)

				const workspace = await context.db.query.organizationTable.findFirst({
					where: eq(organizationTable.id, org.response.id),
				})

				if (!workspace) {
					throw errors.INTERNAL_SERVER_ERROR
				}

				const defaultTeam = await context.db.query.teamTable.findFirst({
					where: eq(teamTable.organizationId, workspace.id),
					orderBy: (table, { asc }) => [asc(table.createdAt)],
				})

				if (!defaultTeam) {
					throw errors.INTERNAL_SERVER_ERROR
				}

				const workflowStatuses = await ensureWorkspaceCreationDefaults(
					context.db,
					{
						workspaceId: workspace.id,
						defaultTeamId: defaultTeam.id,
						userId: context.auth.user.id,
					}
				)

				return {
					workspace,
					defaultTeam,
					workflowStatuses,
					welcomeRequired: true,
					redirectTo: `/${workspace.slug}/welcome`,
				}
			}
		),

	homeState: protectedProcedure.workspace.homeState.handler(
		async ({ context }) => {
			const activeWorkspaceId = context.auth.session.activeOrganizationId
			const activeTeamId = context.auth.session.activeTeamId

			if (activeWorkspaceId && activeTeamId) {
				const activeWorkspace =
					await context.db.query.organizationTable.findFirst({
						where: eq(organizationTable.id, activeWorkspaceId),
					})
				const activeTeam = await context.db.query.teamTable.findFirst({
					where: and(
						eq(teamTable.id, activeTeamId),
						eq(teamTable.organizationId, activeWorkspaceId)
					),
				})
				const activeMember = await context.db.query.memberTable.findFirst({
					where: and(
						eq(memberTable.organizationId, activeWorkspaceId),
						eq(memberTable.userId, context.auth.user.id)
					),
				})

				if (activeWorkspace && activeTeam && activeMember) {
					return {
						state: 'redirect',
						workspace: activeWorkspace,
						team: activeTeam,
						redirectTo: activeTeamPath(activeWorkspace.slug, activeTeam.key),
					}
				}
			}

			const membership = await context.db.query.memberTable.findFirst({
				where: eq(memberTable.userId, context.auth.user.id),
				orderBy: (table, { asc }) => [asc(table.createdAt)],
				with: {
					organization: true,
				},
			})

			if (!membership) {
				return { state: 'needs_workspace' }
			}

			const team = await context.db.query.teamTable.findFirst({
				where: eq(teamTable.organizationId, membership.organizationId),
				orderBy: (table, { asc }) => [asc(table.createdAt)],
			})

			if (!team) {
				return { state: 'needs_workspace' }
			}

			await context.db
				.update(sessionTable)
				.set({
					activeOrganizationId: membership.organizationId,
					activeTeamId: team.id,
					updatedAt: new Date(),
				})
				.where(eq(sessionTable.id, context.auth.session.id))

			return {
				state: 'redirect',
				workspace: membership.organization,
				team,
				redirectTo: activeTeamPath(membership.organization.slug, team.key),
			}
		}
	),

	list: protectedProcedure.workspace.list.handler(async ({ context }) => {
		const workspaces = await withBetterAuthErrorHandling(() =>
			auth.api.listOrganizations({
				headers: context.headers,
				returnHeaders: true,
			})
		)

		applyResponseHeaders(workspaces.headers, context)

		return workspaces.response
	}),
}
