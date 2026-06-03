import { asc, count, eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { auth } from '#/server/auth'
import { createSharedAuthOptions } from '#/server/auth/shared'
import { testAuth } from '#/server/auth/test'
import { db } from '#/server/db'
import {
	accountTable,
	commentTable,
	issueStatusTable,
	issueTable,
	memberTable,
	organizationTable,
	projectTable,
	teamIssueCounterTable,
	teamMemberTable,
	teamTable,
	userTable,
} from '#/server/db/schemas'
import { demo, demoEmail, seedDatabase } from '#/server/db/seed'
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

describe('seed database', () => {
	it('creates the demo user, workspace, team, issue, and comment shape', async () => {
		const result = await seedDatabase()

		expect(result.nextIssueNumber).toBe(2)

		const [user] = await db
			.select()
			.from(userTable)
			.where(eq(userTable.id, demo.userId))

		expect(user).toMatchObject({
			id: demo.userId,
			name: 'Demo User',
			email: demoEmail,
			emailVerified: true,
			username: 'demo',
		})

		const [account] = await db
			.select()
			.from(accountTable)
			.where(eq(accountTable.id, demo.accountId))

		expect(account).toMatchObject({
			accountId: demo.userId,
			providerId: 'credential',
			userId: demo.userId,
		})
		expect(account?.password).toEqual(expect.any(String))

		const [organization] = await db
			.select()
			.from(organizationTable)
			.where(eq(organizationTable.id, demo.organizationId))

		expect(organization).toMatchObject({
			name: 'Coret Demo Workspace',
			slug: 'coret-demo',
		})

		const [member] = await db
			.select()
			.from(memberTable)
			.where(eq(memberTable.id, demo.memberId))

		expect(member).toMatchObject({
			organizationId: demo.organizationId,
			userId: demo.userId,
			role: 'owner',
		})

		const [team] = await db
			.select()
			.from(teamTable)
			.where(eq(teamTable.id, demo.teamId))

		expect(team).toMatchObject({
			name: 'Core Team',
			key: 'CORE',
			organizationId: demo.organizationId,
		})

		const [teamMember] = await db
			.select()
			.from(teamMemberTable)
			.where(eq(teamMemberTable.id, demo.teamMemberId))

		expect(teamMember).toMatchObject({
			teamId: demo.teamId,
			userId: demo.userId,
		})

		const statuses = await db
			.select({
				category: issueStatusTable.category,
				name: issueStatusTable.name,
				position: issueStatusTable.position,
			})
			.from(issueStatusTable)
			.where(eq(issueStatusTable.teamId, demo.teamId))
			.orderBy(asc(issueStatusTable.position))

		expect(statuses).toEqual([
			{ category: 'backlog', name: 'Backlog', position: 0 },
			{ category: 'unstarted', name: 'Todo', position: 1 },
			{ category: 'started', name: 'In Progress', position: 2 },
			{ category: 'completed', name: 'Done', position: 3 },
			{ category: 'canceled', name: 'Canceled', position: 4 },
		])

		const [counter] = await db
			.select()
			.from(teamIssueCounterTable)
			.where(eq(teamIssueCounterTable.teamId, demo.teamId))

		expect(counter?.nextNumber).toBe(2)

		const [project] = await db
			.select()
			.from(projectTable)
			.where(eq(projectTable.id, demo.projectId))

		expect(project).toMatchObject({
			teamId: demo.teamId,
			name: 'V1 Foundation',
			slug: 'v1-foundation',
			leadId: demo.userId,
			status: 'active',
		})

		const [issue] = await db
			.select()
			.from(issueTable)
			.where(eq(issueTable.id, demo.issueId))

		expect(issue).toMatchObject({
			teamId: demo.teamId,
			projectId: demo.projectId,
			statusId: demo.statusTodoId,
			creatorId: demo.userId,
			assigneeId: demo.userId,
			issueNumber: 1,
			issueKey: 'CORE-1',
			title: 'Wire the V1 persistence foundation',
			searchText:
				'Wire the V1 persistence foundation Demo issue seeded for local development.',
			priority: 'medium',
		})
		expect(issue?.description).toEqual([
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'Demo issue seeded for local development.',
						styles: {},
					},
				],
			},
		])

		const [comment] = await db
			.select()
			.from(commentTable)
			.where(eq(commentTable.id, demo.commentId))

		expect(comment).toMatchObject({
			issueId: demo.issueId,
			authorId: demo.userId,
			searchText:
				'This comment proves BlockNote JSON persistence is available.',
		})
		expect(comment?.body).toEqual([
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'This comment proves BlockNote JSON persistence is available.',
						styles: {},
					},
				],
			},
		])
	})

	it('is idempotent for the seeded records', async () => {
		await seedDatabase()
		await seedDatabase()

		expect(await countRows(userTable.id, demo.userId)).toBe(1)
		expect(await countRows(accountTable.id, demo.accountId)).toBe(1)
		expect(await countRows(organizationTable.id, demo.organizationId)).toBe(1)
		expect(await countRows(teamTable.id, demo.teamId)).toBe(1)
		expect(await countRows(projectTable.id, demo.projectId)).toBe(1)
		expect(await countRows(issueTable.id, demo.issueId)).toBe(1)
		expect(await countRows(commentTable.id, demo.commentId)).toBe(1)

		const [statusCount] = await db
			.select({ value: count() })
			.from(issueStatusTable)
			.where(eq(issueStatusTable.teamId, demo.teamId))

		expect(statusCount?.value).toBe(5)

		const [counter] = await db
			.select({ nextNumber: teamIssueCounterTable.nextNumber })
			.from(teamIssueCounterTable)
			.where(eq(teamIssueCounterTable.teamId, demo.teamId))

		expect(counter?.nextNumber).toBe(2)
	})

	it('keeps email/password sign-in disabled for the OAuth-only flow', async () => {
		await seedDatabase()

		await expect(
			testAuth.api.signInEmail({
				body: {
					email: demoEmail,
					password: 'password123',
				},
			})
		).rejects.toThrow(/email and password is not enabled/i)
	})
})

