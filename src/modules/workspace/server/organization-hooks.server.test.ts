import { APIError } from 'better-auth/api'
import { describe, expect, it, vi } from 'vitest'

import {
	beforeCreateWorkspaceHook,
	beforeUpdateTeamHook,
	beforeUpdateWorkspaceHook,
	createBeforeCreateTeamHook,
} from '#/modules/workspace/server/organization-hooks.server'

vi.mock('#/db', () => {
	return {
		db: {
			query: {
				teamTable: {
					findFirst: () => Promise.resolve(undefined),
				},
			},
		},
	}
})

vi.mock('#/shared/logger/server', () => {
	return {
		createServerLogger: () => {
			return {
				debug: vi.fn(),
				error: vi.fn(),
			}
		},
	}
})

const user = { id: '00000000-0000-4000-8000-000000000001' }
const organization = {
	id: '00000000-0000-4000-8000-000000000002',
	name: 'Acme Product',
}

describe('Better Auth organization hooks', () => {
	it('sanitizes workspace creation data', async () => {
		await expect(
			beforeCreateWorkspaceHook({
				organization: {
					name: '  Acme Product  ',
					slug: 'Acme Product',
					metadata: { source: 'test' },
				},
				user,
			})
		).resolves.toEqual({
			data: {
				name: 'Acme Product',
				slug: 'acme-product',
				metadata: { source: 'test' },
			},
		})
	})

	it('rejects invalid workspace creation data', () => {
		expect(() =>
			beforeCreateWorkspaceHook({
				organization: {
					name: 'Acme Product',
					slug: '!!!',
				},
				user,
			})
		).toThrow(APIError)
	})

	it('sanitizes workspace update data', async () => {
		await expect(
			beforeUpdateWorkspaceHook({
				organization: {
					name: '  Acme Operations  ',
					slug: 'Acme Operations',
					metadata: { tier: 'starter' },
				},
				user,
				member: { role: 'owner' },
			})
		).resolves.toEqual({
			data: {
				name: 'Acme Operations',
				slug: 'acme-operations',
				metadata: { tier: 'starter' },
			},
		})
	})

	it('generates default team creation data', async () => {
		const beforeCreateTeamHook = createBeforeCreateTeamHook({
			query: {
				teamTable: {
					findFirst: () => Promise.resolve(undefined),
				},
			},
		})

		const result = await beforeCreateTeamHook({
			team: {
				name: '  Acme Product  ',
				organizationId: organization.id,
			},
			user,
			organization,
		})

		expect(result).toMatchObject({
			data: {
				name: 'Acme Product',
				organizationId: organization.id,
				key: 'ACME',
				visibility: 'public',
				creatorId: user.id,
			},
		})
		expect(result?.data.updatedAt).toBeInstanceOf(Date)
	})

	it('sanitizes team update data', async () => {
		await expect(
			beforeUpdateTeamHook({
				team: {
					id: '00000000-0000-4000-8000-000000000003',
					organizationId: organization.id,
					key: 'ACME',
					name: 'Acme Product',
				},
				updates: {
					name: '  Platform  ',
					key: 'eng-core',
					visibility: 'private',
				},
				user,
				organization: { id: organization.id },
			})
		).resolves.toEqual({
			data: {
				name: 'Platform',
				key: 'ENGCO',
				visibility: 'private',
			},
		})
	})

	it('rejects invalid team visibility', () => {
		expect(() =>
			beforeUpdateTeamHook({
				team: {
					id: '00000000-0000-4000-8000-000000000003',
					organizationId: organization.id,
					key: 'ACME',
					name: 'Acme Product',
				},
				updates: {
					visibility: 'internal' as 'public',
				},
				user,
				organization: { id: organization.id },
			})
		).toThrow(APIError)
	})
})
