/**
 * PSA ↔ TAG mapping and grade reference tables
 */

export const PSA_GRADES = [
  {
    grade: 10,
    label: 'Gem Mint',
    description: 'A virtually perfect card. Well-centered with four sharp corners, free of stains. No breaks in surface gloss. Print is crisp and register is perfect. The card must be free of any defects.',
    centeringFront: '55/45',
    centeringBack: '75/25',
    surfaceRequirement: 'No scratches, print lines or loss of luster',
    cornerRequirement: 'Four sharp corners',
    edgeRequirement: 'No roughness or chipping',
  },
  {
    grade: 9,
    label: 'Mint',
    description: 'A near-perfect card. Virtually the same as a Gem Mint card, with one minor flaw. The flaw may be a very slight wax stain on reverse, a minor print imperfection, or slightly off-center.',
    centeringFront: '60/40',
    centeringBack: '75/25',
    surfaceRequirement: 'Minor surface wear allowed',
    cornerRequirement: 'Four sharp corners with possible minor imperfection',
    edgeRequirement: 'Minimal roughness',
  },
  {
    grade: 8,
    label: 'NM-MT',
    description: 'A near-mint to mint card. Slightly off-center with one or two corners showing slight wear. Surface has minor scratches but is not noticeable. Print lines may be present.',
    centeringFront: '65/35',
    centeringBack: '80/20',
    surfaceRequirement: 'Minor surface scratches allowed',
    cornerRequirement: 'Slight wear on one or two corners',
    edgeRequirement: 'Slight roughness',
  },
  {
    grade: 7,
    label: 'Near Mint',
    description: 'A card with one to three surface marks, moderate centering, or a small print defect. Corners and edges may show slight wear.',
    centeringFront: '70/30',
    centeringBack: '85/15',
    surfaceRequirement: 'Light surface scratches',
    cornerRequirement: 'Slight wear on corners',
    edgeRequirement: 'Moderate roughness',
  },
  {
    grade: 6,
    label: 'EX-MT',
    description: 'Slight surface wear visible upon close inspection. Corners have slight rounding. Edges may be slightly rough.',
    centeringFront: '75/25',
    centeringBack: '90/10',
    surfaceRequirement: 'Some surface wear',
    cornerRequirement: 'Slight rounding',
    edgeRequirement: 'Roughness present',
  },
  {
    grade: 5,
    label: 'Excellent',
    description: 'Borders may be off-white or slightly yellowed. Moderate rounding of corners. Surface shows light play wear.',
    centeringFront: '80/20',
    centeringBack: '90/10',
    surfaceRequirement: 'Moderate surface wear',
    cornerRequirement: 'Moderate rounding',
    edgeRequirement: 'Some roughness and nicks',
  },
  {
    grade: 4,
    label: 'VG-EX',
    description: 'Obvious surface wear on entire card. Moderate rounding of corners with moderate layering. Off-center.',
    centeringFront: 'Heavy',
    centeringBack: 'Heavy',
    surfaceRequirement: 'Heavy surface wear',
    cornerRequirement: 'Heavy rounding',
    edgeRequirement: 'Heavy roughness',
  },
  {
    grade: 3,
    label: 'Very Good',
    description: 'Moderate rounding of corners, light creasing, possibly some staining.',
    centeringFront: 'Severe',
    centeringBack: 'Severe',
    surfaceRequirement: 'Heavy wear with creases',
    cornerRequirement: 'Heavy rounding and layering',
    edgeRequirement: 'Heavy roughness',
  },
  {
    grade: 2,
    label: 'Good',
    description: 'Shows considerable wear. Creases, stains, and moderate rounding of corners.',
    centeringFront: 'Severe',
    centeringBack: 'Severe',
    surfaceRequirement: 'Creases and stains',
    cornerRequirement: 'Severe rounding',
    edgeRequirement: 'Severe damage',
  },
  {
    grade: 1,
    label: 'Poor',
    description: 'A card that has been heavily played and shows heavy wear. Soiling, staining, and damage throughout.',
    centeringFront: 'Extreme',
    centeringBack: 'Extreme',
    surfaceRequirement: 'Heavy damage throughout',
    cornerRequirement: 'Severely rounded or missing',
    edgeRequirement: 'Extremely rough or damaged',
  },
];

export const TAG_GRADES = [
  { grade: 10, label: 'Gem Mint', description: 'Perfect or near-perfect card. Virtually no imperfections detectable.' },
  { grade: 9.5, label: 'Gem Mint+', description: 'Exceptional card with very minor, virtually invisible imperfections.' },
  { grade: 9, label: 'Mint', description: 'Excellent card with minor, barely noticeable imperfections.' },
  { grade: 8.5, label: 'Near Mint-Mint+', description: 'High grade card with minimal wear.' },
  { grade: 8, label: 'Near Mint-Mint', description: 'Card showing minor wear visible under close inspection.' },
  { grade: 7, label: 'Near Mint', description: 'Card showing moderate wear or slight defects.' },
  { grade: 6, label: 'Excellent-Mint', description: 'Card showing light wear with some minor defects.' },
  { grade: 5, label: 'Excellent', description: 'Card showing moderate surface wear.' },
  { grade: 4, label: 'Very Good-Excellent', description: 'Card showing heavy surface wear and edge roughness.' },
  { grade: 3, label: 'Very Good', description: 'Card with heavy wear, creases, or staining.' },
  { grade: 2, label: 'Good', description: 'Card with severe damage or wear.' },
  { grade: 1, label: 'Poor', description: 'Card in the worst possible condition.' },
];

export const TAG_WEIGHTS = {
  corners: 0.35,
  surfaces: 0.35,
  centering: 0.20,
  edges: 0.10,
};

export const CENTERING_THRESHOLDS = {
  front: {
    gemMint: 55,   // 55/45 max for PSA 10
    mint: 60,       // 60/40 max for PSA 9
    nmMt: 65,
    nm: 70,
    exMt: 75,
  },
  back: {
    gemMint: 60,
    mint: 65,
    nmMt: 70,
    nm: 75,
    exMt: 80,
  },
};

/**
 * Get PSA grade recommendation text based on TAG composite score
 */
export function getPSARecommendationText(psaGrade) {
  const grade = PSA_GRADES.find(g => g.grade === psaGrade);
  if (!grade) return `PSA ${psaGrade}`;
  return `PSA ${psaGrade} (${grade.label})`;
}

/**
 * Get color theme for a grade level
 */
export function getGradeTheme(psaGrade) {
  if (psaGrade >= 10) return {
    bg: 'from-purple-900 via-pink-800 to-yellow-700',
    text: 'text-yellow-300',
    border: 'border-yellow-400',
    badge: 'grade-badge-10',
    glow: 'rgba(201, 168, 76, 0.6)',
  };
  if (psaGrade >= 9) return {
    bg: 'from-yellow-900 to-yellow-700',
    text: 'text-yellow-300',
    border: 'border-yellow-500',
    badge: 'grade-badge-9',
    glow: 'rgba(201, 168, 76, 0.5)',
  };
  if (psaGrade >= 8) return {
    bg: 'from-gray-700 to-gray-600',
    text: 'text-gray-200',
    border: 'border-gray-400',
    badge: 'grade-badge-8',
    glow: 'rgba(192, 192, 192, 0.4)',
  };
  return {
    bg: 'from-orange-900 to-yellow-900',
    text: 'text-orange-300',
    border: 'border-orange-600',
    badge: 'grade-badge-low',
    glow: 'rgba(184, 115, 51, 0.4)',
  };
}