describe('OAuth-only auth configuration', () => {
	it('enables GitHub and Google providers while disabling email/password', () => {
		const options = createSharedAuthOptions()

		expect(options.emailAndPassword.enabled).toBe(false)
		expect(options.socialProviders.github).toMatchObject({
			enabled: true,
			clientId: 'test-github-client-id',
			clientSecret: 'test-github-client-secret',
		})
		expect(options.socialProviders.google).toMatchObject({
			enabled: true,
			clientId: 'test-google-client-id',
			clientSecret: 'test-google-client-secret',
		})
	})
})

describe('Better Auth Test Utils integration', () => {
	it('keeps privileged Test Utils off the production auth context', async () => {
		const productionContext = await auth.$context
		const testContext = await testAuth.$context

		expect('test' in productionContext).toBe(false)
		expect(testContext.test).toBeDefined()
	})

	it('creates authenticated sessions through Test Utils helpers', async () => {
		const context = await testAuth.$context
		const user = context.test.createUser({
			email: 'session-user@coret.local',
			name: 'Session User',
		})

		await context.test.saveUser(user)

		const login = await context.test.login({ userId: user.id })
		const headers = await context.test.getAuthHeaders({ userId: user.id })
		const session = await testAuth.api.getSession({ headers })

		expect(login.user.id).toBe(user.id)
		expect(login.headers.get('cookie')).toContain('better-auth.session_token')
		expect(session?.user.id).toBe(user.id)
		expect(session?.user.email).toBe(user.email)
	})

	it('creates an organization and team, then sets both active', async () => {
		const context = await testAuth.$context
		const user = context.test.createUser({
			email: 'owner@coret.local',
			name: 'Owner User',
		})

		await context.test.saveUser(user)
		const headers = await context.test.getAuthHeaders({ userId: user.id })

		const organization = await testAuth.api.createOrganization({
			body: {
				name: 'Acme Workspace',
				slug: 'acme-workspace',
			},
			headers,
		})

		const team = await testAuth.api.createTeam({
			body: {
				name: 'Platform',
				organizationId: organization.id,
				key: 'PLAT',
			},
			headers,
		})

		await testAuth.api.addTeamMember({
			body: {
				teamId: team.id,
				userId: user.id,
			},
			headers,
		})

		const activeOrganization = await testAuth.api.setActiveOrganization({
			body: {
				organizationId: organization.id,
			},
			headers,
		})

		const activeTeam = await testAuth.api.setActiveTeam({
			body: {
				teamId: team.id,
			},
			headers,
		})

		const session = await testAuth.api.getSession({ headers })

		expect(organization.members).toEqual([
			expect.objectContaining({
				userId: user.id,
				role: 'owner',
			}),
		])
		expect(team).toMatchObject({
			name: 'Platform',
			organizationId: organization.id,
			key: 'PLAT',
		})
		expect(activeOrganization?.id).toBe(organization.id)
		expect(activeTeam?.id).toBe(team.id)
		expect(session?.session.activeOrganizationId).toBe(organization.id)
		expect(session?.session.activeTeamId).toBe(team.id)
	})

	it('denies activating an organization or team for a non-member', async () => {
		const context = await testAuth.$context
		const owner = context.test.createUser({
			email: 'tenant-owner@coret.local',
			name: 'Tenant Owner',
		})
		const outsider = context.test.createUser({
			email: 'stranger@coret.local',
			name: 'Stranger',
		})
		const organizationMember = context.test.createUser({
			email: 'workspace-member@coret.local',
			name: 'Workspace Member',
		})

		await context.test.saveUser(owner)
		await context.test.saveUser(outsider)
		await context.test.saveUser(organizationMember)

		const ownerHeaders = await context.test.getAuthHeaders({
			userId: owner.id,
		})
		const outsiderHeaders = await context.test.getAuthHeaders({
			userId: outsider.id,
		})
		const organizationMemberHeaders = await context.test.getAuthHeaders({
			userId: organizationMember.id,
		})

		const organization = await testAuth.api.createOrganization({
			body: {
				name: 'Private Workspace',
				slug: 'private-workspace',
			},
			headers: ownerHeaders,
		})

		const team = await testAuth.api.createTeam({
			body: {
				name: 'Private Team',
				organizationId: organization.id,
				key: 'PRIV',
			},
			headers: ownerHeaders,
		})

		if (!context.test.addMember) {
			throw new Error('Test Utils addMember helper is not available')
		}

		await context.test.addMember({
			userId: organizationMember.id,
			organizationId: organization.id,
			role: 'member',
		})

		await expect(
			testAuth.api.setActiveOrganization({
				body: {
					organizationId: organization.id,
				},
				headers: outsiderHeaders,
			})
		).rejects.toThrow(/member/i)

		const activeOrganization = await testAuth.api.setActiveOrganization({
			body: {
				organizationId: organization.id,
			},
			headers: organizationMemberHeaders,
		})

		await expect(
			testAuth.api.setActiveTeam({
				body: {
					teamId: team.id,
				},
				headers: organizationMemberHeaders,
			})
		).rejects.toThrow(/member/i)

		expect(activeOrganization?.id).toBe(organization.id)
	})
})

async function countRows(
	column:
		| typeof userTable.id
		| typeof accountTable.id
		| typeof organizationTable.id
		| typeof teamTable.id
		| typeof projectTable.id
		| typeof issueTable.id
		| typeof commentTable.id,
	id: string
) {
	const table = column.table
	const [row] = await db
		.select({ value: count() })
		.from(table)
		.where(eq(column, id))

	return row?.value ?? 0
}
