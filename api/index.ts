import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../src/web/server';

let appPromise: ReturnType<typeof createServer> | undefined;

function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const app = await createServer();
      await app.ready();
      return app;
    })();
  }
  return appPromise;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const app = await getApp();
    app.server.emit('request', req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.stack || err.message : String(err);
    console.error('Serverless function error:', message);
    res.status(500).json({ error: message });
  }
};
