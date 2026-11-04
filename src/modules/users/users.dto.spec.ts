import { describe, expect, it } from 'vitest';
import { updateMeSchema } from './users.dto.js';

describe('updateMeSchema', () => {
	it.each([
		'javascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'http://example.com/a.png',
	])('rejects %s as an avatar', (image) => {
		expect(updateMeSchema.safeParse({ image }).success).toBe(false);
	});

	it('accepts an https URL or null', () => {
		expect(
			updateMeSchema.safeParse({ image: 'https://example.com/a.png' }).success,
		).toBe(true);
		expect(updateMeSchema.safeParse({ image: null }).success).toBe(true);
	});
});
