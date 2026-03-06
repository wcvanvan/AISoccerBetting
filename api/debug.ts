import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  const info: Record<string, unknown> = {
    dirname: __dirname,
    cwd: process.cwd(),
    nodeVersion: process.version,
    env: {
      READONLY_MODE: process.env.READONLY_MODE,
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  // Try importing server
  try {
    const serverMod = await import('../src/web/server');
    info.serverImport = 'OK';
    info.serverKeys = Object.keys(serverMod);
  } catch (err: unknown) {
    info.serverImport = 'FAILED';
    info.serverError = err instanceof Error ? err.stack : String(err);
  }

  res.status(200).json(info);
};
