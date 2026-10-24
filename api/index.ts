import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../server.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Normalize URL path across Vercel rewrite headers
  const forwardedPath =
    (req.headers['x-forwarded-uri'] as string) ||
    (req.headers['x-invoke-path'] as string) ||
    (req.headers['x-now-route-matches'] as string) ||
    '';

  if (forwardedPath && forwardedPath.startsWith('/api')) {
    req.url = forwardedPath;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
}
