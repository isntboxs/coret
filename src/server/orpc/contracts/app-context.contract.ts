import { z } from 'zod'

import { orpcBaseContract as baseContract } from '#/server/orpc/contracts/base.contract'

const userSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	emailVerified: z.boolean(),
	image: z.string().nullable(),
})

const sessionSchema = z.object({
	id: z.string(),
	userId: z.string(),
	activeOrganizationId: z.string().nullable(),
	activeTeamId: z.string().nullable(),
	expiresAt: z.date(),
})

const organizationSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	logo: z.string().nullable(),
})

const teamSchema = z.object({
	id: z.string(),
	name: z.string(),
	key: z.string(),
	organizationId: z.string(),
})

const membershipSchema = z.object({
	id: z.string(),
	organizationId: z.string(),
	role: z.string(),
})

export const appContextContract = baseContract
	.route({
		path: '/app-context',
		method: 'GET',
		summary: 'Load app context',
		description:
			'Load the authenticated session, active organization, active team, and membership role.',
		tags: ['App Context'],
		operationId: 'getAppContext',
		successStatus: 200,
		successDescription: 'Authenticated app context',
	})
	.output(
		z.object({
			user: userSchema,
			session: sessionSchema,
			activeOrganization: organizationSchema.nullable(),
			activeTeam: teamSchema.nullable(),
			membership: membershipSchema.nullable(),
			membershipRole: z.string().nullable(),
		})
	)
