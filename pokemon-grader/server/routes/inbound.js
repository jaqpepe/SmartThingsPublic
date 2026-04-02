/**
 * POST /webhook/inbound
 *
 * Receives the Resend `email.received` webhook, fetches the full email
 * (including attachment downloads), runs Claude analysis, and replies
 * with the grading report.
 *
 * The webhook is acknowledged immediately (200) and all heavy work
 * happens asynchronously — this satisfies the <3s response requirement.
 */

const express = require('express');
const router  = express.Router();

const { parseWebhookMeta, fetchFullEmail }        = require('../services/emailParser.js');
const { validateAttachments, getErrorMessage }    = require('../utils/validators.js');
const { analyzeCard }                             = require('../services/claudeAnalysis.js');
const { buildReportEmail }                        = require('../services/reportBuilder.js');
const { sendReportEmail, sendErrorReply, sendSystemErrorReply } = require('../services/emailSender.js');

router.post('/webhook/inbound', async (req, res) => {
  // ── 1. Acknowledge immediately (Resend retries on non-2xx) ───────────────
  res.status(200).json({ received: true });

  // ── 2. Parse webhook metadata ─────────────────────────────────────────────
  let meta;
  try {
    meta = parseWebhookMeta(req.body);
  } catch (parseErr) {
    console.error('[inbound] webhook parse error:', parseErr.message);
    return;
  }

  const { emailId, sender, subject } = meta;
  console.log(`[inbound] received email_id=${emailId} from=${sender} subject="${subject}"`);

  // ── 3. Fetch full email + download attachments from Resend API ───────────
  let fullEmail;
  try {
    fullEmail = await fetchFullEmail(emailId);
  } catch (fetchErr) {
    console.error('[inbound] email fetch error:', fetchErr.message);
    await sendSystemErrorReply(sender, subject).catch(e =>
      console.error('[inbound] error sending system error reply:', e.message),
    );
    return;
  }

  const { attachments } = fullEmail;
  console.log(`[inbound] fetched ${attachments.length} attachment(s) for ${sender}`);

  // ── 4. Validate attachments ───────────────────────────────────────────────
  const validation = validateAttachments(attachments);
  if (!validation.ok) {
    const { subject: errSubj, body: errBody } = getErrorMessage(validation.message);
    console.log(`[inbound] validation failed: ${validation.message} → sending error reply to ${sender}`);
    await sendErrorReply(sender, validation.message, errSubj, errBody).catch(e =>
      console.error('[inbound] error sending validation reply:', e.message),
    );
    return;
  }

  // ── 5. Run Claude analysis ────────────────────────────────────────────────
  let report;
  try {
    console.log(`[inbound] starting Claude analysis for ${sender}`);
    report = await analyzeCard(attachments[0], attachments[1]);
    console.log(`[inbound] analysis complete, card="${report?.card_info?.name}" composite=${report?.grade_recommendation?.tag_composite}`);
  } catch (aiErr) {
    console.error('[inbound] Claude analysis error:', aiErr.message);
    await sendSystemErrorReply(sender, subject).catch(e =>
      console.error('[inbound] error sending system error reply:', e.message),
    );
    return;
  }

  // ── 6. Build HTML email ───────────────────────────────────────────────────
  let html;
  try {
    html = buildReportEmail(report, sender);
  } catch (buildErr) {
    console.error('[inbound] report build error:', buildErr.message);
    await sendSystemErrorReply(sender, subject).catch(() => {});
    return;
  }

  // ── 7. Send reply ─────────────────────────────────────────────────────────
  try {
    await sendReportEmail(sender, subject, html);
    console.log(`[inbound] report sent to ${sender}`);
  } catch (sendErr) {
    console.error('[inbound] email send error:', sendErr.message);
  }
});

module.exports = router;
