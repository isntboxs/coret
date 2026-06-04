import { createRouterClient } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { testAuth } from '#/server/auth/test'
import { db } from '#/server/db'
import {
	memberTable,
	organizationTable,
	sessionTable,
	teamMemberTable,
} from '#/server/db/schemas'
import { createORPCContext } from '#/server/orpc/context'
import { orpcRouters } from '#/server/orpc/routers'
import {
	closeTestDatabase,
	prepareTestDatabase,
	resetTestDatabase,
} from '#/test/db'

beforeAll(async () => {
	await prepareTestDatabase()
})

beforeEach(async () => {
	await resetTestDatabase()
})

afterAll(async () => {
	await closeTestDatabase()
})

describe('oRPC app context', () => {
	it('rejects unauthenticated callers', async () => {
		const client = createTestORPCClient()

		await expect(client.appContext()).rejects.toMatchObject({
			code: 'UNAUTHORIZED',
			status: 401,
		})
	})

	it('returns the authenticated user and empty active workspace state', async () => {
		const user = await createUser({
			email: 'app-context-user@coret.local',
			name: 'App Context User',
		})
		const client = createTestORPCClient(
			await getAuthHeaders({ userId: user.id })
		)

		const appContext = await client.appContext()

		expect(appContext).toMatchObject({
			user: {
				id: user.id,
				name: 'App Context User',
				email: 'app-context-user@coret.local',
				emailVerified: true,
				image: null,
			},
			session: {
				userId: user.id,
				activeOrganizationId: null,
				activeTeamId: null,
			},
			activeOrganization: null,
			activeTeam: null,
			membership: null,
			membershipRole: null,
		})
		expect(appContext.session.id).toEqual(expect.any(String))
		expect(appContext.session.expiresAt).toBeInstanceOf(Date)
	})

	it('returns the active organization, active team, and membership role', async () => {
		const user = await createUser({
			email: 'owner@coret.local',
			name: 'Owner User',
		})
		const headers = await getAuthHeaders({ userId: user.id })

		const { organization, team } = await createActiveOrganizationAndTeam({
			headers,
			userId: user.id,
		})
		const client = createTestORPCClient(headers)

		const appContext = await client.appContext()

		expect(appContext.activeOrganization).toEqual({
			id: organization.id,
			name: 'Acme Workspace',
			slug: 'acme-workspace',
			logo: null,
		})
		expect(appContext.activeTeam).toEqual({
			id: team.id,
			name: 'Platform',
			key: 'PLAT',
			organizationId: organization.id,
		})
		expect(appContext.membership).toMatchObject({
			organizationId: organization.id,
			role: 'owner',
		})
		expect(appContext.membershipRole).toBe('owner')
	})

	it('returns not found when the active organization no longer exists', async () => {
		const user = await createUser({
			email: 'missing-org@coret.local',
			name: 'Missing Org User',
		})
		const headers = await getAuthHeaders({ userId: user.id })
		const { organization } = await createActiveOrganizationAndTeam({
			headers,
			userId: user.id,
		})

		await db
			.delete(organizationTable)
			.where(eq(organizationTable.id, organization.id))

		await expect(
			createTestORPCClient(headers).appContext()
		).rejects.toMatchObject({
			code: 'NOT_FOUND',
			status: 404,
		})
	})

	it('returns forbidden when active organization membership is missing', async () => {
		const user = await createUser({
			email: 'missing-membership@coret.local',
			name: 'Missing Membership User',
		})
		const headers = await getAuthHeaders({ userId: user.id })
		const { organization } = await createActiveOrganizationAndTeam({
			headers,
			userId: user.id,
		})

		await db
			.delete(memberTable)
			.where(
				and(
					eq(memberTable.organizationId, organization.id),
					eq(memberTable.userId, user.id)
				)
			)

		await expect(
			createTestORPCClient(headers).appContext()
		).rejects.toMatchObject({
			code: 'FORBIDDEN',
			status: 403,
		})
	})

	it('returns conflict when an active team is set without an active organization', async () => {
		const user = await createUser({
			email: 'team-without-org@coret.local',
			name: 'Team Without Org User',
		})
		const headers = await getAuthHeaders({ userId: user.id })
		await createActiveOrganizationAndTeam({ headers, userId: user.id })

		await db
			.update(sessionTable)
			.set({ activeOrganizationId: null })
			.where(eq(sessionTable.userId, user.id))

		await expect(
			createTestORPCClient(headers).appContext()
		).rejects.toMatchObject({
			code: 'CONFLICT',
			status: 409,
		})
	})

	it('returns conflict when the active team belongs to another organization', async () => {
		const owner = await createUser({
			email: 'other-team-owner@coret.local',
			name: 'Other Team Owner',
		})
		const caller = await createUser({
			email: 'wrong-team-org@coret.local',
			name: 'Wrong Team Org User',
		})
		const ownerHeaders = await getAuthHeaders({ userId: owner.id })
		const callerHeaders = await getAuthHeaders({ userId: caller.id })
		await createActiveOrganizationAndTeam({
			headers: callerHeaders,
			userId: caller.id,
		})
		const { team: otherTeam } = await createActiveOrganizationAndTeam({
			headers: ownerHeaders,
			userId: owner.id,
			organizationName: 'Other Workspace',
			organizationSlug: 'other-workspace',
			teamName: 'Other Team',
			teamKey: 'OTHR',
		})

		await db
			.update(sessionTable)
			.set({ activeTeamId: otherTeam.id })
			.where(eq(sessionTable.userId, caller.id))

		await expect(
			createTestORPCClient(callerHeaders).appContext()
		).rejects.toMatchObject({
			code: 'CONFLICT',
			status: 409,
		})
	})

	it('returns forbidden when active team membership is missing', async () => {
		const user = await createUser({
			email: 'missing-team-membership@coret.local',
			name: 'Missing Team Membership User',
		})
		const headers = await getAuthHeaders({ userId: user.id })
		const { team } = await createActiveOrganizationAndTeam({
			headers,
			userId: user.id,
		})

		await db
			.delete(teamMemberTable)
			.where(
				and(
					eq(teamMemberTable.teamId, team.id),
					eq(teamMemberTable.userId, user.id)
				)
			)

		await expect(
			createTestORPCClient(headers).appContext()
		).rejects.toMatchObject({
			code: 'FORBIDDEN',
			status: 403,
		})
	})
})

