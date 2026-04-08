/**
 * Sends card images to Claude Vision API and returns a parsed grading JSON.
 */

const GRADING_PROMPT = `You are an expert Pokémon TCG card grader with 15+ years of experience,
certified in PSA and TAG grading methodologies. You are analyzing card
images (front and back) with extreme professional precision.

Return ONLY a valid JSON object with this exact structure — no markdown,
no preamble, no explanation outside the JSON:

{
  "card_info": {
    "name": "string",
    "set": "string",
    "number": "string",
    "is_holo": false,
    "is_reverse_holo": false,
    "language": "string"
  },
  "centering": {
    "front": {
      "left_right_ratio": "string",
      "top_bottom_ratio": "string",
      "score": 0,
      "within_gem_mint": false,
      "within_mint": false,
      "notes": "string"
    },
    "back": {
      "left_right_ratio": "string",
      "top_bottom_ratio": "string",
      "score": 0,
      "notes": "string"
    }
  },
  "corners": {
    "front_top_left":     { "grade": "string", "whitening": false, "severity": 1, "notes": "string" },
    "front_top_right":    { "grade": "string", "whitening": false, "severity": 1, "notes": "string" },
    "front_bottom_left":  { "grade": "string", "whitening": false, "severity": 1, "notes": "string" },
    "front_bottom_right": { "grade": "string", "whitening": false, "severity": 1, "notes": "string" },
    "back_top_left":      { "grade": "string", "whitening": false, "severity": 1, "notes": "string" },
    "back_top_right":     { "grade": "string", "whitening": false, "severity": 1, "notes": "string" },
    "back_bottom_left":   { "grade": "string", "whitening": false, "severity": 1, "notes": "string" },
    "back_bottom_right":  { "grade": "string", "whitening": false, "severity": 1, "notes": "string" },
    "overall_score": 0
  },
  "surfaces": {
    "front": {
      "holo_scratches":    { "count": 0, "severity": "string", "notes": "string" },
      "surface_scratches": { "count": 0, "severity": "string", "notes": "string" },
      "print_defects":     { "present": false, "description": "string" },
      "stains":            { "present": false, "description": "string" },
      "indentations":      { "present": false, "description": "string" },
      "score": 0
    },
    "back": {
      "holo_scratches":    { "count": 0, "severity": "string", "notes": "string" },
      "surface_scratches": { "count": 0, "severity": "string", "notes": "string" },
      "print_defects":     { "present": false, "description": "string" },
      "stains":            { "present": false, "description": "string" },
      "indentations":      { "present": false, "description": "string" },
      "score": 0
    },
    "overall_score": 0
  },
  "edges": {
    "top":    { "condition": "string", "whitening": false, "nicks": false, "score": 0 },
    "bottom": { "condition": "string", "whitening": false, "nicks": false, "score": 0 },
    "left":   { "condition": "string", "whitening": false, "nicks": false, "score": 0 },
    "right":  { "condition": "string", "whitening": false, "nicks": false, "score": 0 },
    "overall_score": 0
  },
  "grade_recommendation": {
    "tag_centering": 0,
    "tag_surfaces":  0,
    "tag_edges":     0,
    "tag_corners":   0,
    "tag_composite": 0,
    "psa_equivalent": 0,
    "confidence": "High",
    "grade_limiting_factors": [],
    "summary": "string"
  }
}

Grading scale:
- TAG: 10 (Gem Mint), 9.5, 9, 8.5, 8, 7, 6, 5, 4, 3, 2, 1
- PSA: 10 (Gem Mint), 9 (Mint), 8 (NM-MT), 7 (NM), 6 (EX-MT), 5 (EX), 4 (VG-EX)

Centering: PSA 10 = 55/45 front, 75/25 back. PSA 9 = 60/40 front.
Corner grades (exact terms): Gem Sharp / Slightly Fuzzy / Fuzzy / Rounded / Heavy Wear
Severity 1 = pristine, 10 = severe damage.
Be conservative. If uncertain, grade lower.
If image quality prevents assessment, set score to null and notes to "Unable to assess — image quality insufficient".
Never hallucinate defects.`;

async function analyzeCard(frontAttachment, backAttachment) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: frontAttachment.contentType,
                data: frontAttachment.data,
              },
            },
            { type: 'text', text: 'This is the FRONT of the card.' },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: backAttachment.contentType,
                data: backAttachment.data,
              },
            },
            {
              type: 'text',
              text: `This is the BACK of the card.\n\n${GRADING_PROMPT}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Claude API error ${response.status}: ${err?.error?.message || 'unknown'}`);
  }

  const data = await response.json();
  const text = (data.content || []).map(i => i.text || '').join('');

  // Strip any markdown fences the model might wrap around the JSON
  const jsonMatch = text.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');

  return JSON.parse(jsonMatch[0]);
}

module.exports = { analyzeCard };
