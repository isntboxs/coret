export interface WelcomeProgress {
	profileCompletedAt: Date | null
	invitationsCompletedAt: Date | null
	githubCompletedAt: Date | null
	githubSkippedAt: Date | null
	subscriptionsCompletedAt: Date | null
	finishedAt: Date | null
}

export const WELCOME_TOTAL_STEPS = 4

export function getCurrentWelcomeStep(progress: WelcomeProgress) {
	if (!progress.profileCompletedAt) return 1
	if (!progress.invitationsCompletedAt) return 2
	if (!progress.githubCompletedAt && !progress.githubSkippedAt) return 3
	if (!progress.subscriptionsCompletedAt) return 4

	return WELCOME_TOTAL_STEPS
}

export function isWelcomeFinished(progress: WelcomeProgress) {
	return Boolean(progress.finishedAt)
}

export function parseInviteEmails(emailsText: string) {
	const seen = new Set<string>()
	const invalid: Array<string> = []
	const emails: Array<string> = []

	for (const rawPart of emailsText.split(',')) {
		const email = rawPart.trim().toLowerCase()
		if (!email) continue

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			invalid.push(rawPart.trim())
			continue
		}

		if (seen.has(email)) continue
		seen.add(email)
		emails.push(email)
	}

	return { emails, invalid }
}
