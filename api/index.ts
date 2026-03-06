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
  const app = await getApp();
  app.server.emit('request', req, res);
};
