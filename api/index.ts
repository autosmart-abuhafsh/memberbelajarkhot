import type { Request, Response } from 'express';
import { appPromise } from '../server.js';

export default async function handler(req: Request, res: Response) {
  const app = await appPromise;
  return new Promise<void>((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('close', () => resolve());
    res.on('error', (err) => reject(err));
    app(req, res);
  });
}
