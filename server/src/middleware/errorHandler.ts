import type { NextFunction, Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `No route for ${req.method} ${req.path}`,
    code: 404,
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: 'BAD_REQUEST',
      message: 'Malformed JSON in request body.',
      code: 400,
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong. Please try again.',
    code: 500,
  });
}
