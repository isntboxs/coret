import { describe, expect, it } from 'vitest'

import {
	DEFAULT_WORKFLOW_STATUSES,
	generateTeamKeyFromExists,
	getTeamKeyBase,
} from '#/features/workspace/server/defaults'

describe('workspace defaults', () => {
	it('defines the default workflow status sequence', () => {
		expect(DEFAULT_WORKFLOW_STATUSES).toEqual([
			{
				name: 'Backlog',
				color: 'slate',
				category: 'backlog',
				position: 0,
				isDefault: false,
			},
			{
				name: 'Todo',
				color: 'gray',
				category: 'unstarted',
				position: 1,
				isDefault: true,
			},
			{
				name: 'In Progress',
				color: 'blue',
				category: 'started',
				position: 2,
				isDefault: false,
			},
			{
				name: 'Done',
				color: 'green',
				category: 'completed',
				position: 3,
				isDefault: false,
			},
			{
				name: 'Canceled',
				color: 'red',
				category: 'canceled',
				position: 4,
				isDefault: false,
			},
		])
	})

	it('builds a team key from workspace words', () => {
		expect(getTeamKeyBase('Acme Product Ops')).toBe('APO')
		expect(getTeamKeyBase('Coret')).toBe('CORE')
		expect(getTeamKeyBase('!!!')).toBe('TEAM')
	})

	it('resolves team key collisions with numeric suffixes', async () => {
		const occupied = new Set(['APO', 'APO2', 'APO3'])

		await expect(
			generateTeamKeyFromExists('Acme Product Ops', (key) =>
				Promise.resolve(occupied.has(key))
			)
		).resolves.toBe('APO4')
	})

	it('caps team keys at five characters when adding suffixes', async () => {
		const occupied = new Set(['ABCD', 'ABCD2'])

		await expect(
			generateTeamKeyFromExists('Abcdef', (key) =>
				Promise.resolve(occupied.has(key))
			)
		).resolves.toBe('ABCD3')
	})
})
