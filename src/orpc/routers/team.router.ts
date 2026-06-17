import { findAccessibleTeamByKey } from '#/features/workspace/server/access'
import { protectedProcedure } from '#/orpc/procedures'

export const teamRouter = {
	getByKey: protectedProcedure.team.getByKey.handler(
		async ({ context, input, errors }) => {
			const result = await findAccessibleTeamByKey(
				context.db,
				context.auth.user.id,
				input.workspaceSlug,
				input.teamKey
			)

			if (!result) {
				throw errors.NOT_FOUND
			}

			return {
				workspace: {
					id: result.workspace.id,
					name: result.workspace.name,
					slug: result.workspace.slug,
				},
				team: result.team,
			}
		}
	),
}
