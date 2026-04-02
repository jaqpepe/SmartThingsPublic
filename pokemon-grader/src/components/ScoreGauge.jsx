import { useEffect, useState } from 'react';
import { getScoreColor, getLetterGrade } from '../utils/gradingLogic.js';

export default function ScoreGauge({ score, label, maxScore = 10, size = 'md', animate = true }) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setDisplayed(score);
      return;
    }
    let start = 0;
    const duration = 800;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(parseFloat((eased * score).toFixed(1)));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [score, animate]);

  const percentage = (score / maxScore) * 100;
  const color = getScoreColor(score);
  const letter = getLetterGrade(score);

  const sizes = {
    sm: { svg: 80, r: 28, stroke: 5, fontSize: '14px', labelSize: '8px' },
    md: { svg: 120, r: 44, stroke: 7, fontSize: '22px', labelSize: '10px' },
    lg: { svg: 160, r: 60, stroke: 9, fontSize: '30px', labelSize: '12px' },
    xl: { svg: 200, r: 76, stroke: 11, fontSize: '40px', labelSize: '14px' },
  };

  const { svg: svgSize, r, stroke, fontSize, labelSize } = sizes[size] || sizes.md;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (percentage / 100) * circumference;

  // Arc starts at top (270deg offset) — rotate svg -90deg
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg
          width={svgSize}
          height={svgSize}
          style={{ transform: 'rotate(-90deg)' }}
          className="drop-shadow-lg"
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center font-mono"
          style={{ transform: 'rotate(0deg)' }}
        >
          <span style={{ fontSize, color, fontWeight: 600, lineHeight: 1 }}>
            {displayed.toFixed(1)}
          </span>
          <span style={{ fontSize: labelSize, color: 'rgba(232,232,232,0.5)', marginTop: 2 }}>
            {letter}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs font-mono text-platinum/60 text-center uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
