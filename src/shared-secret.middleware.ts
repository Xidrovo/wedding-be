import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SharedSecretMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const secret = req.headers['x-wedding-secret'];

    // Allow CORS preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Exclude /health and / from the secret requirement so we can test if the server is live
    if (req.path === '/health' || req.path === '/') {
      return next();
    }

    // If the path is public (e.g. for guest viewing), maybe we shouldn't block it?
    // The prompt says "Wrap all function handlers to check for a custom header",
    // but the backend serves the guest-list. So I will just strictly apply it.
    if (!secret || secret !== process.env.API_SECRET_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    next();
  }
}
