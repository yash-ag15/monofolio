// All /api routes: accounts + saved data (auth.js) and the AI gateway (ai-proxy.js).
// AI requests need a signed-in user, so the owner's key can't be used anonymously.
import { createAuth } from './auth.js';
import { createAiHandler } from './ai-proxy.js';

export function createApi(env = process.env) {
  const auth = createAuth(env);
  const ai = createAiHandler(env);
  return function api(req, res, next) {
    auth.handler(req, res, async () => {
      if (req.url.startsWith('/api/ai/chat') && !(await auth.userFrom(req))) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Please sign in to use AI.' }));
      }
      ai(req, res, next);
    });
  };
}
