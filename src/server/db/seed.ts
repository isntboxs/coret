import 'dotenv/config'
import { hashPassword } from '@better-auth/utils/password'
import { eq } from 'drizzle-orm'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { db, dbPool } from '#/server/db'
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

export const demo = {
	userId: '11111111-1111-4111-8111-111111111111',
	accountId: '22222222-2222-4222-8222-222222222222',
	organizationId: '33333333-3333-4333-8333-333333333333',
	memberId: '44444444-4444-4444-8444-444444444444',
	teamId: '55555555-5555-4555-8555-555555555555',
	teamMemberId: '66666666-6666-4666-8666-666666666666',
	statusBacklogId: '77777777-7777-4777-8777-777777777777',
	statusTodoId: '88888888-8888-4888-8888-888888888888',
	statusStartedId: '99999999-9999-4999-8999-999999999999',
	statusDoneId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	statusCanceledId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
	counterId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
	projectId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
	issueId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
	commentId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
} as const

export const demoEmail = 'demo@coret.local'
export const demoPassword = 'password123'

export async function seedDatabase() {
	const now = new Date()
	const passwordHash = await hashPassword(demoPassword)

	await db
		.insert(userTable)
		.values({
			id: demo.userId,
			name: 'Demo User',
			email: demoEmail,
			emailVerified: true,
			createdAt: now,
			updatedAt: now,
			username: 'demo',
			displayUsername: 'demo',
		})
		.onConflictDoNothing({ target: userTable.id })

	await db
		.insert(accountTable)
		.values({
			id: demo.accountId,
			accountId: demo.userId,
			providerId: 'credential',
			userId: demo.userId,
			password: passwordHash,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing({ target: accountTable.id })

	await db
		.insert(organizationTable)
		.values({
			id: demo.organizationId,
			name: 'Coret Demo Workspace',
			slug: 'coret-demo',
			createdAt: now,
		})
		.onConflictDoNothing({ target: organizationTable.id })

	await db
		.insert(memberTable)
		.values({
			id: demo.memberId,
			organizationId: demo.organizationId,
			userId: demo.userId,
			role: 'owner',
			createdAt: now,
		})
		.onConflictDoNothing({ target: memberTable.id })

	await db
		.insert(teamTable)
		.values({
			id: demo.teamId,
			name: 'Core Team',
			key: 'CORE',
			organizationId: demo.organizationId,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing({ target: teamTable.id })

	await db
		.insert(teamMemberTable)
		.values({
			id: demo.teamMemberId,
			teamId: demo.teamId,
			userId: demo.userId,
			createdAt: now,
		})
		.onConflictDoNothing({ target: teamMemberTable.id })

	await db
		.insert(issueStatusTable)
		.values([
			{
				id: demo.statusBacklogId,
				teamId: demo.teamId,
				name: 'Backlog',
				category: 'backlog',
				position: 0,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: demo.statusTodoId,
				teamId: demo.teamId,
				name: 'Todo',
				category: 'unstarted',
				position: 1,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: demo.statusStartedId,
				teamId: demo.teamId,
				name: 'In Progress',
				category: 'started',
				position: 2,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: demo.statusDoneId,
				teamId: demo.teamId,
				name: 'Done',
				category: 'completed',
				position: 3,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: demo.statusCanceledId,
				teamId: demo.teamId,
				name: 'Canceled',
				category: 'canceled',
				position: 4,
				createdAt: now,
				updatedAt: now,
			},
		])
		.onConflictDoNothing()

	await db
		.insert(teamIssueCounterTable)
		.values({
			id: demo.counterId,
			teamId: demo.teamId,
			nextNumber: 2,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing({ target: teamIssueCounterTable.teamId })

	await db
		.insert(projectTable)
		.values({
			id: demo.projectId,
			teamId: demo.teamId,
			name: 'V1 Foundation',
			slug: 'v1-foundation',
			description: 'Persistence, auth scaffolding, and first issue workflow.',
			leadId: demo.userId,
			status: 'active',
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing({ target: projectTable.id })

	await db
		.insert(issueTable)
		.values({
			id: demo.issueId,
			teamId: demo.teamId,
			projectId: demo.projectId,
			statusId: demo.statusTodoId,
			creatorId: demo.userId,
			assigneeId: demo.userId,
			issueNumber: 1,
			issueKey: 'CORE-1',
			title: 'Wire the V1 persistence foundation',
			description: [
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
			],
			searchText:
				'Wire the V1 persistence foundation Demo issue seeded for local development.',
			priority: 'medium',
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing({ target: issueTable.id })

	await db
		.insert(commentTable)
		.values({
			id: demo.commentId,
			issueId: demo.issueId,
			authorId: demo.userId,
			body: [
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
			],
			searchText:
				'This comment proves BlockNote JSON persistence is available.',
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing({ target: commentTable.id })

	const [counter] = await db
		.select({
			teamId: teamIssueCounterTable.teamId,
			nextNumber: teamIssueCounterTable.nextNumber,
		})
		.from(teamIssueCounterTable)
		.where(eq(teamIssueCounterTable.teamId, demo.teamId))

	return {
		demo,
		demoEmail,
		demoPassword,
		nextIssueNumber: counter?.nextNumber ?? null,
	}
}

async function runCli() {
	const result = await seedDatabase()
	console.debug('Seed complete.')
	console.debug(`Demo user: ${demoEmail}`)
	console.debug(`Demo password: ${demoPassword}`)
	console.debug(`Demo workspace: coret-demo / CORE`)
	console.debug(`Next issue number: ${result.nextIssueNumber ?? 'missing'}`)
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	void runCli()
		.catch((error: unknown) => {
			console.debug(error)
			process.exitCode = 1
		})
		.finally(() => void dbPool.end())
}
