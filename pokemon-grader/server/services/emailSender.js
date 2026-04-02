/**
 * Sends emails via the Resend API.
 * https://resend.com/docs/api-reference/emails/send-email
 */

const FROM_EMAIL = process.env.FROM_EMAIL || 'grader@yourdomain.com';
const FROM_NAME  = 'PokéGrader AI';

async function sendEmail({ to, subject, html, replyTo }) {
  const body = {
    from:    `${FROM_NAME} <${FROM_EMAIL}>`,
    to:      [to],
    subject,
    html,
  };
  if (replyTo) body.reply_to = replyTo;

  const response = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Resend API error ${response.status}: ${err?.message || 'unknown'}`);
  }

  return response.json();
}

async function sendReportEmail(to, originalSubject, html) {
  const re = originalSubject.toLowerCase().startsWith('re:') ? '' : 'Re: ';
  return sendEmail({
    to,
    subject: `${re}${originalSubject} — Grading Report`,
    html,
  });
}

async function sendErrorReply(to, errorCode, errorSubject, errorBody) {
  const { buildErrorEmail } = require('./reportBuilder.js');
  return sendEmail({
    to,
    subject: errorSubject,
    html:    buildErrorEmail(errorSubject, errorBody),
  });
}

async function sendSystemErrorReply(to, originalSubject) {
  const { buildErrorEmail } = require('./reportBuilder.js');
  return sendEmail({
    to,
    subject: 'Grading temporarily unavailable — PokéGrader AI',
    html: buildErrorEmail(
      'Grading temporarily unavailable',
      'Our AI analysis service is temporarily unavailable. Please try again in a few minutes. ' +
      'If the problem persists, contact support.',
    ),
  });
}

module.exports = { sendReportEmail, sendErrorReply, sendSystemErrorReply };
