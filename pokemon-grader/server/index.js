/**
 * PokéGrader AI — Express server
 * Handles inbound email webhooks and replies with grading reports.
 */

require('dotenv').config();

const express    = require('express');
const inboundRouter = require('./routes/inbound.js');

// ── Validate required env vars at startup ─────────────────────────────────────
const required = ['ANTHROPIC_API_KEY', 'RESEND_API_KEY', 'FROM_EMAIL'];
const missing  = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[startup] Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// ── App ───────────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;

// Parse JSON and urlencoded bodies (Resend/Mailgun may use either)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check (Railway uses this for deployment verification)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pokegrade-server', ts: new Date().toISOString() });
});

// Inbound email webhook
app.use('/', inboundRouter);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  // Never expose internal error details to callers
  console.error('[server] unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] PokéGrader AI listening on port ${PORT}`);
  console.log(`[server] Health: http://localhost:${PORT}/health`);
  console.log(`[server] Webhook: http://localhost:${PORT}/webhook/inbound`);
});
