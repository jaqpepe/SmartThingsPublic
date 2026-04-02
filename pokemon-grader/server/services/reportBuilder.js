/**
 * Builds the HTML grading report email from a Claude analysis JSON.
 * All CSS is inline for maximum email client compatibility.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score == null) return '#888888';
  if (score >= 9.5) return '#c9a84c'; // gold
  if (score >= 8.5) return '#c0c0c0'; // silver
  if (score >= 7.5) return '#5ba85b'; // green
  if (score >= 6.0) return '#e8c84a'; // yellow
  if (score >= 4.0) return '#e07830'; // orange
  return '#c03030';                    // red
}

function scoreBg(score) {
  if (score == null) return '#333333';
  if (score >= 9.5) return '#2a2010';
  if (score >= 8.5) return '#1e1e1e';
  if (score >= 7.5) return '#102010';
  if (score >= 6.0) return '#202010';
  if (score >= 4.0) return '#201508';
  return '#200808';
}

function psaLabel(n) {
  const labels = { 10: 'Gem Mint', 9: 'Mint', 8: 'NM-MT', 7: 'Near Mint',
    6: 'EX-MT', 5: 'Excellent', 4: 'VG-EX', 3: 'Very Good', 2: 'Good', 1: 'Poor' };
  return labels[n] || String(n);
}

function tagLabel(s) {
  if (s >= 10)  return 'Gem Mint';
  if (s >= 9.5) return 'Near Gem Mint';
  if (s >= 9)   return 'Mint';
  if (s >= 8.5) return 'NM-Mint+';
  if (s >= 8)   return 'NM-Mint';
  if (s >= 7)   return 'Near Mint';
  if (s >= 6)   return 'Excellent-Mint';
  if (s >= 5)   return 'Excellent';
  if (s >= 4)   return 'VG-Excellent';
  return 'Below VG';
}

function fmt(v) {
  if (v == null) return 'N/A';
  return typeof v === 'number' ? v.toFixed(1) : String(v);
}

// ── Sub-grade cell ────────────────────────────────────────────────────────────

function subGradeCell(label, score, weight) {
  const color  = scoreColor(score);
  const bg     = scoreBg(score);
  const barPct = score != null ? Math.round((score / 10) * 100) : 0;

  return `
    <td style="padding:12px;background:${bg};border:1px solid #333;vertical-align:top;width:50%">
      <div style="font-family:Arial,sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${label}</div>
      <div style="font-family:'Courier New',monospace;font-size:32px;font-weight:bold;color:${color};line-height:1">${fmt(score)}</div>
      <div style="font-family:Arial,sans-serif;font-size:11px;color:#aaa;margin-top:4px">${score != null ? tagLabel(score) : '—'}</div>
      <div style="background:#222;border-radius:3px;height:4px;margin-top:8px;overflow:hidden">
        <div style="background:${color};width:${barPct}%;height:4px;border-radius:3px"></div>
      </div>
      <div style="font-family:Arial,sans-serif;font-size:10px;color:#555;margin-top:4px">${weight} weight</div>
    </td>`;
}

// ── Defects list ──────────────────────────────────────────────────────────────

function defectsList(analysis) {
  const items = [];

  // Corners
  const cornerKeys = [
    ['front_top_left', 'Front TL'], ['front_top_right', 'Front TR'],
    ['front_bottom_left', 'Front BL'], ['front_bottom_right', 'Front BR'],
    ['back_top_left', 'Back TL'], ['back_top_right', 'Back TR'],
    ['back_bottom_left', 'Back BL'], ['back_bottom_right', 'Back BR'],
  ];
  for (const [key, lbl] of cornerKeys) {
    const c = analysis.corners?.[key];
    if (c && c.severity > 2) {
      items.push(`<span style="color:#e07050">◆ Corner ${lbl}</span>: ${c.grade}${c.whitening ? ', whitening' : ''}`);
    }
  }

  // Surfaces
  for (const side of ['front', 'back']) {
    const s = analysis.surfaces?.[side];
    if (!s) continue;
    if (s.holo_scratches?.count > 0)
      items.push(`<span style="color:#e09050">◆ ${side} holo scratches</span>: ${s.holo_scratches.count}× (${s.holo_scratches.severity})`);
    if (s.surface_scratches?.count > 0)
      items.push(`<span style="color:#e09050">◆ ${side} surface scratches</span>: ${s.surface_scratches.count}× (${s.surface_scratches.severity})`);
    if (s.print_defects?.present)
      items.push(`<span style="color:#e09050">◆ ${side} print defects</span>: ${s.print_defects.description}`);
    if (s.stains?.present)
      items.push(`<span style="color:#e09050">◆ ${side} staining</span>: ${s.stains.description}`);
    if (s.indentations?.present)
      items.push(`<span style="color:#e09050">◆ ${side} indentations</span>: ${s.indentations.description}`);
  }

  // Edges
  for (const edge of ['top', 'bottom', 'left', 'right']) {
    const e = analysis.edges?.[edge];
    if (e && (e.whitening || e.nicks || (e.score != null && e.score < 8))) {
      const issues = [e.condition];
      if (e.whitening) issues.push('whitening');
      if (e.nicks) issues.push('nicks');
      items.push(`<span style="color:#e0c050">◆ ${edge} edge</span>: ${issues.join(', ')}`);
    }
  }

  if (items.length === 0) {
    return '<p style="font-family:Arial,sans-serif;font-size:13px;color:#5ba85b;margin:0">✓ No significant defects detected</p>';
  }

  return items.map(i =>
    `<p style="font-family:'Courier New',monospace;font-size:12px;color:#ccc;margin:4px 0 0 0">${i}</p>`
  ).join('');
}

// ── Centering section ─────────────────────────────────────────────────────────

function centeringSection(centering) {
  if (!centering) return '';
  const fc = centering.front;
  const bc = centering.back;

  const gemMint = fc?.within_gem_mint
    ? '<span style="color:#5ba85b">✓ Gem Mint (55/45)</span>'
    : fc?.within_mint
    ? '<span style="color:#e0c050">~ Mint (60/40)</span>'
    : '<span style="color:#e05050">✗ Outside Mint threshold</span>';

  return `
    <tr>
      <td style="padding:6px 0">
        <span style="font-family:Arial,sans-serif;font-size:12px;color:#888">Front L/R:</span>
        <span style="font-family:'Courier New',monospace;font-size:13px;color:#ddd;margin-left:8px">${fc?.left_right_ratio || 'N/A'}</span>
      </td>
      <td style="padding:6px 0">
        <span style="font-family:Arial,sans-serif;font-size:12px;color:#888">Front T/B:</span>
        <span style="font-family:'Courier New',monospace;font-size:13px;color:#ddd;margin-left:8px">${fc?.top_bottom_ratio || 'N/A'}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:6px 0">
        <span style="font-family:Arial,sans-serif;font-size:12px;color:#888">Back L/R:</span>
        <span style="font-family:'Courier New',monospace;font-size:13px;color:#ddd;margin-left:8px">${bc?.left_right_ratio || 'N/A'}</span>
      </td>
      <td style="padding:6px 0">
        ${gemMint}
      </td>
    </tr>`;
}

// ── Main builder ──────────────────────────────────────────────────────────────

function buildReportEmail(report, recipientEmail) {
  const gr   = report.grade_recommendation || {};
  const ci   = report.card_info || {};

  const composite  = gr.tag_composite  ?? 0;
  const psaEquiv   = gr.psa_equivalent ?? 1;
  const confidence = gr.confidence     || 'Low';
  const summary    = gr.summary        || '';
  const factors    = gr.grade_limiting_factors || [];

  const subGrades = {
    centering: gr.tag_centering ?? 0,
    surfaces:  gr.tag_surfaces  ?? 0,
    edges:     gr.tag_edges     ?? 0,
    corners:   gr.tag_corners   ?? 0,
  };

  const compositeColor = scoreColor(composite);
  const confidenceColor = confidence === 'High' ? '#5ba85b' : confidence === 'Medium' ? '#e0c050' : '#e07050';

  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const badges = [
    ci.is_holo         && '<span style="background:#4a1a6a;color:#cc88ff;padding:2px 8px;border-radius:3px;font-size:11px;font-family:Arial,sans-serif">HOLO</span>',
    ci.is_reverse_holo && '<span style="background:#1a3a6a;color:#88aaff;padding:2px 8px;border-radius:3px;font-size:11px;font-family:Arial,sans-serif">REV HOLO</span>',
    ci.language && ci.language !== 'English' && `<span style="background:#333;color:#aaa;padding:2px 8px;border-radius:3px;font-size:11px;font-family:Arial,sans-serif">${ci.language}</span>`,
  ].filter(Boolean).join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:20px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- HEADER -->
  <tr>
    <td style="background:linear-gradient(135deg,#12121a,#1a1a26);border:1px solid #c9a84c;border-bottom:none;padding:28px 32px;border-radius:12px 12px 0 0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#c9a84c;letter-spacing:1px">
              Poké<span style="color:#e8e8e8">Grader</span> AI
            </div>
            <div style="font-family:Arial,sans-serif;font-size:11px;color:#666;margin-top:4px;letter-spacing:2px;text-transform:uppercase">
              Professional Card Analysis
            </div>
          </td>
          <td align="right" style="font-family:'Courier New',monospace;font-size:11px;color:#555">
            ${now}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CARD INFO + COMPOSITE -->
  <tr>
    <td style="background:#12121a;border-left:1px solid #c9a84c;border-right:1px solid #c9a84c;padding:24px 32px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top">
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#e8e8e8">
              ${ci.name || 'Unknown Card'}
            </div>
            <div style="font-family:'Courier New',monospace;font-size:13px;color:#c9a84c;margin-top:6px">
              ${ci.set || 'Unknown Set'}${ci.number ? ` · #${ci.number}` : ''}
            </div>
            <div style="margin-top:8px">${badges}</div>
          </td>
          <td align="right" style="vertical-align:top">
            <table cellpadding="0" cellspacing="0" style="border-collapse:collapse" align="right">
              <tr>
                <td style="background:${compositeColor};padding:16px 20px;border-radius:10px;text-align:center">
                  <div style="font-family:'Courier New',monospace;font-size:40px;font-weight:bold;color:#0a0a0f;line-height:1">
                    ${fmt(composite)}
                  </div>
                  <div style="font-family:Arial,sans-serif;font-size:10px;color:#0a0a0f;opacity:0.7;margin-top:4px;letter-spacing:1px;text-transform:uppercase">
                    TAG Composite
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:8px">
                  <div style="font-family:Arial,sans-serif;font-size:12px;color:#888">
                    ${tagLabel(composite)}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- SUB-GRADES 2×2 -->
  <tr>
    <td style="background:#0f0f18;border-left:1px solid #c9a84c;border-right:1px solid #c9a84c;padding:4px 32px 0">
      <div style="font-family:Arial,sans-serif;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;padding:12px 0 8px">Sub-Grade Breakdown</div>
      <table width="100%" cellpadding="0" cellspacing="4">
        <tr>
          ${subGradeCell('Centering', subGrades.centering, '20%')}
          ${subGradeCell('Surfaces',  subGrades.surfaces,  '35%')}
        </tr>
        <tr style="height:4px"><td colspan="2"></td></tr>
        <tr>
          ${subGradeCell('Edges',   subGrades.edges,   '10%')}
          ${subGradeCell('Corners', subGrades.corners, '35%')}
        </tr>
      </table>
    </td>
  </tr>

  <!-- PSA EQUIVALENT + CONFIDENCE -->
  <tr>
    <td style="background:#12121a;border-left:1px solid #c9a84c;border-right:1px solid #c9a84c;padding:20px 32px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border:1px solid #c9a84c44;border-radius:8px;padding:16px;background:#1a1600">
            <div style="font-family:Arial,sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">
              PSA Equivalent Estimate
            </div>
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#c9a84c">
              PSA ${psaEquiv} — ${psaLabel(psaEquiv)}
            </div>
          </td>
          <td width="16"></td>
          <td style="border:1px solid #33333366;border-radius:8px;padding:16px;background:#111118;vertical-align:top;width:140px">
            <div style="font-family:Arial,sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">
              Confidence
            </div>
            <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:bold;color:${confidenceColor}">
              ${confidence}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CENTERING -->
  <tr>
    <td style="background:#0f0f18;border-left:1px solid #c9a84c;border-right:1px solid #c9a84c;padding:0 32px 20px">
      <div style="font-family:Arial,sans-serif;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;padding:16px 0 8px">Centering</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${centeringSection(report.centering)}
      </table>
    </td>
  </tr>

  <!-- DEFECTS -->
  <tr>
    <td style="background:#12121a;border-left:1px solid #c9a84c;border-right:1px solid #c9a84c;padding:0 32px 20px">
      <div style="font-family:Arial,sans-serif;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;padding:16px 0 8px">Detected Defects</div>
      ${defectsList(report)}
    </td>
  </tr>

  ${factors.length > 0 ? `
  <!-- LIMITING FACTORS -->
  <tr>
    <td style="background:#180a0a;border-left:1px solid #c9a84c;border-right:1px solid #c9a84c;border-top:1px solid #3a1a1a;padding:0 32px 20px">
      <div style="font-family:Arial,sans-serif;font-size:11px;color:#e07050;text-transform:uppercase;letter-spacing:2px;padding:16px 0 8px">⚠ Grade Limiting Factors</div>
      ${factors.map(f => `<p style="font-family:'Courier New',monospace;font-size:12px;color:#cc8888;margin:3px 0">▪ ${f}</p>`).join('')}
    </td>
  </tr>` : ''}

  ${summary ? `
  <!-- SUMMARY -->
  <tr>
    <td style="background:#0f0f18;border-left:1px solid #c9a84c;border-right:1px solid #c9a84c;padding:0 32px 20px">
      <div style="font-family:Arial,sans-serif;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;padding:16px 0 8px">Analysis Summary</div>
      <p style="font-family:'Courier New',monospace;font-size:12px;color:#aaa;line-height:1.7;margin:0">${summary}</p>
    </td>
  </tr>` : ''}

  <!-- FOOTER -->
  <tr>
    <td style="background:#0a0a0f;border:1px solid #c9a84c33;border-top:1px solid #c9a84c55;padding:20px 32px;border-radius:0 0 12px 12px">
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#444;text-align:center;margin:0;line-height:1.6">
        Generated by <strong style="color:#666">PokéGrader AI</strong> — For educational reference only.<br>
        Not affiliated with PSA (Professional Sports Authenticator) or TAG.<br>
        Never make financial decisions based solely on this analysis.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Error email builder ───────────────────────────────────────────────────────

function buildErrorEmail(title, message) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#0a0a0f;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
  <tr>
    <td style="background:#12121a;border:1px solid #c9a84c55;border-radius:10px;padding:32px">
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#c9a84c;margin-bottom:16px">
        PokéGrader AI
      </div>
      <div style="font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#e8e8e8;margin-bottom:12px">
        ${title}
      </div>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#aaa;line-height:1.6;margin:0 0 20px">
        ${message}
      </p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#555;margin:0">
        Reply to this email if you need help.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

module.exports = { buildReportEmail, buildErrorEmail };
