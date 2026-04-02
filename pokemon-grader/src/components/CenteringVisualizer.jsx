import { extractCenteringData, getCenteringStatusColor, getCenteringStatusLabel } from '../utils/centeringCalc.js';

const THRESHOLDS = [
  { label: 'Gem Mint (PSA 10)', ratio: '55/45', color: '#22c55e' },
  { label: 'Mint (PSA 9)', ratio: '60/40', color: '#84cc16' },
  { label: 'NM-MT (PSA 8)', ratio: '65/35', color: '#eab308' },
  { label: 'Near Mint (PSA 7)', ratio: '70/30', color: '#f97316' },
];

function CenteringDiagram({ title, leftRight, topBottom, lrStatus, tbStatus }) {
  if (!leftRight || !topBottom) return null;

  // Calculate border percentages
  // leftRight: {larger, smaller} → left border = smaller/total, right = larger/total
  const lrTotal = leftRight.larger + leftRight.smaller;
  const leftPct = (leftRight.smaller / lrTotal) * 100;
  const rightPct = (leftRight.larger / lrTotal) * 100;

  const tbTotal = topBottom.larger + topBottom.smaller;
  const topPct = (topBottom.smaller / tbTotal) * 100;
  const bottomPct = (topBottom.larger / tbTotal) * 100;

  const lrColor = getCenteringStatusColor(lrStatus);
  const tbColor = getCenteringStatusColor(tbStatus);

  return (
    <div className="flex flex-col items-center gap-3">
      <h4 className="text-sm font-mono text-platinum/60 uppercase tracking-wider">{title}</h4>

      {/* Visual card diagram */}
      <div className="relative" style={{ width: 160, height: 220 }}>
        {/* Outer card boundary */}
        <div className="absolute inset-0 border-2 border-platinum/20 rounded" />

        {/* Inner card content area */}
        <div
          className="absolute bg-charcoal-mid/80 border border-platinum/10 rounded-sm"
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            right: `${rightPct}%`,
            bottom: `${bottomPct}%`,
          }}
        />

        {/* Border measurement lines */}
        {/* Left border */}
        <div
          className="absolute top-1/2 flex items-center"
          style={{ left: 0, width: `${leftPct}%`, transform: 'translateY(-50%)' }}
        >
          <div className="w-full h-px" style={{ background: lrColor, opacity: 0.8 }} />
        </div>

        {/* Right border */}
        <div
          className="absolute top-1/2 flex items-center justify-end"
          style={{ right: 0, width: `${rightPct}%`, transform: 'translateY(-50%)' }}
        >
          <div className="w-full h-px" style={{ background: lrColor, opacity: 0.8 }} />
        </div>

        {/* Top border */}
        <div
          className="absolute left-1/2 flex flex-col items-center"
          style={{ top: 0, height: `${topPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-px h-full" style={{ background: tbColor, opacity: 0.8 }} />
        </div>

        {/* Bottom border */}
        <div
          className="absolute left-1/2 flex flex-col items-end justify-end"
          style={{ bottom: 0, height: `${bottomPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-px h-full" style={{ background: tbColor, opacity: 0.8 }} />
        </div>

        {/* Percentage labels */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left % */}
          <span
            className="absolute text-xs font-mono font-bold"
            style={{
              left: 2,
              top: '50%',
              transform: 'translateY(-50%)',
              color: lrColor,
              fontSize: 9,
            }}
          >
            {leftPct.toFixed(0)}%
          </span>
          {/* Right % */}
          <span
            className="absolute text-xs font-mono font-bold"
            style={{
              right: 2,
              top: '50%',
              transform: 'translateY(-50%)',
              color: lrColor,
              fontSize: 9,
            }}
          >
            {rightPct.toFixed(0)}%
          </span>
          {/* Top % */}
          <span
            className="absolute font-mono font-bold"
            style={{
              top: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              color: tbColor,
              fontSize: 9,
            }}
          >
            {topPct.toFixed(0)}%
          </span>
          {/* Bottom % */}
          <span
            className="absolute font-mono font-bold"
            style={{
              bottom: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              color: tbColor,
              fontSize: 9,
            }}
          >
            {bottomPct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Ratio display */}
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-3 text-xs font-mono">
          <span style={{ color: lrColor }}>L/R: {leftRight.formatted}</span>
          <span className="text-platinum/30">|</span>
          <span style={{ color: tbColor }}>T/B: {topBottom.formatted}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span style={{ color: lrColor }}>{getCenteringStatusLabel(lrStatus)}</span>
          <span className="text-platinum/30">|</span>
          <span style={{ color: tbColor }}>{getCenteringStatusLabel(tbStatus)}</span>
        </div>
      </div>
    </div>
  );
}

export default function CenteringVisualizer({ centering }) {
  const data = extractCenteringData(centering);
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-center gap-8">
        {data.front?.leftRight && data.front?.topBottom && (
          <CenteringDiagram
            title="Front"
            leftRight={data.front.leftRight}
            topBottom={data.front.topBottom}
            lrStatus={data.front.lrStatus}
            tbStatus={data.front.tbStatus}
          />
        )}
        {data.back?.leftRight && data.back?.topBottom && (
          <CenteringDiagram
            title="Back"
            leftRight={data.back.leftRight}
            topBottom={data.back.topBottom}
            lrStatus={data.back.lrStatus}
            tbStatus={data.back.tbStatus}
          />
        )}
      </div>

      {/* PSA Reference Guide */}
      <div className="border border-platinum/10 rounded-lg p-4">
        <h5 className="text-xs font-mono text-platinum/50 uppercase tracking-wider mb-3">
          PSA Centering Tolerance Reference
        </h5>
        <div className="grid grid-cols-2 gap-2">
          {THRESHOLDS.map(({ label, ratio, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-xs font-mono text-platinum/60">
                {label}
              </span>
              <span className="text-xs font-mono ml-auto" style={{ color }}>
                {ratio}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {(data.front?.notes || data.back?.notes) && (
        <div className="text-xs text-platinum/50 font-mono space-y-1">
          {data.front?.notes && <p><span className="text-platinum/30">Front:</span> {data.front.notes}</p>}
          {data.back?.notes && <p><span className="text-platinum/30">Back:</span> {data.back.notes}</p>}
        </div>
      )}
    </div>
  );
}
