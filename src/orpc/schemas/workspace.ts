import limax from 'limax'
import { z } from 'zod'

const metadataSchema = z.record(z.string(), z.unknown())

const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/

const workspaceFields = {
	id: z.uuid(),
	name: z.string(),
	slug: z.string(),
	logo: z.string().nullable().optional(),
	createdAt: z.date(),
	metadata: z.any().optional(),
}

const workspaceMemberFields = {
	id: z.uuid(),
	workspaceId: z.uuid(),
	userId: z.uuid(),
	role: z.string(),
	createdAt: z.date(),
}

const workspaceBaseSchema = z.object(workspaceFields)

export const createWorkspaceInputSchema = z.object({
	name: z.string().min(1),
	slug: z
		.string()
		.min(1)
		.max(100)
		.regex(slugRegex, {
			error:
				'Slug must be lowercase alphanumeric with hyphens between segments, no leading/trailing/consecutive hyphens',
		})
		.transform((val) => limax(val)),
	logo: z.string().nullable().optional(),
	metadata: metadataSchema.optional(),
	keepCurrentActiveWorkspace: z.boolean().optional(),
})

export const createWorkspaceOutputSchema = z.object({
	...workspaceFields,
	members: z.array(z.object(workspaceMemberFields).optional()),
})

export type CreateWorkspaceOutput = z.infer<typeof createWorkspaceOutputSchema>

export const listWorkspacesOutputSchema = z.array(workspaceBaseSchema)

export const getWorkspaceOutputSchema = z
	.object({
		...workspaceFields,
		members: z.array(
			z.object(workspaceMemberFields).extend({
				teamId: z.uuid().optional(),
				user: z.object({
					id: z.uuid(),
					email: z.email(),
					name: z.string(),
					image: z.string().optional(),
				}),
			})
		),
		invitations: z.array(
			z.object({
				id: z.string(),
				workspaceId: z.string(),
				email: z.email(),
				role: z.string(),
				status: z.string(),
				inviterId: z.string(),
				teamId: z.string().optional(),
				expiresAt: z.date(),
				createdAt: z.date(),
			})
		),
		teams: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				workspaceId: z.string(),
				createdAt: z.date(),
				updatedAt: z.date().optional(),
				key: z.string(),
				visibility: z.string().optional(),
				creatorId: z.string().optional(),
				timezone: z.string().optional(),
				metadata: z.string().optional(),
				archivedAt: z.date().optional(),
			})
		),
	})
	.nullable()

export type GetWorkspaceOutput = z.infer<typeof getWorkspaceOutputSchema>
