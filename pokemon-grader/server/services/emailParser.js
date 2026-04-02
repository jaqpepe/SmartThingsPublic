/**
 * Parses inbound email webhook payloads from Resend.
 *
 * Resend inbound flow (two-step):
 *   1. Webhook fires with metadata only (email_id, from, subject).
 *   2. Server fetches full email via GET /emails/receiving/{id}.
 *   3. Server downloads each attachment from its download_url.
 *
 * Returns a normalised object:
 * {
 *   sender:      string,          // reply-to address
 *   subject:     string,
 *   attachments: Array<{
 *     filename:    string,
 *     contentType: string,
 *     data:        string,        // base64-encoded bytes
 *   }>
 * }
 */

/**
 * Parse the initial Resend webhook body to extract email_id + quick metadata.
 */
function parseWebhookMeta(body) {
  if (body.type === 'email.received' && body.data?.email_id) {
    return {
      emailId:  body.data.email_id,
      sender:   extractAddress(body.data.from || ''),
      subject:  body.data.subject || '(no subject)',
    };
  }
  throw new Error(`Unrecognised webhook payload (type="${body.type || 'unknown'}")`);
}

/**
 * Fetch full email + attachment data from Resend API.
 * Returns the normalised { sender, subject, attachments } object.
 */
async function fetchFullEmail(emailId) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  // ── 1. Fetch email metadata (includes attachment list with download_urls) ──
  const emailRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!emailRes.ok) {
    const err = await emailRes.json().catch(() => ({}));
    throw new Error(`Resend email fetch ${emailRes.status}: ${err?.message || 'unknown'}`);
  }

  const email = await emailRes.json();

  const sender  = extractAddress(email.from || '');
  const subject = email.subject || '(no subject)';
  const rawAtts = email.attachments || [];

  // ── 2. Download each attachment binary and convert to base64 ──────────────
  const attachments = await Promise.all(
    rawAtts.map(att => downloadAttachment(att))
  );

  return { sender, subject, attachments };
}

/**
 * Download a single attachment from its download_url and return normalised form.
 */
async function downloadAttachment(att) {
  if (!att.download_url) {
    throw new Error(`Attachment "${att.filename}" has no download_url`);
  }

  const res = await fetch(att.download_url, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`Attachment download failed ${res.status} for "${att.filename}"`);
  }

  const buffer = await res.arrayBuffer();
  const data   = Buffer.from(buffer).toString('base64');

  return {
    filename:    att.filename    || 'attachment',
    contentType: normaliseContentType(att.content_type || att.contentType || 'image/jpeg'),
    data,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractAddress(raw) {
  const match = raw.match(/<([^>]+)>/);
  if (match) return match[1].trim();
  return raw.replace(/[<>]/g, '').trim();
}

function normaliseContentType(ct) {
  const map = { 'image/jpg': 'image/jpeg' };
  const base = ct.toLowerCase().split(';')[0].trim();
  return map[base] || base;
}

module.exports = { parseWebhookMeta, fetchFullEmail };
