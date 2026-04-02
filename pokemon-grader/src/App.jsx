import { useState } from 'react';
import CardUploader from './components/CardUploader.jsx';
import GradingReport from './components/GradingReport.jsx';
import { useCardAnalysis } from './hooks/useCardAnalysis.js';
import { AlertCircle, Sparkles } from 'lucide-react';

function Header() {
  return (
    <header className="text-center py-12 px-4">
      <div className="inline-flex items-center gap-2 text-xs font-mono text-gold/60 border border-gold/20 px-4 py-1.5 rounded-full mb-6 bg-gold/5">
        <Sparkles size={12} />
        AI-Powered Card Grading Analysis
      </div>
      <h1 className="font-display text-4xl md:text-6xl font-black text-platinum mb-4 leading-tight">
        Poké<span className="text-gold">Grader</span> AI
      </h1>
      <p className="text-platinum/50 text-lg font-sans max-w-xl mx-auto leading-relaxed">
        Professional-grade Pokémon TCG card analysis powered by Claude Vision.
        Get PSA & TAG grading estimates in seconds.
      </p>
      <div className="flex items-center justify-center gap-6 mt-6 text-xs font-mono text-platinum/30">
        <span>PSA Standards</span>
        <span className="text-gold/40">•</span>
        <span>TAG Methodology</span>
        <span className="text-gold/40">•</span>
        <span>AI Vision Analysis</span>
      </div>
    </header>
  );
}

function DisclaimerBanner() {
  return (
    <div className="max-w-4xl mx-auto px-4 mb-6">
      <div className="border border-platinum/10 bg-charcoal-mid rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertCircle size={14} className="text-platinum/30 mt-0.5 flex-shrink-0" />
        <p className="text-xs font-mono text-platinum/30 leading-relaxed">
          <strong className="text-platinum/50">For educational reference only.</strong>{' '}
          AI grading analysis is an approximation. Results may differ from official PSA or TAG grades.
          This tool is not affiliated with PSA, TAG, or any official grading service.
          Never make financial decisions based solely on this analysis.
        </p>
      </div>
    </div>
  );
}

function TipsSection() {
  return (
    <div className="max-w-4xl mx-auto px-4 mt-8">
      <h3 className="font-display text-sm font-semibold text-platinum/40 uppercase tracking-widest mb-4 text-center">
        Photography Tips for Best Results
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '💡', title: 'Lighting', tip: 'Use diffused natural light or a softbox. Avoid direct flash which can obscure holo scratches.' },
          { icon: '📐', title: 'Angle', tip: 'Shoot straight on, perpendicular to the card. Avoid any tilt that can skew centering measurements.' },
          { icon: '🔍', title: 'Resolution', tip: 'Use at least 300 DPI or a phone camera at full resolution. Ensure corners and edges are in sharp focus.' },
        ].map(({ icon, title, tip }) => (
          <div key={title} className="border border-white/5 rounded-xl p-4 bg-charcoal-mid/50">
            <div className="text-xl mb-2">{icon}</div>
            <h4 className="font-display font-semibold text-platinum/70 text-sm mb-1">{title}</h4>
            <p className="text-xs text-platinum/40 font-sans leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);

  const {
    analyzeCards,
    resetAnalysis,
    isAnalyzing,
    analysis,
    error,
    progress,
  } = useCardAnalysis();

  const handleAnalyze = () => {
    analyzeCards(frontFile, backFile);
  };

  const handleReset = () => {
    setFrontFile(null);
    setBackFile(null);
    resetAnalysis();
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="max-w-6xl mx-auto">
        {!analysis && <Header />}

        <main className="px-4 pb-16">
          {!analysis ? (
            <>
              <DisclaimerBanner />
              <div className="max-w-4xl mx-auto">
                <CardUploader
                  frontFile={frontFile}
                  backFile={backFile}
                  onFrontChange={setFrontFile}
                  onBackChange={setBackFile}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                  progress={progress}
                />

                {error && (
                  <div className="mt-6 border border-red-500/30 bg-red-500/10 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-400">Analysis Error</p>
                      <p className="text-sm font-mono text-red-400/70 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <TipsSection />
              </div>
            </>
          ) : (
            <GradingReport analysis={analysis} onReset={handleReset} />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 px-4 text-center">
          <p className="text-xs font-mono text-platinum/20">
            PokéGrader AI — For reference only · Not affiliated with PSA or TAG ·
            <span className="text-gold/20"> Powered by Claude Vision</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
