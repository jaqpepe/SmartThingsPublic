# Email Integration Research

*Research compiled for PokéGrader AI Email Pipeline — Phase 1*

---

## 1. Resend Inbound Email

### Status
Resend launched inbound email in **November 2025**. It is a fully supported production feature.

### How It Works
1. Configure an inbound domain (your own or a Resend subdomain) — point MX records to Resend.
2. In the Resend dashboard → **Webhooks → Add Webhook**, set your endpoint and select `email.received`.
3. When email arrives, Resend fires a POST to your webhook with **metadata only**.
4. Your server calls `GET /emails/receiving/{email_id}` to fetch the full email including attachment metadata.
5. Each attachment has a `download_url` — your server fetches the binary from that URL.

### Webhook Payload (`email.received` — metadata only)
```json
{
  "type": "email.received",
  "created_at": "2025-11-01T12:00:00.000Z",
  "data": {
    "email_id": "re_abc123",
    "created_at": "2025-11-01T12:00:00.000Z",
    "from": "sender@example.com",
    "to": ["you@yourdomain.com"],
    "subject": "Hello"
  }
}
```

### Full Email Fetch (`GET /emails/receiving/{email_id}`)
Returns: `from`, `to`, `cc`, `bcc`, `subject`, `html`, `text`, `headers`, and attachment metadata.

### Attachment Object (from Attachments API)
```json
{
  "id": "att_xyz",
  "filename": "card-front.jpg",
  "content_type": "image/jpeg",
  "size": 204800,
  "download_url": "https://..."
}
```
Attachments are **not inline base64** — they are downloaded via `download_url`.

### Free Plan Limits
- **3,000 emails/month combined** (sent + received counts together)
- **100 emails/day** combined
- 1 domain per team on free plan
- 1 day of log/data retention
- Attachments supported on all plans

---

## 2. Mailgun Inbound Email

### Status
Mailgun inbound routes (webhooks) require **Foundation plan at $35/month** minimum.
The free/Flex plans do **not** include inbound routing. Not suitable for zero-cost setup.

### Attachment Handling (for reference)
Mailgun delivers multipart/form-data with raw binary attachment parts (`attachment-1`, `attachment-2`, ...).
HMAC-SHA256 signature verification available.

---

## 3. Railway

### Plans (2025)

| Plan | Cost | Credit/month | Sleep? |
|------|------|--------------|--------|
| Trial | $0 | $5 one-time (30 days) | No |
| Hobby | $5/month | $5 credit | No |
| Pro | $20/month | $20 credit | No |

### Key Facts
- **No sleep on Hobby plan** — services are always-on (unlike Render free tier)
- Hobby plan: up to 8GB RAM, 8 vCPU per service, no hourly caps
- A minimal Express.js server (~128MB RAM) costs ~$0.90–$1.50/month in compute
- $5 monthly credit comfortably covers a low-traffic webhook server
- No free tier anymore — minimum $5/month for persistent hosting

---

## 4. Resend Outbound Email

### Free Plan Limits
- **3,000 emails/month** (shared with inbound)
- **100 emails/day**
- Full HTML support + attachments (max 40MB total)
- `html` and `text` fields in same API call

---

## 5. Architecture Decision

**Use Resend for both inbound and outbound.** Reasons:
- Free tier supports both directions
- Single service to manage
- Mailgun inbound requires $35/month

### Important Implementation Note
Resend inbound delivers **metadata-only webhooks**. The server must:
1. Receive webhook → respond 200 immediately
2. Call `GET https://api.resend.com/emails/receiving/{email_id}` with API key to get full email
3. Call attachment download URLs to fetch binary data
4. Convert binary to base64 before sending to Claude API

This two-step fetch must happen asynchronously after responding 200 (to meet <3s webhook response requirement).

---

## 6. Recommended Stack

| Layer | Service | Cost |
|-------|---------|------|
| Inbound email | Resend inbound | Free (3K/month shared) |
| Outbound email | Resend API | Free (3K/month shared) |
| Server hosting | Railway Hobby | $5/month |
| AI analysis | Anthropic Claude API | Pay-per-use |

*Sources: resend.com/docs, docs.railway.com, mailgun.com/pricing — verified April 2026*
