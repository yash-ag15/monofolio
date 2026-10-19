import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createGrokHandler } from './server/grok-proxy.js';

// Grok runs through /api/grok/* on this server, which holds the site owner's key (XAI_API_KEY in
// .env.local). Visitors never see or provide a key. In production the same handler runs in server.js.
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const grok = createGrokHandler(env);
  const grokPlugin = {
    name: 'grok-gateway',
    configureServer(server) {
      server.middlewares.use(grok);
    },
    configurePreviewServer(server) {
      server.middlewares.use(grok);
    },
  };
  return { plugins: [react(), grokPlugin] };
});
