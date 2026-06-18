import '@tanstack/react-start/server-only'
import { APIError } from 'better-auth/api'
import { eq } from 'drizzle-orm'
import limax from 'limax'

import { db } from '#/db'
import { teamIssueCounterTable } from '#/db/schemas/attachments'
import { teamMemberTable } from '#/db/schemas/auth'
import { issueStatusTable } from '#/db/schemas/issues'
import { welcomeProgressTable } from '#/db/schemas/welcome'
import {
	DEFAULT_WORKFLOW_STATUSES,
	generateTeamKey,
} from '#/modules/workspace/server/defaults.server'
import { createServerLogger } from '#/shared/logger/server'
import type { LoggerBindings } from '#/shared/logger/shared'

const workspaceSlugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
const hookLogger = createServerLogger({
	component: 'better-auth.organization-hooks',
})

type ApiErrorStatus = ConstructorParameters<typeof APIError>[0]
type DomainDatabase = typeof db
type HookData = Record<string, unknown>

interface HookUser {
	id: string
	email?: string
}

interface WorkspaceMutationInput extends HookData {
	name?: string
	slug?: string
	logo?: string | null
	metadata?: Record<string, unknown>
}

interface HookWorkspace extends HookData {
	id: string
	name: string
	slug: string
}

interface HookMember extends HookData {
	id: string
	userId: string
	organizationId: string
	role: string
}

interface TeamMutationInput extends HookData {
	name: string
	organizationId: string
	key?: string
	visibility?: 'public' | 'private'
	metadata?: unknown
}

interface TeamUpdateInput extends HookData {
	name?: string
	key?: string
	visibility?: 'public' | 'private'
}

interface HookTeam extends HookData {
	id: string
	name: string
	organizationId: string
	key?: string
	visibility?: 'public' | 'private'
}

interface HookTeamMember extends HookData {
	id: string
	teamId: string
	userId: string
}

interface HookInvitation extends HookData {
	id?: string
	email: string
	role?: string
	organizationId: string
	inviterId?: string
	teamId?: string | null
}

export function normalizeWorkspaceSlug(value: string) {
	return limax(value).toLowerCase()
}

export function normalizeTeamKey(value: string) {
	return value
		.replace(/[^a-z0-9]/gi, '')
		.toUpperCase()
		.slice(0, 5)
}

export function throwApiError(
	status: ApiErrorStatus,
	message: string,
	code: string
): never {
	throw new APIError(status, { code, message })
}

export function logHookError(
	hookName: string,
	error: unknown,
	bindings: LoggerBindings = {}
) {
	hookLogger.error(
		{ ...bindings, err: error, hookName },
		'Better Auth organization hook failed'
	)
}

export async function runAfterHookSafely(
	hookName: string,
	callback: () => Promise<void>,
	bindings: LoggerBindings = {}
) {
	try {
		await callback()
	} catch (error) {
		logHookError(hookName, error, bindings)
	}
}

function logHookDebug(hookName: string, bindings: LoggerBindings = {}) {
	hookLogger.debug({ ...bindings, hookName }, 'Better Auth organization hook')
}

function readRequiredString(value: unknown, message: string, code: string) {
	if (typeof value !== 'string') {
		throwApiError('BAD_REQUEST', message, code)
	}

	const trimmed = value.trim()
	if (!trimmed) {
		throwApiError('BAD_REQUEST', message, code)
	}

	return trimmed
}

function sanitizeWorkspaceSlug(value: unknown) {
	const slug = normalizeWorkspaceSlug(
		readRequiredString(
			value,
			'Workspace slug is required',
			'INVALID_WORKSPACE_SLUG'
		)
	)

	if (!workspaceSlugRegex.test(slug)) {
		throwApiError(
			'BAD_REQUEST',
			'Workspace slug must be lowercase alphanumeric with hyphens between segments',
			'INVALID_WORKSPACE_SLUG'
		)
	}

	return slug
}

function sanitizeWorkspaceName(value: unknown) {
	return readRequiredString(
		value,
		'Workspace name is required',
		'INVALID_WORKSPACE_NAME'
	)
}

function sanitizeTeamName(value: unknown) {
	return readRequiredString(value, 'Team name is required', 'INVALID_TEAM_NAME')
}

function sanitizeOptionalVisibility(value: unknown) {
	if (value === undefined) return undefined

	if (value !== 'public' && value !== 'private') {
		throwApiError(
			'BAD_REQUEST',
			'Team visibility must be public or private',
			'INVALID_TEAM_VISIBILITY'
		)
	}

	return value
}

function sanitizeTeamKey(value: unknown) {
	const key = normalizeTeamKey(
		readRequiredString(value, 'Team key is required', 'INVALID_TEAM_KEY')
	)

	if (!key) {
		throwApiError('BAD_REQUEST', 'Team key is required', 'INVALID_TEAM_KEY')
	}

	return key
}

