// Vercel serverless entrypoint. Vercel's Node runtime accepts an exported
// (req, res) handler — an Express app already has that shape, so this just
// re-exports the same app that `npm start` runs locally, unmodified.
export { default } from '../server/server.js';
