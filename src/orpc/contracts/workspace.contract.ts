import { orpcBaseContract as baseContract } from '#/orpc/contracts/base.contract'
import {
	createWorkspaceInputSchema,
	createWorkspaceOutputSchema,
	listWorkspacesOutputSchema,
} from '#/orpc/schemas/workspace'

export const workspaceContract = {
	create: baseContract
		.route({
			path: '/workspace/create',
			method: 'POST',
			summary: 'Create workspace',
			description: 'Create a workspace for the authenticated user.',
			tags: ['Workspace'],
			operationId: 'createWorkspace',
			successStatus: 200,
			successDescription: 'Workspace created',
		})
		.input(createWorkspaceInputSchema)
		.output(createWorkspaceOutputSchema),

	list: baseContract
		.route({
			path: '/workspace/list',
			method: 'GET',
			summary: 'List workspaces',
			description: 'List workspaces for the authenticated user.',
			tags: ['Workspace'],
			operationId: 'listWorkspaces',
			successStatus: 200,
			successDescription: 'Workspaces listed',
		})
		.output(listWorkspacesOutputSchema),
}
