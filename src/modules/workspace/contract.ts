import {
	createWorkspaceWithDefaultTeamInputSchema,
	createWorkspaceWithDefaultTeamOutputSchema,
	createWorkspaceInputSchema,
	createWorkspaceOutputSchema,
	listWorkspacesOutputSchema,
	workspaceHomeStateOutputSchema,
} from '#/modules/workspace/schemas'
import { orpcBaseContract as baseContract } from '#/server/orpc/base.contract'

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

	createWithDefaultTeam: baseContract
		.route({
			path: '/workspace/create-with-default-team',
			method: 'POST',
			summary: 'Create workspace with default team',
			description:
				'Create a Workspace and its Default Team for the authenticated user.',
			tags: ['Workspace'],
			operationId: 'createWorkspaceWithDefaultTeam',
			successStatus: 200,
			successDescription: 'Workspace and Default Team created',
		})
		.input(createWorkspaceWithDefaultTeamInputSchema)
		.output(createWorkspaceWithDefaultTeamOutputSchema),

	homeState: baseContract
		.route({
			path: '/workspace/home-state',
			method: 'GET',
			summary: 'Get workspace home state',
			description:
				'Resolve whether the authenticated user needs Workspace Creation or should be redirected to the active Team.',
			tags: ['Workspace'],
			operationId: 'getWorkspaceHomeState',
			successStatus: 200,
			successDescription: 'Workspace home state resolved',
		})
		.output(workspaceHomeStateOutputSchema),

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
