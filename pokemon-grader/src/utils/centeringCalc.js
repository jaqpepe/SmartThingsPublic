/**
 * Centering calculation utilities
 * Centering % = larger border / (larger border + smaller border) * 100
 */

/**
 * Parse a ratio string like "52/48" or "55/45" into { larger, smaller, ratio }
 */
export function parseRatioString(ratioStr) {
  if (!ratioStr || typeof ratioStr !== 'string') return null;
  const parts = ratioStr.trim().split('/');
  if (parts.length !== 2) return null;
  const a = parseFloat(parts[0]);
  const b = parseFloat(parts[1]);
  if (isNaN(a) || isNaN(b)) return null;
  const larger = Math.max(a, b);
  const smaller = Math.min(a, b);
  return {
    larger,
    smaller,
    ratio: larger / (larger + smaller),
    formatted: `${larger}/${smaller}`,
  };
}

/**
 * Get centering status for PSA thresholds
 * Returns: 'gem_mint' | 'mint' | 'near_mint' | 'off_center' | 'badly_off'
 */
export function getCenteringStatus(ratioStr, isFront = true) {
  const parsed = parseRatioString(ratioStr);
  if (!parsed) return 'unknown';

  const { larger } = parsed;

  if (isFront) {
    // Front centering: PSA 10 = 55/45, PSA 9 = 60/40
    if (larger <= 55) return 'gem_mint';
    if (larger <= 60) return 'mint';
    if (larger <= 65) return 'near_mint';
    if (larger <= 70) return 'off_center';
    return 'badly_off';
  } else {
    // Back centering: more lenient, PSA allows up to 75/25
    if (larger <= 60) return 'gem_mint';
    if (larger <= 65) return 'mint';
    if (larger <= 70) return 'near_mint';
    if (larger <= 75) return 'off_center';
    return 'badly_off';
  }
}

export function getCenteringStatusLabel(status) {
  const labels = {
    gem_mint: 'Gem Mint',
    mint: 'Mint',
    near_mint: 'Near Mint',
    off_center: 'Off Center',
    badly_off: 'Badly Off Center',
    unknown: 'Unknown',
  };
  return labels[status] || 'Unknown';
}

export function getCenteringStatusColor(status) {
  const colors = {
    gem_mint: '#22c55e',    // green
    mint: '#84cc16',        // lime
    near_mint: '#eab308',   // yellow
    off_center: '#f97316',  // orange
    badly_off: '#ef4444',   // red
    unknown: '#6b7280',     // gray
  };
  return colors[status] || '#6b7280';
}

/**
 * Calculate visual border widths as percentages of total dimension
 * For use in the CenteringVisualizer component
 * Returns border widths as percentages of total card dimension
 */
export function calcBorderWidths(ratioStr) {
  const parsed = parseRatioString(ratioStr);
  if (!parsed) return { first: 50, second: 50 };

  // Total = 100%, split by ratio
  const total = parsed.larger + parsed.smaller;
  return {
    first: (parsed.larger / total) * 100,
    second: (parsed.smaller / total) * 100,
  };
}

/**
 * Extract all centering data from analysis for visualization
 */
export function extractCenteringData(centering) {
  if (!centering) return null;

  return {
    front: {
      leftRight: parseRatioString(centering.front?.left_right_ratio),
      topBottom: parseRatioString(centering.front?.top_bottom_ratio),
      score: centering.front?.score,
      withinGemMint: centering.front?.within_gem_mint,
      withinMint: centering.front?.within_mint,
      notes: centering.front?.notes,
      lrStatus: getCenteringStatus(centering.front?.left_right_ratio, true),
      tbStatus: getCenteringStatus(centering.front?.top_bottom_ratio, true),
    },
    back: {
      leftRight: parseRatioString(centering.back?.left_right_ratio),
      topBottom: parseRatioString(centering.back?.top_bottom_ratio),
      score: centering.back?.score,
      notes: centering.back?.notes,
      lrStatus: getCenteringStatus(centering.back?.left_right_ratio, false),
      tbStatus: getCenteringStatus(centering.back?.top_bottom_ratio, false),
    },
  };
}
