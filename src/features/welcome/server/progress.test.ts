import { describe, expect, it } from 'vitest'

import {
	WELCOME_TOTAL_STEPS,
	getCurrentWelcomeStep,
	isWelcomeFinished,
	parseInviteEmails,
} from '#/features/welcome/server/progress'
import type { WelcomeProgress } from '#/features/welcome/server/progress'

function progress(overrides: Partial<WelcomeProgress> = {}): WelcomeProgress {
	return {
		profileCompletedAt: null,
		invitationsCompletedAt: null,
		githubCompletedAt: null,
		githubSkippedAt: null,
		slackSkippedAt: null,
		subscriptionsCompletedAt: null,
		finishedAt: null,
		...overrides,
	}
}

describe('welcome progress', () => {
	it('derives the first incomplete welcome step', () => {
		const now = new Date('2026-06-17T01:00:00.000Z')

		expect(getCurrentWelcomeStep(progress())).toBe(1)
		expect(getCurrentWelcomeStep(progress({ profileCompletedAt: now }))).toBe(2)
		expect(
			getCurrentWelcomeStep(
				progress({
					profileCompletedAt: now,
					invitationsCompletedAt: now,
				})
			)
		).toBe(3)
		expect(
			getCurrentWelcomeStep(
				progress({
					profileCompletedAt: now,
					invitationsCompletedAt: now,
					githubSkippedAt: now,
				})
			)
		).toBe(4)
		expect(
			getCurrentWelcomeStep(
				progress({
					profileCompletedAt: now,
					invitationsCompletedAt: now,
					githubCompletedAt: now,
					slackSkippedAt: now,
				})
			)
		).toBe(5)
		expect(
			getCurrentWelcomeStep(
				progress({
					profileCompletedAt: now,
					invitationsCompletedAt: now,
					githubCompletedAt: now,
					slackSkippedAt: now,
					subscriptionsCompletedAt: now,
				})
			)
		).toBe(WELCOME_TOTAL_STEPS)
	})

	it('uses finishedAt as the finished marker', () => {
		expect(isWelcomeFinished(progress())).toBe(false)
		expect(isWelcomeFinished(progress({ finishedAt: new Date() }))).toBe(true)
	})

	it('parses comma-separated invite emails', () => {
		expect(
			parseInviteEmails(
				'Ada@example.com, grace@example.com, ada@example.com, invalid'
			)
		).toEqual({
			emails: ['ada@example.com', 'grace@example.com'],
			invalid: ['invalid'],
		})
	})

	it('treats empty invite input as an empty invite list', () => {
		expect(parseInviteEmails(' ,  , ')).toEqual({
			emails: [],
			invalid: [],
		})
	})
})
