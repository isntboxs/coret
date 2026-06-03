export const DEFAULT_AUTH_CALLBACK_URL = '/'

export function sanitizeAuthCallbackURL(value: unknown) {
	if (
		typeof value !== 'string' ||
		!value.startsWith('/') ||
		value.startsWith('//')
	) {
		return DEFAULT_AUTH_CALLBACK_URL
	}

	return value
}
