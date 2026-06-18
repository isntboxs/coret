export const DEFAULT_AUTH_CALLBACK_URL = '/'

export function sanitizeAuthCallbackURL(value: string | undefined) {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return DEFAULT_AUTH_CALLBACK_URL
	}

	return value
}
