import { auth } from '#/lib/auth'
import { getOrpcLogger } from '#/orpc/logger'
import { protectedProcedure } from '#/orpc/procedures'
import type {
	CreateWorkspaceOutput,
	GetWorkspaceOutput,
} from '#/orpc/schemas/workspace'
import { withBetterAuthErrorHandling } from '#/orpc/utils'

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

function mapBetterAuthGetOrganizationToWorkspace(
	organization: Awaited<ReturnType<typeof auth.api.getFullOrganization>>
): GetWorkspaceOutput {
	if (!organization) return null

	return {
		id: organization.id,
		name: organization.name,
		slug: organization.slug,
		logo: organization.logo,
		// oxlint-disable-next-line typescript/no-unsafe-assignment
		metadata: organization.metadata,
		members: organization.members.map((member) => {
			return {
				...member,
				workspaceId: member.organizationId,
			}
		}),
		invitations: organization.invitations.map((invitation) => {
			return {
				...invitation,
				workspaceId: invitation.organizationId,
			}
		}),
		teams: organization.teams.map((team) => {
			return {
				...team,
				workspaceId: team.organizationId,
			}
		}),
		createdAt: organization.createdAt,
	}
}

export const workspaceRouter = {
	create: protectedProcedure.workspace.create.handler(
		async ({ context, input }) => {
			const logger = getOrpcLogger(context)
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

			org.headers.forEach((value, key) => {
				if (key.toLowerCase() === 'set-cookie') {
					logger?.debug('setting cookie header')
					context.resHeaders?.append('Set-Cookie', value)
					return
				}

				logger?.debug({ key, value }, 'setting header')
				context.resHeaders?.set(key, value)
			})

			logger?.debug('workspace created through Better Auth organization')
			return mapBetterAuthOrganizationToWorkspace(org.response)
		}
	),

	list: protectedProcedure.workspace.list.handler(async ({ context }) => {
		const logger = getOrpcLogger(context)

		const workspaces = await withBetterAuthErrorHandling(() =>
			auth.api.listOrganizations({
				headers: context.headers,
				returnHeaders: true,
			})
		)

		workspaces.headers.forEach((value, key) => {
			if (key.toLowerCase() === 'set-cookie') {
				logger?.debug('setting cookie header')
				context.resHeaders?.append('Set-Cookie', value)
				return
			}

			logger?.debug({ key, value }, 'setting header')
			context.resHeaders?.set(key, value)
		})

		logger?.debug('workspace list requested through Better Auth organization')
		return workspaces.response
	}),

	get: protectedProcedure.workspace.get.handler(async ({ context }) => {
		const logger = getOrpcLogger(context)

		const workspace = await withBetterAuthErrorHandling(() =>
			auth.api.getFullOrganization({
				headers: context.headers,
				returnHeaders: true,
			})
		)

		workspace.headers.forEach((value, key) => {
			if (key.toLowerCase() === 'set-cookie') {
				logger?.debug('setting cookie header')
				context.resHeaders?.append('Set-Cookie', value)
				return
			}

			logger?.debug({ key, value }, 'setting header')
			context.resHeaders?.set(key, value)
		})

		logger?.debug('workspace get requested through Better Auth organization')
		return mapBetterAuthGetOrganizationToWorkspace(workspace.response)
	}),
}
