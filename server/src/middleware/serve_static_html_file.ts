import type { Request, Response } from 'express';
import path from 'path';

export function serveStaticHtmlFile() {
  return (_req: Request, res: Response) => res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
}
