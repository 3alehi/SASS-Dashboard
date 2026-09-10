import closeWithGrace from 'close-with-grace';

import { buildApp } from '@/app.js';
import { env } from '@/config/env.js';

async function start() {
  const app = await buildApp();

  closeWithGrace({ delay: 5000 }, async ({ err }) => {
    if (err) {
      app.log.error({ err }, 'Server closing due to error');
    }
    await app.close();
  });

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
  } catch (error) {
    app.log.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

start();
