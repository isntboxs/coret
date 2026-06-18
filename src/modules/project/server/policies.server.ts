import '@tanstack/react-start/server-only'

export interface ProjectTeamAssociationPolicyResource {
	teamVisibility: 'public' | 'private'
	isTeamMember: boolean
}

export function canViewProjectTeamAssociation(
	resource: ProjectTeamAssociationPolicyResource
) {
	if (resource.teamVisibility === 'public') return true

	return resource.isTeamMember
}
