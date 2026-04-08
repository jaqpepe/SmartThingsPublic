import { extractCenteringData, getCenteringStatusColor, getCenteringStatusLabel } from '../utils/centeringCalc.js';

const THRESHOLDS = [
  { label: 'PSA 10 — Gem Mint', ratio: '55/45', color: '#22c55e' },
  { label: 'PSA 9  — Mint',     ratio: '60/40', color: '#84cc16' },
  { label: 'PSA 8  — NM-MT',   ratio: '65/35', color: '#eab308' },
  { label: 'PSA 7  — NM',      ratio: '70/30', color: '#f97316' },
];

/**
 * Renders a card image with centering measurement lines overlaid.
 * leftRight / topBottom are { larger, smaller, formatted } objects.
 */
function CardWithOverlay({ title, imageUrl, leftRight, topBottom, lrStatus, tbStatus, notes }) {
  if (!leftRight || !topBottom) return null;

  const lrTotal   = leftRight.larger + leftRight.smaller;
  const leftPct   = (leftRight.smaller / lrTotal) * 100;   // narrower side = left
  const rightPct  = (leftRight.larger  / lrTotal) * 100;

  const tbTotal   = topBottom.larger + topBottom.smaller;
  const topPct    = (topBottom.smaller / tbTotal) * 100;
  const bottomPct = (topBottom.larger  / tbTotal) * 100;

  const lrColor = getCenteringStatusColor(lrStatus);
  const tbColor = getCenteringStatusColor(tbStatus);
  const lrLabel = getCenteringStatusLabel(lrStatus);
  const tbLabel = getCenteringStatusLabel(tbStatus);

  // Content-area inner bounds as CSS percentages
  const innerLeft   = leftPct;
  const innerTop    = topPct;
  const innerRight  = rightPct;
  const innerBottom = bottomPct;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-mono text-platinum/70 uppercase tracking-wider text-center">{title}</h4>

      {/* Image + overlay container */}
      <div className="relative mx-auto rounded-xl overflow-hidden shadow-2xl border border-platinum/10"
           style={{ width: 200, aspectRatio: '63/88' }}>

        {/* Card image */}
        {imageUrl
          ? <img src={imageUrl} alt={`Card ${title}`}
                 className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-charcoal-surface flex items-center justify-center">
              <span className="text-platinum/20 text-xs font-mono">No image</span>
            </div>
        }

        {/* Semi-transparent border zones */}
        {/* Left border zone */}
        <div className="absolute top-0 bottom-0 left-0"
             style={{ width: `${leftPct}%`, background: `${lrColor}22` }} />
        {/* Right border zone */}
        <div className="absolute top-0 bottom-0 right-0"
             style={{ width: `${rightPct}%`, background: `${lrColor}22` }} />
        {/* Top border zone */}
        <div className="absolute left-0 right-0 top-0"
             style={{ height: `${topPct}%`, background: `${tbColor}22` }} />
        {/* Bottom border zone */}
        <div className="absolute left-0 right-0 bottom-0"
             style={{ height: `${bottomPct}%`, background: `${tbColor}22` }} />

        {/* Left edge line */}
        <div className="absolute top-0 bottom-0"
             style={{ left: `${innerLeft}%`, width: 2, background: lrColor, opacity: 0.9,
                      boxShadow: `0 0 6px ${lrColor}` }} />
        {/* Right edge line */}
        <div className="absolute top-0 bottom-0"
             style={{ right: `${innerRight}%`, width: 2, background: lrColor, opacity: 0.9,
                      boxShadow: `0 0 6px ${lrColor}` }} />
        {/* Top edge line */}
        <div className="absolute left-0 right-0"
             style={{ top: `${innerTop}%`, height: 2, background: tbColor, opacity: 0.9,
                      boxShadow: `0 0 6px ${tbColor}` }} />
        {/* Bottom edge line */}
        <div className="absolute left-0 right-0"
             style={{ bottom: `${innerBottom}%`, height: 2, background: tbColor, opacity: 0.9,
                      boxShadow: `0 0 6px ${tbColor}` }} />

        {/* ── Percentage labels ─────────────────────────────────── */}
        {/* Left % — inside left border zone, vertically centered */}
        <div className="absolute flex items-center justify-center pointer-events-none"
             style={{ left: 0, width: `${leftPct}%`, top: '40%', transform: 'translateY(-50%)' }}>
          <span className="font-mono font-black text-shadow"
                style={{ fontSize: 10, color: lrColor, textShadow: '0 1px 4px #000, 0 0 8px #000',
                         writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            {leftPct.toFixed(0)}%
          </span>
        </div>
        {/* Right % */}
        <div className="absolute flex items-center justify-center pointer-events-none"
             style={{ right: 0, width: `${rightPct}%`, top: '40%', transform: 'translateY(-50%)' }}>
          <span className="font-mono font-black"
                style={{ fontSize: 10, color: lrColor, textShadow: '0 1px 4px #000, 0 0 8px #000',
                         writingMode: 'vertical-rl' }}>
            {rightPct.toFixed(0)}%
          </span>
        </div>
        {/* Top % */}
        <div className="absolute flex items-center justify-center pointer-events-none"
             style={{ top: 0, height: `${topPct}%`, left: '50%', transform: 'translateX(-50%)' }}>
          <span className="font-mono font-black"
                style={{ fontSize: 10, color: tbColor, textShadow: '0 1px 4px #000, 0 0 8px #000' }}>
            {topPct.toFixed(0)}%
          </span>
        </div>
        {/* Bottom % */}
        <div className="absolute flex items-center justify-center pointer-events-none"
             style={{ bottom: 0, height: `${bottomPct}%`, left: '50%', transform: 'translateX(-50%)' }}>
          <span className="font-mono font-black"
                style={{ fontSize: 10, color: tbColor, textShadow: '0 1px 4px #000, 0 0 8px #000' }}>
            {bottomPct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Ratio + status pills */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded-full border"
                style={{ color: lrColor, borderColor: lrColor + '55', background: lrColor + '15' }}>
            L/R {leftRight.formatted}
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full border"
                style={{ color: tbColor, borderColor: tbColor + '55', background: tbColor + '15' }}>
            T/B {topBottom.formatted}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-platinum/50 font-mono">
          <span style={{ color: lrColor }}>{lrLabel}</span>
          <span className="text-platinum/20">·</span>
          <span style={{ color: tbColor }}>{tbLabel}</span>
        </div>
        {notes && (
          <p className="text-xs font-mono text-platinum/35 text-center max-w-[200px]">{notes}</p>
        )}
      </div>
    </div>
  );
}

export default function CenteringVisualizer({ centering, frontImage, backImage }) {
  const data = extractCenteringData(centering);
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">

      {/* Card images with overlay */}
      <div className="flex flex-wrap justify-center gap-10">
        {data.front?.leftRight && data.front?.topBottom && (
          <CardWithOverlay
            title="Front"
            imageUrl={frontImage}
            leftRight={data.front.leftRight}
            topBottom={data.front.topBottom}
            lrStatus={data.front.lrStatus}
            tbStatus={data.front.tbStatus}
            notes={data.front.notes}
          />
        )}
        {data.back?.leftRight && data.back?.topBottom && (
          <CardWithOverlay
            title="Back"
            imageUrl={backImage}
            leftRight={data.back.leftRight}
            topBottom={data.back.topBottom}
            lrStatus={data.back.lrStatus}
            tbStatus={data.back.tbStatus}
            notes={data.back.notes}
          />
        )}
      </div>

      {/* PSA Reference Guide */}
      <div className="border border-platinum/10 rounded-lg p-4 bg-charcoal/30">
        <h5 className="text-xs font-mono text-platinum/40 uppercase tracking-wider mb-3">
          PSA Centering Tolerance Reference
        </h5>
        <div className="grid grid-cols-2 gap-2">
          {THRESHOLDS.map(({ label, ratio, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-xs font-mono text-platinum/50">{label}</span>
              <span className="text-xs font-mono font-bold ml-auto" style={{ color }}>{ratio}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
