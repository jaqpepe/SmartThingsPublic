import { PSA_GRADES, TAG_GRADES, getGradeTheme, getPSARecommendationText } from '../utils/psaTagMapping.js';
import { getScoreColor } from '../utils/gradingLogic.js';

function GradeBar({ grade, maxGrade, label, color, isActive }) {
  const pct = (grade / maxGrade) * 100;
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
      isActive ? 'bg-gold/10 border border-gold/30' : 'hover:bg-white/3'
    }`}>
      <span className={`font-mono text-sm w-8 text-right ${isActive ? 'text-gold font-bold' : 'text-platinum/40'}`}>
        {grade}
      </span>
      <div className="flex-1 bg-white/5 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className={`text-xs font-mono w-20 ${isActive ? 'text-platinum' : 'text-platinum/40'}`}>
        {label}
      </span>
    </div>
  );
}

export default function GradeComparison({ tagComposite, psaEquivalent, subGrades }) {
  const psaGrade = psaEquivalent || 1;
  const tagScore = tagComposite || 1;

  const theme = getGradeTheme(psaGrade);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* PSA Scale */}
      <div className="flex flex-col gap-3">
        <h4 className="font-display text-sm font-semibold text-platinum/70 uppercase tracking-widest">
          PSA Scale
        </h4>
        <div className="flex flex-col gap-1">
          {PSA_GRADES.map(({ grade, label }) => (
            <GradeBar
              key={grade}
              grade={grade}
              maxGrade={10}
              label={label}
              color={getScoreColor(grade)}
              isActive={grade === psaGrade}
            />
          ))}
        </div>
      </div>

      {/* TAG Scale */}
      <div className="flex flex-col gap-3">
        <h4 className="font-display text-sm font-semibold text-platinum/70 uppercase tracking-widest">
          TAG Scale
        </h4>
        <div className="flex flex-col gap-1">
          {TAG_GRADES.map(({ grade, label }) => (
            <GradeBar
              key={grade}
              grade={grade}
              maxGrade={10}
              label={label}
              color={getScoreColor(grade)}
              isActive={grade === tagScore || Math.abs(grade - tagScore) < 0.25}
            />
          ))}
        </div>
      </div>

      {/* Sub-grade breakdown */}
      {subGrades && (
        <div className="md:col-span-2">
          <h4 className="font-display text-sm font-semibold text-platinum/70 uppercase tracking-widest mb-4">
            TAG Sub-Grade Breakdown
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'corners', label: 'Corners', weight: '35%' },
              { key: 'surfaces', label: 'Surfaces', weight: '35%' },
              { key: 'centering', label: 'Centering', weight: '20%' },
              { key: 'edges', label: 'Edges', weight: '10%' },
            ].map(({ key, label, weight }) => {
              const score = subGrades[key] ?? 0;
              const color = getScoreColor(score);
              return (
                <div
                  key={key}
                  className="sub-grade-box rounded-xl p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-xs font-mono text-platinum/40 uppercase">{label}</span>
                  <span className="font-mono text-2xl font-bold" style={{ color }}>
                    {score.toFixed(1)}
                  </span>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${(score / 10) * 100}%`, background: color }}
                    />
                  </div>
                  <span className="text-xs font-mono text-platinum/30">{weight} weight</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendation box */}
      <div className={`md:col-span-2 border rounded-xl p-5 ${theme.border} bg-gradient-to-r ${theme.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-platinum/50 uppercase tracking-wider mb-1">
              Grade Recommendation
            </p>
            <p className={`font-display text-2xl font-bold ${theme.text}`}>
              {getPSARecommendationText(psaGrade)}
            </p>
            <p className="font-mono text-sm text-platinum/50 mt-1">
              TAG Composite: {tagScore.toFixed(1)}
            </p>
          </div>
          <div
            className={`w-20 h-20 rounded-xl flex items-center justify-center font-display text-3xl font-black text-charcoal ${theme.badge}`}
          >
            {psaGrade}
          </div>
        </div>
      </div>
    </div>
  );
}
