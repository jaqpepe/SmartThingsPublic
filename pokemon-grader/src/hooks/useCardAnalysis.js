import { useState, useCallback } from 'react';
import { calculateTAGSubGrades, calculateTAGComposite, mapToPSA } from '../utils/gradingLogic.js';

const ANALYSIS_PROMPT = `You are an expert Pokémon TCG card grader with 15+ years of experience,
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
    "front_top_left":     { "grade": "string", "whitening": false, "severity": 0, "notes": "string" },
    "front_top_right":    { "grade": "string", "whitening": false, "severity": 0, "notes": "string" },
    "front_bottom_left":  { "grade": "string", "whitening": false, "severity": 0, "notes": "string" },
    "front_bottom_right": { "grade": "string", "whitening": false, "severity": 0, "notes": "string" },
    "back_top_left":      { "grade": "string", "whitening": false, "severity": 0, "notes": "string" },
    "back_top_right":     { "grade": "string", "whitening": false, "severity": 0, "notes": "string" },
    "back_bottom_left":   { "grade": "string", "whitening": false, "severity": 0, "notes": "string" },
    "back_bottom_right":  { "grade": "string", "whitening": false, "severity": 0, "notes": "string" },
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
    "tag_surfaces": 0,
    "tag_edges": 0,
    "tag_corners": 0,
    "tag_composite": 0,
    "psa_equivalent": 0,
    "confidence": "High",
    "grade_limiting_factors": [],
    "summary": "string"
  }
}

Grading scale reference:
- TAG: 10 (Gem Mint), 9.5, 9, 8.5, 8, 7, 6, 5, 4, 3, 2, 1
- PSA: 10 (Gem Mint), 9 (Mint), 8 (NM-MT), 7 (NM), 6 (EX-MT), 5 (EX), 4 (VG-EX)

Centering tolerances:
- PSA 10 (Gem Mint): 55/45 front left-right, 55/45 front top-bottom, 75/25 back
- PSA 9 (Mint): 60/40 front, 75/25 back
- Report ratio as "larger/smaller" e.g. "52/48" or "58/42"

Corner grades (use exactly these terms):
- Gem Sharp: No visible wear, perfectly sharp point
- Slightly Fuzzy: Very minor fraying at tip, barely noticeable
- Fuzzy: Visible fraying/fuzzing at corner tip
- Rounded: Definite rounding of corner
- Heavy Wear: Severe rounding, splitting, or damage

Severity scale for all defects: 1 = pristine/none, 10 = severe damage

Rules:
- Be conservative. When in doubt, grade lower.
- Identify ALL defects visible, no matter how minor.
- If an area cannot be assessed due to image quality, set score to null and notes to "Unable to assess — image quality insufficient".
- Never hallucinate defects. Only report what is clearly visible.
- For holo cards, carefully examine the holo surface for scratches under simulated lighting.
- Factor back centering into overall centering score.`;

function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Remove data URL prefix to get just base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMediaType(file) {
  const typeMap = {
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp',
  };
  return typeMap[file.type] || 'image/jpeg';
}

export function useCardAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const analyzeCards = useCallback(async (frontFile, backFile) => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      setError('API key not found. Please add VITE_ANTHROPIC_API_KEY to your .env file.');
      return;
    }

    if (!frontFile || !backFile) {
      setError('Both front and back images are required for analysis.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      setProgress('Preparing images...');
      const [frontBase64, backBase64] = await Promise.all([
        imageToBase64(frontFile),
        imageToBase64(backFile),
      ]);

      setProgress('Sending to AI grading engine...');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: ANALYSIS_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: getMediaType(frontFile),
                    data: frontBase64,
                  },
                },
                {
                  type: 'text',
                  text: 'This is the FRONT of the card.',
                },
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: getMediaType(backFile),
                    data: backBase64,
                  },
                },
                {
                  type: 'text',
                  text: 'This is the BACK of the card. Please analyze both images and return the complete grading JSON.',
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorType = errorData?.error?.type || '';
        const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;

        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your VITE_ANTHROPIC_API_KEY.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 400 && errorType === 'invalid_request_error') {
          throw new Error('Invalid request. The images may be too large or in an unsupported format.');
        } else {
          throw new Error(`Analysis failed: ${errorMsg}`);
        }
      }

      setProgress('Processing grading results...');

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) {
        throw new Error('No response received from AI analysis engine.');
      }

      // Extract JSON from response (handle any surrounding text)
      let jsonStr = content.trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      let rawAnalysis;
      try {
        rawAnalysis = JSON.parse(jsonStr);
      } catch {
        throw new Error('Failed to parse grading response. Please try again.');
      }

      setProgress('Calculating final scores...');

      // Calculate TAG sub-grades if not provided by AI or to cross-check
      const subGrades = calculateTAGSubGrades(rawAnalysis);
      const composite = calculateTAGComposite(subGrades);
      const psaEquivalent = mapToPSA(composite);

      const enrichedAnalysis = {
        ...rawAnalysis,
        _computed: {
          subGrades,
          composite,
          psaEquivalent,
        },
        _images: {
          front: URL.createObjectURL(frontFile),
          back: URL.createObjectURL(backFile),
        },
        _timestamp: new Date().toISOString(),
      };

      setAnalysis(enrichedAnalysis);
      setProgress('');
    } catch (err) {
      // Don't expose raw error details that might contain API info
      const safeMessage = err.message.replace(/sk-ant-[\w-]+/g, '[REDACTED]');
      setError(safeMessage);
      setProgress('');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setProgress('');
  }, []);

  return {
    analyzeCards,
    resetAnalysis,
    isAnalyzing,
    analysis,
    error,
    progress,
  };
}
