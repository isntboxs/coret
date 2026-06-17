import { and, eq } from 'drizzle-orm'

import { teamTable } from '#/db/schemas/auth'

type Database = {
	query: {
		teamTable: {
			findFirst: (config: {
				where: ReturnType<typeof and>
				columns: { id: true }
			}) => Promise<{ id: string } | undefined>
		}
	}
}
type TeamKeyExists = (key: string) => Promise<boolean>
type StatusCategory =
	| 'backlog'
	| 'unstarted'
	| 'started'
	| 'completed'
	| 'canceled'

export const DEFAULT_TEAM_TIMEZONE = 'UTC'

export const DEFAULT_WORKFLOW_STATUSES = [
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
] as const satisfies Array<{
	name: string
	color: string
	category: StatusCategory
	position: number
	isDefault: boolean
}>

function normalizeKeySegment(value: string) {
	return value.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

export function getTeamKeyBase(name: string) {
	const tokens = name.match(/[a-z0-9]+/gi)?.map(normalizeKeySegment) ?? []

	if (tokens.length > 1) {
		const initials = tokens.map((token) => token.at(0)).join('')
		return initials.slice(0, 5) || 'TEAM'
	}

	const single = tokens.at(0)
	if (single) {
		return single.slice(0, 4) || 'TEAM'
	}

	return 'TEAM'
}

function withNumericSuffix(base: string, index: number) {
	const suffix = String(index)
	const prefix = base.slice(0, Math.max(1, 5 - suffix.length))
	return `${prefix}${suffix}`
}

export async function generateTeamKeyFromExists(
	name: string,
	keyExists: TeamKeyExists
) {
	const base = getTeamKeyBase(name)

	for (let index = 0; index < 100; index++) {
		const key = index === 0 ? base : withNumericSuffix(base, index + 1)
		const existing = await keyExists(key)

		if (!existing) {
			return key
		}
	}

	throw new Error('Unable to generate a unique team key')
}

export async function generateTeamKey(
	database: Database,
	organizationId: string,
	name: string
) {
	return generateTeamKeyFromExists(name, async (key) => {
		const existing = await database.query.teamTable.findFirst({
			where: and(
				eq(teamTable.organizationId, organizationId),
				eq(teamTable.key, key)
			),
			columns: { id: true },
		})

		return Boolean(existing)
	})
}