export async function ensureWelcomeProgress(
	database: DomainDatabase,
	input: { organizationId: string; userId: string; now?: Date }
) {
	const now = input.now ?? new Date()

	await database
		.insert(welcomeProgressTable)
		.values({
			organizationId: input.organizationId,
			userId: input.userId,
			currentStep: 1,
			githubStatus: 'not_started',
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing()
}

export async function ensureTeamDomainDefaults(
	database: DomainDatabase,
	input: { teamId: string; userId?: string; now?: Date }
) {
	const now = input.now ?? new Date()

	await database
		.insert(issueStatusTable)
		.values(
			DEFAULT_WORKFLOW_STATUSES.map((status) => {
				return {
					...status,
					teamId: input.teamId,
					createdAt: now,
					updatedAt: now,
				}
			})
		)
		.onConflictDoNothing()

	await database
		.insert(teamIssueCounterTable)
		.values({
			teamId: input.teamId,
			nextNumber: 1,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing()

	if (input.userId) {
		await database
			.insert(teamMemberTable)
			.values({
				teamId: input.teamId,
				userId: input.userId,
				createdAt: now,
			})
			.onConflictDoNothing()
	}

	return database.query.issueStatusTable.findMany({
		where: eq(issueStatusTable.teamId, input.teamId),
		orderBy: (table, { asc }) => [asc(table.position)],
	})
}

export async function ensureWorkspaceCreationDefaults(
	database: DomainDatabase,
	input: {
		workspaceId: string
		defaultTeamId: string
		userId: string
		now?: Date
	}
) {
	const now = input.now ?? new Date()

	await ensureWelcomeProgress(database, {
		organizationId: input.workspaceId,
		userId: input.userId,
		now,
	})

	return ensureTeamDomainDefaults(database, {
		teamId: input.defaultTeamId,
		userId: input.userId,
		now,
	})
}

export function beforeCreateWorkspaceHook(data: {
	organization: WorkspaceMutationInput
	user: HookUser
}): Promise<{ data: HookData } | void> {
	return Promise.resolve({
		data: {
			...data.organization,
			name: sanitizeWorkspaceName(data.organization.name),
			slug: sanitizeWorkspaceSlug(data.organization.slug),
		},
	})
}

export async function afterCreateWorkspaceHook(data: {
	organization: HookWorkspace
	member: HookMember
	user: HookUser
}) {
	await runAfterHookSafely(
		'afterCreateWorkspaceHook',
		() =>
			ensureWelcomeProgress(db, {
				organizationId: data.organization.id,
				userId: data.user.id,
			}),
		{
			organizationId: data.organization.id,
			memberId: data.member.id,
			userId: data.user.id,
		}
	)
}

export function beforeUpdateWorkspaceHook(data: {
	organization: WorkspaceMutationInput
	user: HookUser
	member: Pick<HookMember, 'role'>
}): Promise<{ data: HookData } | void> {
	const updates: HookData = { ...data.organization }

	if (data.organization.name !== undefined) {
		updates.name = sanitizeWorkspaceName(data.organization.name)
	}

	if (data.organization.slug !== undefined) {
		updates.slug = sanitizeWorkspaceSlug(data.organization.slug)
	}

	return Promise.resolve({ data: updates })
}

export function afterUpdateWorkspaceHook(data: {
	organization: HookWorkspace | null
	user: HookUser
	member: Pick<HookMember, 'id' | 'role'>
}): Promise<void> {
	logHookDebug('afterUpdateWorkspaceHook', {
		organizationId: data.organization?.id,
		memberId: data.member.id,
		userId: data.user.id,
	})
	return Promise.resolve()
}

export function createBeforeCreateTeamHook(
	database: Parameters<typeof generateTeamKey>[0]
) {
	return async function beforeCreateTeamHookForDatabase(data: {
		team: TeamMutationInput
		user?: HookUser
		organization: Pick<HookWorkspace, 'id' | 'name'>
	}): Promise<{ data: HookData } | void> {
		const name = sanitizeTeamName(data.team.name)
		const key = await generateTeamKey(database, data.team.organizationId, name)
		const visibility = sanitizeOptionalVisibility(data.team.visibility)

		return {
			data: {
				...data.team,
				name,
				key,
				visibility: visibility ?? 'public',
				creatorId: data.user?.id,
				metadata: data.team.metadata,
				updatedAt: new Date(),
			},
		}
	}
}

export const beforeCreateTeamHook = createBeforeCreateTeamHook(db)

export async function afterCreateTeamHook(data: {
	team: HookTeam
	user?: HookUser
	organization: Pick<HookWorkspace, 'id'>
}) {
	await runAfterHookSafely(
		'afterCreateTeamHook',
		async () => {
			await ensureTeamDomainDefaults(db, {
				teamId: data.team.id,
				userId: data.user?.id,
			})
		},
		{
			organizationId: data.organization.id,
			teamId: data.team.id,
			userId: data.user?.id,
		}
	)
}

export function beforeUpdateTeamHook(data: {
	team: Pick<HookTeam, 'id' | 'organizationId' | 'key' | 'name'>
	updates: TeamUpdateInput
	user: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<{ data: HookData } | void> {
	const updates: HookData = { ...data.updates }

	if (data.updates.name !== undefined) {
		updates.name = sanitizeTeamName(data.updates.name)
	}

	if (data.updates.key !== undefined) {
		updates.key = sanitizeTeamKey(data.updates.key)
	}

	if (data.updates.visibility !== undefined) {
		updates.visibility = sanitizeOptionalVisibility(data.updates.visibility)
	}

	return Promise.resolve({ data: updates })
}

export function afterUpdateTeamHook(data: {
	team: HookTeam | null
	user: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<void> {
	logHookDebug('afterUpdateTeamHook', {
		organizationId: data.organization.id,
		teamId: data.team?.id,
		userId: data.user.id,
	})
	return Promise.resolve()
}

export function beforeDeleteWorkspaceHook(data: {
	organization: HookWorkspace
	user: HookUser
}): Promise<void> {
	logHookDebug('beforeDeleteWorkspaceHook', {
		organizationId: data.organization.id,
		userId: data.user.id,
	})
	return Promise.resolve()
}

export function afterDeleteWorkspaceHook(data: {
	organization: HookWorkspace
	user: HookUser
}): Promise<void> {
	logHookDebug('afterDeleteWorkspaceHook', {
		organizationId: data.organization.id,
		userId: data.user.id,
	})
	return Promise.resolve()
}

export function beforeDeleteTeamHook(data: {
	team: HookTeam
	user?: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<void> {
	logHookDebug('beforeDeleteTeamHook', {
		organizationId: data.organization.id,
		teamId: data.team.id,
		userId: data.user?.id,
	})
	return Promise.resolve()
}

export function afterDeleteTeamHook(data: {
	team: HookTeam
	user?: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<void> {
	logHookDebug('afterDeleteTeamHook', {
		organizationId: data.organization.id,
		teamId: data.team.id,
		userId: data.user?.id,
	})
	return Promise.resolve()
}

export function beforeAddTeamMemberHook(data: {
	teamMember: Pick<HookTeamMember, 'teamId' | 'userId'> & HookData
	team: HookTeam
	user: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<{ data: HookData } | void> {
	if (
		data.team.organizationId !== data.organization.id ||
		data.teamMember.teamId !== data.team.id
	) {
		throwApiError(
			'BAD_REQUEST',
			'Team member must belong to the target organization team',
			'TEAM_ORGANIZATION_MISMATCH'
		)
	}
	return Promise.resolve()
}

export function afterAddTeamMemberHook(data: {
	teamMember: HookTeamMember
	team: HookTeam
	user: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<void> {
	logHookDebug('afterAddTeamMemberHook', {
		organizationId: data.organization.id,
		teamId: data.team.id,
		teamMemberId: data.teamMember.id,
		userId: data.user.id,
	})
	return Promise.resolve()
}

export function beforeRemoveTeamMemberHook(data: {
	teamMember: HookTeamMember
	team: HookTeam
	user: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<void> {
	logHookDebug('beforeRemoveTeamMemberHook', {
		organizationId: data.organization.id,
		teamId: data.team.id,
		teamMemberId: data.teamMember.id,
		userId: data.user.id,
	})
	return Promise.resolve()
}

export function afterRemoveTeamMemberHook(data: {
	teamMember: HookTeamMember
	team: HookTeam
	user: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<void> {
	logHookDebug('afterRemoveTeamMemberHook', {
		organizationId: data.organization.id,
		teamId: data.team.id,
		teamMemberId: data.teamMember.id,
		userId: data.user.id,
	})
	return Promise.resolve()
}

export function beforeCreateInvitationHook(data: {
	invitation: HookInvitation
	inviter: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<{ data: HookData } | void> {
	const email = readRequiredString(
		data.invitation.email,
		'Invitation email is required',
		'INVALID_INVITATION_EMAIL'
	).toLowerCase()

	return Promise.resolve({
		data: {
			...data.invitation,
			email,
			role: data.invitation.role ?? 'member',
		},
	})
}

export function afterCreateInvitationHook(data: {
	invitation: HookInvitation
	inviter: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<void> {
	logHookDebug('afterCreateInvitationHook', {
		invitationId: data.invitation.id,
		organizationId: data.organization.id,
		inviterId: data.inviter.id,
		teamId: data.invitation.teamId,
	})
	return Promise.resolve()
}

export function beforeAcceptInvitationHook(data: {
	invitation: HookInvitation
	user: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<void> {
	logHookDebug('beforeAcceptInvitationHook', {
		invitationId: data.invitation.id,
		organizationId: data.organization.id,
		userId: data.user.id,
	})
	return Promise.resolve()
}

export function afterAcceptInvitationHook(data: {
	invitation: HookInvitation
	member: HookMember
	user: HookUser
	organization: Pick<HookWorkspace, 'id'>
}): Promise<void> {
	logHookDebug('afterAcceptInvitationHook', {
		invitationId: data.invitation.id,
		memberId: data.member.id,
		organizationId: data.organization.id,
		teamId: data.invitation.teamId,
		userId: data.user.id,
	})
	return Promise.resolve()
}
