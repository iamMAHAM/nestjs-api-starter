import { describe, expect, it } from 'vitest';
import { resolveRequestId } from './request-id.js';

describe('resolveRequestId', () => {
	it('keeps a well-formed inbound id', () => {
		expect(resolveRequestId('3f1c-abc_def.42')).toBe('3f1c-abc_def.42');
	});

	it.each([
		['a line break', 'abc\ninjected'],
		['an oversized value', 'a'.repeat(129)],
		['a repeated header', ['a', 'b']],
		['no header', undefined],
	])('replaces %s', (_label, inbound) => {
		const id = resolveRequestId(inbound);
		expect(id).not.toBe(inbound);
		expect(id).toMatch(/^[0-9a-f-]{36}$/);
	});
});
