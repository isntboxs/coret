import { z } from 'zod'

export const teamByKeyInputSchema = z.object({
	workspaceSlug: z.string().min(1),
	teamKey: z
		.string()
		.min(1)
		.transform((value) => value.toUpperCase()),
})

export const teamOutputSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	key: z.string(),
	visibility: z.enum(['public', 'private']),
	timezone: z.string(),
	organizationId: z.uuid(),
	createdAt: z.date(),
	updatedAt: z.date().nullable().optional(),
})

export const teamByKeyOutputSchema = z.object({
	workspace: z.object({
		id: z.uuid(),
		name: z.string(),
		slug: z.string(),
	}),
	team: teamOutputSchema,
})
