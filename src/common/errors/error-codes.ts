/**
 * Error codes are i18n keys in `namespace:KEY` form. They travel to the client
 * verbatim so a frontend can key off them without parsing prose, and they are
 * resolved to a localized message by `I18nService` on the way out.
 */
export const E = {
	// errors namespace — generic, cross-cutting
	INTERNAL_ERROR: 'errors:INTERNAL_ERROR',
	VALIDATION_FAILED: 'errors:VALIDATION_FAILED',
	RATE_LIMITED: 'errors:RATE_LIMITED',
	NOT_FOUND: 'errors:NOT_FOUND',
	FORBIDDEN: 'errors:FORBIDDEN',
	UNAUTHORIZED: 'errors:UNAUTHORIZED',

	// auth namespace
	NAME_INVALID: 'auth:NAME_INVALID',
	EMAIL_TAKEN: 'auth:EMAIL_TAKEN',
	INVALID_CREDENTIALS: 'auth:INVALID_CREDENTIALS',
	PASSWORD_TOO_SHORT: 'auth:PASSWORD_TOO_SHORT',
	PASSWORD_TOO_LONG: 'auth:PASSWORD_TOO_LONG',

	// users namespace
	USER_NOT_FOUND: 'users:USER_NOT_FOUND',
} as const;

export type ErrorCode = (typeof E)[keyof typeof E];
