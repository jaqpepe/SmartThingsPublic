# PokéGrader AI

Professional Pokémon TCG card grading analysis powered by Claude Vision AI.
Upload front and back card images to receive a detailed PSA & TAG-style grading report.

---

## Features

- **Dual-image analysis** — Front and back images analyzed simultaneously
- **TAG-style report card** — Four sub-grade scores: Centering, Surfaces, Edges, Corners
- **PSA grade estimation** — Mapped from TAG composite using official standards
- **Defect annotation map** — Visual overlay with hover tooltips for each defect
- **Centering visualizer** — Border measurement diagram with PSA tolerance reference
- **Export to PNG** — Download a styled report card at 800px width
- **Mobile responsive** — Works on tablets and phones

---

## Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org)
- **Anthropic API key** — [Get one here](https://console.anthropic.com)

---

## Installation

```bash
# 1. Navigate to the project directory
cd pokemon-grader

# 2. Install dependencies
npm install

# 3. Copy the environment file
cp .env.example .env

# 4. Add your Anthropic API key to .env
# Edit .env and replace "your_api_key_here" with your actual key

# 5. Start the development server
npm run dev
```

Open your browser to `http://localhost:3000`

---

## How to Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Navigate to **API Keys** in the sidebar
4. Click **Create Key**
5. Copy the key and paste it into your `.env` file as `VITE_ANTHROPIC_API_KEY`

---

## Usage

1. **Upload front image** — Drag & drop or click to upload the card face (JPG/PNG/WEBP, max 10MB)
2. **Upload back image** — Drag & drop or click to upload the card reverse
3. **Click "Begin Grading Analysis"** — Wait ~10-20 seconds for AI analysis
4. **Review the report** — See composite grade, sub-grades, defect map, and centering
5. **Export** — Click "Export Report" to download a PNG of the report card

### Photography Tips

- **Lighting**: Use diffused natural light or a softbox. Avoid direct flash.
- **Angle**: Shoot straight on, perpendicular to the card to avoid centering skew.
- **Resolution**: Use full camera resolution (300+ DPI equivalent).
- **Focus**: Ensure all four corners and edges are in sharp focus.
- **Background**: Use a neutral, contrasting background (white or dark).

---

## Understanding the Report

### TAG Sub-Grades

| Category   | Weight | What it measures |
|-----------|--------|-----------------|
| Corners   | 35%    | Sharpness and wear on all 8 corners (front + back) |
| Surfaces  | 35%    | Scratches, print defects, stains, indentations |
| Centering | 20%    | Border ratio (PSA 10 = 55/45 front, 75/25 back) |
| Edges     | 10%    | Roughness, whitening, and nicks on all 4 edges |

### PSA Grade Equivalents

| TAG Score | PSA Grade | Label     |
|-----------|-----------|-----------|
| 9.5–10.0  | PSA 10    | Gem Mint  |
| 9.0–9.4   | PSA 9     | Mint      |
| 8.0–8.9   | PSA 8     | NM-MT     |
| 7.0–7.9   | PSA 7     | Near Mint |
| 6.0–6.9   | PSA 6     | EX-MT     |

### Centering Thresholds

- **Gem Mint (PSA 10)**: 55/45 front (left/right and top/bottom), 75/25 back
- **Mint (PSA 9)**: 60/40 front, 75/25 back
- **NM-MT (PSA 8)**: 65/35 front, 80/20 back

---

## Known Limitations

- **AI vision accuracy**: The Claude Vision model analyzes JPEG-compressed images. Very subtle defects (micro-scratches, faint print lines) may not be detected.
- **Lighting dependency**: Poor lighting in photos will reduce accuracy. Holo scratches in particular require raking light to be visible.
- **Centering measurement**: Border width estimation from photos is approximate. Actual PSA/TAG measurements use physical tools.
- **Not a substitute**: This tool provides reference grades only. Official PSA/TAG grades require physical examination by certified graders.
- **API costs**: Each analysis call uses Claude claude-sonnet-4-20250514 vision tokens. Check [Anthropic pricing](https://www.anthropic.com/pricing) for cost estimates.

---

## Legal Disclaimer

PokéGrader AI is an **independent educational tool** created for reference purposes only.

- Not affiliated with, endorsed by, or connected to PSA (Professional Sports Authenticator) or TAG (Technical Authentication & Grading)
- Grade estimates are approximations and should not be used as the basis for financial transactions
- Pokémon and all related names are trademarks of Nintendo/Creatures Inc./GAME FREAK inc.
- Use at your own risk

---

## Tech Stack

- **React 18** + **Vite** — Frontend framework
- **Tailwind CSS** — Styling
- **Claude claude-sonnet-4-20250514** — AI vision analysis (Anthropic)
- **html2canvas** — Report export
- **lucide-react** — Icons

---

## Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run email server locally
npm run dev:server
```

---

## Email Mode Setup

Send a card photo to an email address and receive a full grading report in your inbox — no web browser required.

### Architecture

```
Your email → Resend inbound → Railway server → Claude Vision API → Resend outbound → Your inbox
```

**Services used:**

| Service | Role | Cost |
|---------|------|------|
| [Resend](https://resend.com) | Inbound + outbound email | Free (3,000/month) |
| [Railway](https://railway.app) | Hosts the Express server | $5/month (Hobby plan) |
| Anthropic API | AI card analysis | Pay-per-use |

---

### Step 1 — Create a Resend account

1. Go to [resend.com](https://resend.com) → Sign up free
2. Navigate to **Domains** → Add your domain and verify DNS records
   *(or use a Resend-provided subdomain for testing)*
3. Navigate to **API Keys** → Create a key with full access
4. Navigate to **Domains → [your domain] → Inbound**:
   - Enable inbound email
   - Set the MX records Resend shows you in your DNS provider
5. Navigate to **Webhooks** → Add Webhook:
   - URL: `https://your-app.railway.app/webhook/inbound`
   - Event: `email.received`

---

### Step 2 — Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create a new project (from the pokemon-grader directory)
cd pokemon-grader
railway new

# Link this directory to the project
railway link
```

Add environment variables in the Railway dashboard (**Settings → Variables**):

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `RESEND_API_KEY` | Your Resend API key |
| `FROM_EMAIL` | `grader@yourdomain.com` (verified in Resend) |

Then deploy:

```bash
railway up
```

Railway will detect the `railway.json` config and start `node server/index.js`.
The server runs on the port Railway assigns via `$PORT`.

Verify the deployment:
```bash
curl https://your-app.railway.app/health
# → {"status":"ok","service":"pokegrade-server"}
```

---

### Step 3 — Test it

Send an email to your inbound address (the address at your Resend inbound domain):

- **Subject**: anything (e.g., `Charizard Base Set Holo`)
- **Attachments**: exactly 2 image files (card front + card back)
  - Accepted formats: JPG, PNG, WEBP
  - Max size: 5MB each
- **Wait**: ~20–40 seconds for Claude to analyze and the reply to arrive

You will receive a reply with:
- TAG composite grade and four sub-grades
- PSA equivalent estimate
- Centering ratios
- Detected defects
- Analysis summary

---

### Step 4 — Validation error emails

If the submission is invalid, the sender receives an automated reply:

| Problem | Reply subject |
|---------|--------------|
| No attachments | "Missing card images" |
| Only 1 image | "Missing one card image" |
| More than 2 images | "Too many attachments" |
| Wrong file type | "Unsupported file type" |
| Image >5MB | "Image too large" |

---

### Local development

```bash
# Copy env file and fill in values
cp .env.example .env

# Run the server locally
npm run dev:server
# → Listening on http://localhost:3001

# Test the health endpoint
curl http://localhost:3001/health

# Test with a simulated Resend webhook (requires a real email_id from Resend)
curl -X POST http://localhost:3001/webhook/inbound \
  -H "Content-Type: application/json" \
  -d '{"type":"email.received","data":{"email_id":"re_test123","from":"test@example.com","subject":"Test Card"}}'
```

---

### Important Limits (Resend free plan)

- **3,000 emails/month combined** (inbound + outbound count together)
- **100 emails/day** combined
- Each graded card uses 2 email credits (1 inbound + 1 outbound reply)
- Effective free capacity: **~50 cards/day, ~1,500 cards/month**

---

*Generated by PokéGrader AI — For reference only*
