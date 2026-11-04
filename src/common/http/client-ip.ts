import type { NextFunction, Request, Response } from 'express';

export const CLIENT_IP_HEADER = 'x-client-ip';

// Better Auth only sees headers: hand it `req.ip` (which honours TRUST_PROXY)
// instead of a spoofable X-Forwarded-For.
export const clientIpMiddleware = (
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	delete req.headers[CLIENT_IP_HEADER];
	if (req.ip) req.headers[CLIENT_IP_HEADER] = req.ip;
	next();
};
