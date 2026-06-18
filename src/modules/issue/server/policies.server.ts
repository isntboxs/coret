import '@tanstack/react-start/server-only'

export interface IssuePolicySubject {
	userId: string
}

export interface IssuePolicyResource {
	teamVisibility: 'public' | 'private'
	isTeamMember: boolean
}

export function canViewIssue(
	_subject: IssuePolicySubject,
	resource: IssuePolicyResource
) {
	if (resource.teamVisibility === 'public') return true

	return resource.isTeamMember
}