function createTestORPCClient(headers?: Headers) {
	const request = new Request('http://localhost:3002/api/rpc/app-context', {
		headers,
	})

	return createRouterClient(orpcRouters, {
		context: async () => createORPCContext({ req: request }),
	})
}

async function createUser({ email, name }: { email: string; name: string }) {
	const context = await testAuth.$context
	const user = context.test.createUser({ email, name })

	await context.test.saveUser(user)

	return user
}

async function getAuthHeaders({ userId }: { userId: string }) {
	const context = await testAuth.$context
	return context.test.getAuthHeaders({ userId })
}

async function createActiveOrganizationAndTeam({
	headers,
	userId,
	organizationName = 'Acme Workspace',
	organizationSlug = 'acme-workspace',
	teamName = 'Platform',
	teamKey = 'PLAT',
}: {
	headers: Headers
	userId: string
	organizationName?: string
	organizationSlug?: string
	teamName?: string
	teamKey?: string
}) {
	const organization = await testAuth.api.createOrganization({
		body: {
			name: organizationName,
			slug: organizationSlug,
		},
		headers,
	})

	const team = await testAuth.api.createTeam({
		body: {
			name: teamName,
			organizationId: organization.id,
			key: teamKey,
		},
		headers,
	})

	await testAuth.api.addTeamMember({
		body: {
			teamId: team.id,
			userId,
		},
		headers,
	})

	await testAuth.api.setActiveOrganization({
		body: {
			organizationId: organization.id,
		},
		headers,
	})

	await testAuth.api.setActiveTeam({
		body: {
			teamId: team.id,
		},
		headers,
	})

	return { organization, team }
}
