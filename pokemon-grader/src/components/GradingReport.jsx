import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ScoreGauge from './ScoreGauge.jsx';
import CenteringVisualizer from './CenteringVisualizer.jsx';
import DefectMap from './DefectMap.jsx';
import GradeComparison from './GradeComparison.jsx';
import {
  getGradeBadgeClass, getScoreColor, getLetterGrade,
  getScoreStatusColor, getConfidenceColor, mapToPSA, getTAGLabel
} from '../utils/gradingLogic.js';
import { getPSARecommendationText } from '../utils/psaTagMapping.js';
import { Download, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

function DefectIcon({ type }) {
  const map = {
    corner: '⬡',
    surface: '◈',
    edge: '▬',
    centering: '⊕',
  };
  return <span>{map[type] || '•'}</span>;
}

function CornerGrid({ corners }) {
  if (!corners) return null;

  const cornerData = [
    { key: 'front_top_left', label: 'Front TL' },
    { key: 'front_top_right', label: 'Front TR' },
    { key: 'front_bottom_left', label: 'Front BL' },
    { key: 'front_bottom_right', label: 'Front BR' },
    { key: 'back_top_left', label: 'Back TL' },
    { key: 'back_top_right', label: 'Back TR' },
    { key: 'back_bottom_left', label: 'Back BL' },
    { key: 'back_bottom_right', label: 'Back BR' },
  ];

  const gradeColor = (grade) => {
    if (!grade) return '#6b7280';
    const g = grade.toLowerCase();
    if (g.includes('gem') || g.includes('sharp')) return '#22c55e';
    if (g.includes('slight')) return '#84cc16';
    if (g.includes('fuzz')) return '#eab308';
    if (g.includes('round')) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {cornerData.map(({ key, label }) => {
        const c = corners[key];
        if (!c) return null;
        const color = gradeColor(c.grade);
        return (
          <div key={key} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-charcoal/50 border border-white/5">
            <span className="text-xs font-mono text-platinum/40">{label}</span>
            <span className="text-xs font-semibold" style={{ color }}>{c.grade}</span>
            {c.whitening && (
              <span className="text-xs text-orange-400 font-mono">W</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SurfaceSection({ surfaces }) {
  if (!surfaces) return null;

  function SurfaceSide({ data, label }) {
    if (!data) return null;
    const defects = [];
    if (data.holo_scratches?.count > 0) defects.push({ label: `${data.holo_scratches.count}× Holo Scratch`, severity: data.holo_scratches.severity, type: 'holo' });
    if (data.surface_scratches?.count > 0) defects.push({ label: `${data.surface_scratches.count}× Surface Scratch`, severity: data.surface_scratches.severity, type: 'scratch' });
    if (data.print_defects?.present) defects.push({ label: 'Print Defects', detail: data.print_defects.description, type: 'print' });
    if (data.stains?.present) defects.push({ label: 'Staining', detail: data.stains.description, type: 'stain' });
    if (data.indentations?.present) defects.push({ label: 'Indentations', detail: data.indentations.description, type: 'indent' });

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-xs font-mono text-platinum/50 uppercase">{label}</h5>
          <span className="font-mono text-sm font-bold" style={{ color: getScoreColor(data.score) }}>
            {data.score?.toFixed(1) ?? 'N/A'}
          </span>
        </div>
        {defects.length === 0 ? (
          <p className="text-xs text-green-400/70 font-mono">No defects detected</p>
        ) : (
          <ul className="space-y-1">
            {defects.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-mono text-platinum/60">
                <span className="text-orange-400 mt-0.5">▪</span>
                <span>{d.label}{d.severity ? ` (${d.severity})` : ''}{d.detail ? ` — ${d.detail}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <SurfaceSide data={surfaces.front} label="Front Surface" />
      <div className="w-px bg-white/10" />
      <SurfaceSide data={surfaces.back} label="Back Surface" />
    </div>
  );
}

function EdgeSection({ edges }) {
  if (!edges) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {['top', 'bottom', 'left', 'right'].map(edge => {
        const e = edges[edge];
        if (!e) return null;
        return (
          <div key={edge} className="flex flex-col gap-1 p-3 rounded-lg bg-charcoal/50 border border-white/5">
            <span className="text-xs font-mono text-platinum/40 uppercase">{edge}</span>
            <span className="font-mono text-lg font-bold" style={{ color: getScoreColor(e.score) }}>
              {e.score?.toFixed(1) ?? 'N/A'}
            </span>
            <span className="text-xs text-platinum/50">{e.condition}</span>
            <div className="flex gap-2 mt-1">
              {e.whitening && <span className="text-xs text-orange-400 font-mono">W</span>}
              {e.nicks && <span className="text-xs text-red-400 font-mono">N</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-platinum/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-gold">{icon}</span>
          <span className="font-display font-semibold text-platinum">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-platinum/40" /> : <ChevronDown size={16} className="text-platinum/40" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-platinum/10">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

export default function GradingReport({ analysis, onReset }) {
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  if (!analysis) return null;

  const { card_info, centering, corners, surfaces, edges, grade_recommendation, _computed, _images, _timestamp } = analysis;

  const subGrades = _computed?.subGrades || {
    centering: grade_recommendation?.tag_centering || 0,
    surfaces: grade_recommendation?.tag_surfaces || 0,
    edges: grade_recommendation?.tag_edges || 0,
    corners: grade_recommendation?.tag_corners || 0,
  };

  const composite = _computed?.composite || grade_recommendation?.tag_composite || 0;
  const psaEquivalent = _computed?.psaEquivalent || grade_recommendation?.psa_equivalent || 1;
  const confidence = grade_recommendation?.confidence || 'Low';
  const limitingFactors = grade_recommendation?.grade_limiting_factors || [];
  const summary = grade_recommendation?.summary || '';

  const badgeClass = getGradeBadgeClass(composite);

  const handleExport = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0a0a0f',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        width: 800,
        windowWidth: 800,
      });
      const link = document.createElement('a');
      link.download = `pokegrade-${card_info?.name || 'card'}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="text-sm font-mono text-platinum/50 hover:text-platinum border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg transition-all"
        >
          ← Grade Another Card
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 text-sm font-mono text-charcoal bg-gold hover:bg-gold-light px-4 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? 'Exporting...' : 'Export Report'}
        </button>
      </div>

      {/* Main TAG report card — exportable */}
      <div ref={reportRef} className="tag-report-card rounded-2xl overflow-hidden">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-charcoal-mid to-charcoal-light border-b border-gold/20 px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Card thumbnails */}
            <div className="flex gap-3">
              {_images?.front && (
                <img src={_images.front} alt="Front" className="h-20 w-14 object-cover rounded-lg border border-gold/20 shadow-xl" />
              )}
              {_images?.back && (
                <img src={_images.back} alt="Back" className="h-20 w-14 object-cover rounded-lg border border-gold/20 shadow-xl" />
              )}
            </div>

            {/* Card info */}
            <div className="flex-1 px-6">
              <h2 className="font-display text-2xl font-bold text-platinum">
                {card_info?.name || 'Unknown Card'}
              </h2>
              <p className="font-mono text-sm text-gold/80 mt-1">
                {card_info?.set || 'Unknown Set'}
                {card_info?.number ? ` · #${card_info.number}` : ''}
              </p>
              <div className="flex items-center gap-3 mt-2">
                {card_info?.is_holo && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">HOLO</span>
                )}
                {card_info?.is_reverse_holo && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">REVERSE HOLO</span>
                )}
                {card_info?.language && card_info.language !== 'English' && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-charcoal-surface text-platinum/50 border border-white/10">
                    {card_info.language}
                  </span>
                )}
              </div>
            </div>

            {/* Composite grade badge */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center shadow-2xl ${badgeClass} animate-count-up`}>
                <span className="font-display text-3xl font-black text-charcoal leading-none">
                  {composite.toFixed(1)}
                </span>
                <span className="font-mono text-xs text-charcoal/70 mt-1">
                  {getTAGLabel(composite)}
                </span>
              </div>
              <span className="text-xs font-mono text-platinum/40 uppercase tracking-wider">TAG Composite</span>
            </div>
          </div>
        </div>

        {/* Sub-grade 2×2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
          {[
            { key: 'centering', label: 'Centering', weight: '20%' },
            { key: 'surfaces', label: 'Surfaces', weight: '35%' },
            { key: 'edges', label: 'Edges', weight: '10%' },
            { key: 'corners', label: 'Corners', weight: '35%' },
          ].map(({ key, label, weight }) => {
            const score = subGrades[key] ?? 0;
            const color = getScoreColor(score);
            const letter = getLetterGrade(score);
            return (
              <div key={key} className="sub-grade-box bg-charcoal-light/90 p-4 flex flex-col items-center gap-1 stagger-1">
                <span className="text-xs font-mono text-platinum/40 uppercase tracking-wider">{label}</span>
                <div className="flex items-end gap-1">
                  <span className="font-mono text-3xl font-bold leading-none" style={{ color }}>{score.toFixed(1)}</span>
                  <span className="font-mono text-lg text-platinum/40 mb-0.5">{letter}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1 mt-1">
                  <div
                    className="h-1 rounded-full transition-all duration-700"
                    style={{ width: `${(score / 10) * 100}%`, background: color }}
                  />
                </div>
                <span className="text-xs font-mono text-platinum/25">{weight}</span>
              </div>
            );
          })}
        </div>

        {/* PSA equivalent + confidence */}
        <div className="flex items-center justify-between px-6 py-4 bg-charcoal/50 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-mono text-platinum/40 uppercase tracking-wider">PSA Equivalent</p>
              <p className="font-display text-xl font-bold text-gold mt-0.5">
                {getPSARecommendationText(psaEquivalent)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-mono text-platinum/40 uppercase tracking-wider">Confidence</p>
              <p className={`font-mono font-semibold mt-0.5 ${getConfidenceColor(confidence)}`}>
                {confidence}
              </p>
            </div>
          </div>
        </div>

        {/* Watermark for export */}
        <div className="px-6 py-2 bg-charcoal/30 border-t border-white/5">
          <p className="text-xs font-mono text-platinum/20 text-center">
            Generated by PokéGrader AI — For reference only · Not affiliated with PSA or TAG
            {_timestamp && ` · ${new Date(_timestamp).toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* Limiting factors */}
      {limitingFactors.length > 0 && (
        <div className="border border-orange-500/20 bg-orange-500/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-400" />
            <h3 className="font-display font-semibold text-orange-300">Grade Limiting Factors</h3>
          </div>
          <ul className="space-y-1">
            {limitingFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-mono text-orange-300/70">
                <span className="text-orange-400/50 mt-0.5">▪</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={16} className="text-blue-400" />
            <h3 className="font-display font-semibold text-blue-300">Analysis Summary</h3>
          </div>
          <p className="text-sm font-mono text-platinum/60 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Detailed sections */}
      <div className="space-y-4">
        <Section title="Centering Analysis" icon="⊕" defaultOpen={true}>
          <CenteringVisualizer centering={centering} frontImage={_images?.front} backImage={_images?.back} />
        </Section>

        <Section title="Corner Analysis" icon="⬡" defaultOpen={true}>
          <CornerGrid corners={corners} />
          {corners?.overall_score != null && (
            <p className="text-xs font-mono text-platinum/40 mt-3">
              Overall Corner Score: <span style={{ color: getScoreColor(corners.overall_score) }}>{corners.overall_score.toFixed(1)}</span>
            </p>
          )}
        </Section>

        <Section title="Surface Analysis" icon="◈" defaultOpen={true}>
          <SurfaceSection surfaces={surfaces} />
        </Section>

        <Section title="Edge Analysis" icon="▬" defaultOpen={true}>
          <EdgeSection edges={edges} />
        </Section>

        <Section title="Defect Map — Front" icon="🗺" defaultOpen={false}>
          <DefectMap analysis={analysis} imageUrl={_images?.front} side="front" />
        </Section>

        <Section title="Defect Map — Back" icon="🗺" defaultOpen={false}>
          <DefectMap analysis={analysis} imageUrl={_images?.back} side="back" />
        </Section>

        <Section title="Grade Scale Comparison" icon="📊" defaultOpen={false}>
          <GradeComparison
            tagComposite={composite}
            psaEquivalent={psaEquivalent}
            subGrades={subGrades}
          />
        </Section>
      </div>
    </div>
  );
}
