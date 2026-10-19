// Copies pdf.js's worker into public/ so the resume importer can load it from /pdf.worker.min.mjs.
// Runs automatically before `npm run dev` and `npm run build`.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const src = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');
fs.mkdirSync('public', { recursive: true });
fs.copyFileSync(src, 'public/pdf.worker.min.mjs');
