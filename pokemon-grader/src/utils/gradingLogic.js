/**
 * Grading Logic — PSA & TAG score calculation algorithms
 * Based on official PSA and TAG grading standards
 */

/**
 * Calculate centering score from ratio strings like "52/48" or "55/45"
 * PSA Gem Mint (10): 55/45 front, 75/25 back
 * PSA Mint (9): 60/40 front, 75/25 back
 */
export function calcCenteringScore(centering) {
  if (!centering) return 5;

  const parseRatio = (ratioStr) => {
    if (!ratioStr || typeof ratioStr !== 'string') return null;
    const parts = ratioStr.split('/');
    if (parts.length !== 2) return null;
    const a = parseFloat(parts[0]);
    const b = parseFloat(parts[1]);
    if (isNaN(a) || isNaN(b)) return null;
    return Math.max(a, b); // Return the larger value (e.g., 55 from "55/45")
  };

  const frontLR = parseRatio(centering.front?.left_right_ratio);
  const frontTB = parseRatio(centering.front?.top_bottom_ratio);
  const backLR = parseRatio(centering.back?.left_right_ratio);

  // Use worst centering measurement
  const measurements = [frontLR, frontTB, backLR].filter(v => v !== null);
  if (measurements.length === 0) return 5;

  const worstRatio = Math.max(...measurements);

  // TAG centering scores based on deviation from perfect 50/50
  // Perfect 50/50 = 10, 55/45 threshold = 9+, 60/40 = 8+, 65/35 = 7, etc.
  if (worstRatio <= 51) return 10;
  if (worstRatio <= 53) return 9.5;
  if (worstRatio <= 55) return 9;
  if (worstRatio <= 57) return 8.5;
  if (worstRatio <= 60) return 8;
  if (worstRatio <= 63) return 7;
  if (worstRatio <= 65) return 6;
  if (worstRatio <= 70) return 5;
  if (worstRatio <= 75) return 4;
  return 3;
}

/**
 * Calculate surface score from front and back surface analysis
 */
export function calcSurfaceScore(surfaces) {
  if (!surfaces) return 5;

  const frontScore = surfaces.front?.score ?? 5;
  const backScore = surfaces.back?.score ?? 5;
  const overallScore = surfaces.overall_score;

  if (overallScore != null) return overallScore;
  return (frontScore + backScore) / 2;
}

/**
 * Calculate edge score from all 4 edges
 */
export function calcEdgeScore(edges) {
  if (!edges) return 5;
  if (edges.overall_score != null) return edges.overall_score;

  const edgeScores = [
    edges.top?.score,
    edges.bottom?.score,
    edges.left?.score,
    edges.right?.score,
  ].filter(s => s != null);

  if (edgeScores.length === 0) return 5;
  // Weighted toward worst edge
  const sorted = [...edgeScores].sort((a, b) => a - b);
  return sorted[0] * 0.4 + sorted.slice(1).reduce((a, b) => a + b, 0) / sorted.slice(1).length * 0.6;
}

/**
 * Calculate corner score from all 8 corners
 */
export function calcCornerScore(corners) {
  if (!corners) return 5;
  if (corners.overall_score != null) return corners.overall_score;

  const cornerKeys = [
    'front_top_left', 'front_top_right', 'front_bottom_left', 'front_bottom_right',
    'back_top_left', 'back_top_right', 'back_bottom_left', 'back_bottom_right',
  ];

  const gradeMap = {
    'Gem Sharp': 10,
    'gem sharp': 10,
    'Sharp': 10,
    'Slightly Fuzzy': 8,
    'slightly fuzzy': 8,
    'Slight Fuzzing': 8.5,
    'slight fuzzing': 8.5,
    'Fuzzy': 6,
    'fuzzy': 6,
    'Fuzzing': 6,
    'Rounded': 4,
    'rounded': 4,
    'Heavy Wear': 2,
    'heavy wear': 2,
    'Heavy Rounding': 2,
    'heavy rounding': 2,
  };

  const cornerScores = cornerKeys
    .map(key => {
      const corner = corners[key];
      if (!corner) return null;
      // Use severity inverse if available (severity 1 = best, 10 = worst)
      if (corner.severity != null) return 10 - (corner.severity - 1);
      // Fall back to grade string mapping
      const gradeStr = corner.grade;
      if (gradeStr) {
        for (const [pattern, score] of Object.entries(gradeMap)) {
          if (gradeStr.toLowerCase().includes(pattern.toLowerCase())) return score;
        }
      }
      return null;
    })
    .filter(s => s != null);

  if (cornerScores.length === 0) return 5;

  // Worst corner has heavy influence
  const sorted = [...cornerScores].sort((a, b) => a - b);
  const worstTwo = sorted.slice(0, 2);
  const rest = sorted.slice(2);

  const worstAvg = worstTwo.reduce((a, b) => a + b, 0) / worstTwo.length;
  const restAvg = rest.length > 0 ? rest.reduce((a, b) => a + b, 0) / rest.length : worstAvg;

  return worstAvg * 0.6 + restAvg * 0.4;
}

