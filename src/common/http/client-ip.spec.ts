import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { CLIENT_IP_HEADER, clientIpMiddleware } from './client-ip.js';

const run = (ip: string | undefined, headers: Record<string, string> = {}) => {
	const req = { ip, headers: { ...headers } } as unknown as Request;
	const next = vi.fn();
	clientIpMiddleware(req, {} as Response, next);
	expect(next).toHaveBeenCalledOnce();
	return req.headers[CLIENT_IP_HEADER];
};

describe('clientIpMiddleware', () => {
	it('overwrites a client-supplied value with req.ip', () => {
		expect(run('203.0.113.7', { [CLIENT_IP_HEADER]: '1.2.3.4' })).toBe(
			'203.0.113.7',
		);
	});

	it('drops a client-supplied value when req.ip is unknown', () => {
		expect(run(undefined, { [CLIENT_IP_HEADER]: '1.2.3.4' })).toBeUndefined();
	});
});
