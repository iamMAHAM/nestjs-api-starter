import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export const resolveRequestId = (inbound: unknown): string =>
	typeof inbound === 'string' && SAFE_REQUEST_ID.test(inbound)
		? inbound
		: randomUUID();