/**
 * TAG composite weighted average:
 * Corners:   35%
 * Surfaces:  35%
 * Centering: 20%
 * Edges:     10%
 */
export function calculateTAGSubGrades(analysis) {
  if (!analysis) return null;

  const centering = calcCenteringScore(analysis.centering);
  const surfaces = calcSurfaceScore(analysis.surfaces);
  const edges = calcEdgeScore(analysis.edges);
  const corners = calcCornerScore(analysis.corners);

  return {
    centering: roundToHalf(centering),
    surfaces: roundToHalf(surfaces),
    edges: roundToHalf(edges),
    corners: roundToHalf(corners),
  };
}

export function calculateTAGComposite(subGrades) {
  if (!subGrades) return null;
  const { centering, surfaces, edges, corners } = subGrades;
  const composite =
    corners * 0.35 +
    surfaces * 0.35 +
    centering * 0.20 +
    edges * 0.10;
  return roundToHalf(composite);
}

function roundToHalf(num) {
  return Math.round(num * 2) / 2;
}

/**
 * Maps TAG composite score to PSA equivalent
 * Based on cross-referencing grading standards
 */
export function mapToPSA(tagScore) {
  if (tagScore >= 9.5) return 10;
  if (tagScore >= 9.0) return 9;
  if (tagScore >= 8.0) return 8;
  if (tagScore >= 7.0) return 7;
  if (tagScore >= 6.0) return 6;
  if (tagScore >= 5.0) return 5;
  if (tagScore >= 4.0) return 4;
  if (tagScore >= 3.0) return 3;
  if (tagScore >= 2.0) return 2;
  return 1;
}

export function getPSALabel(psaGrade) {
  const labels = {
    10: 'Gem Mint',
    9: 'Mint',
    8: 'NM-MT',
    7: 'Near Mint',
    6: 'EX-MT',
    5: 'Excellent',
    4: 'VG-EX',
    3: 'Very Good',
    2: 'Good',
    1: 'Poor',
  };
  return labels[psaGrade] || 'Unknown';
}

export function getTAGLabel(tagScore) {
  if (tagScore >= 10) return 'Gem Mint';
  if (tagScore >= 9.5) return 'Gem Mint+';
  if (tagScore >= 9) return 'Mint';
  if (tagScore >= 8.5) return 'Near Mint-Mint+';
  if (tagScore >= 8) return 'Near Mint-Mint';
  if (tagScore >= 7) return 'Near Mint';
  if (tagScore >= 6) return 'Excellent-Mint';
  if (tagScore >= 5) return 'Excellent';
  if (tagScore >= 4) return 'Very Good-Excellent';
  if (tagScore >= 3) return 'Very Good';
  return 'Poor';
}

export function getGradeBadgeClass(score) {
  if (score >= 9.5) return 'grade-badge-10';
  if (score >= 8.5) return 'grade-badge-9';
  if (score >= 7.5) return 'grade-badge-8';
  return 'grade-badge-low';
}

export function getScoreColor(score) {
  if (score >= 9.5) return '#c9a84c'; // Gold — gem mint
  if (score >= 8.5) return '#c0c0c0'; // Silver — mint
  if (score >= 7.5) return '#a8c8e8'; // Light blue — NM-MT
  if (score >= 6.5) return '#8fcf8f'; // Green — NM
  if (score >= 5.5) return '#cfcf8f'; // Yellow — EX-MT
  if (score >= 4.5) return '#e8a05a'; // Orange — EX
  return '#b87333'; // Copper — low
}

export function getScoreStatusColor(score, max = 10) {
  const pct = score / max;
  if (pct >= 0.95) return 'text-yellow-400';
  if (pct >= 0.85) return 'text-gray-300';
  if (pct >= 0.75) return 'text-blue-300';
  if (pct >= 0.65) return 'text-green-400';
  if (pct >= 0.55) return 'text-yellow-300';
  return 'text-orange-400';
}

export function getLetterGrade(score) {
  if (score >= 9.5) return 'A+';
  if (score >= 9.0) return 'A';
  if (score >= 8.5) return 'A-';
  if (score >= 8.0) return 'B+';
  if (score >= 7.0) return 'B';
  if (score >= 6.0) return 'B-';
  if (score >= 5.0) return 'C';
  if (score >= 4.0) return 'D';
  return 'F';
}

export function getConfidenceColor(confidence) {
  switch (confidence) {
    case 'High': return 'text-green-400';
    case 'Medium': return 'text-yellow-400';
    case 'Low': return 'text-orange-400';
    default: return 'text-gray-400';
  }
}
