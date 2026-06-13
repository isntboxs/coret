import { auth } from '#/lib/auth'
import { getOrpcLogger } from '#/orpc/logger'
import { protectedProcedure } from '#/orpc/procedures'
import type { CreateWorkspaceOutput } from '#/orpc/schemas/workspace'
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
}
