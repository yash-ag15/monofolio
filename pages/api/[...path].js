// Every /api/* request: accounts + saved data (Neon) and the AI gateway — see server/api.js.
// The handlers read the raw request body and stream AI responses themselves, so Next's body parser is off.
import { createApi } from '../../server/api.js';

const api = createApi(process.env);

export const config = {
  api: { bodyParser: false, responseLimit: false, externalResolver: true },
  maxDuration: 60, // AI page builds can take a while (Vercel function time limit, in seconds)
};

export default function handler(req, res) {
  return api(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}
