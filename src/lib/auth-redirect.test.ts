import { describe, expect, it } from 'vitest'

import { sanitizeAuthCallbackURL } from '#/lib/auth-redirect'

describe('sanitizeAuthCallbackURL', () => {
	it('keeps same-origin relative callback URLs', () => {
		expect(sanitizeAuthCallbackURL('/')).toBe('/')
		expect(sanitizeAuthCallbackURL('/issues?view=mine')).toBe(
			'/issues?view=mine'
		)
	})

	it('falls back for missing, external, or protocol-relative URLs', () => {
		expect(sanitizeAuthCallbackURL(undefined)).toBe('/')
		expect(sanitizeAuthCallbackURL('https://evil.example')).toBe('/')
		expect(sanitizeAuthCallbackURL('//evil.example')).toBe('/')
	})
})
