import React, { useState, useEffect, useCallback } from 'react';
import { AllowedSegmentsOption, WirePath, VertexId } from './types/cube';
import { generateRandomWirePath } from './utils/cubeGeometry';
import { Cube3DViewer } from './components/Cube3DViewer';
import { ProjectionCanvas } from './components/ProjectionCanvas';
import { ControlToolbar } from './components/ControlToolbar';
import { HelpModal } from './components/HelpModal';
import { GitHubPagesModal } from './components/GitHubPagesModal';
import { CheckCircle2, RotateCcw, Award, Lightbulb, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  // Generator configuration
  const [segmentCount, setSegmentCount] = useState<number>(5);
  const [allowedOption, setAllowedOption] = useState<AllowedSegmentsOption>('edges_and_face_diagonals');

  // Active wire path
  const [wirePath, setWirePath] = useState<WirePath>(() =>
    generateRandomWirePath(5, 'edges_and_face_diagonals')
  );

  // Projection reveal states (initially hidden as requested)
  const [isNarysRevealed, setIsNarysRevealed] = useState<boolean>(false);
  const [isPudorysRevealed, setIsPudorysRevealed] = useState<boolean>(false);
  const [isBokorysRevealed, setIsBokorysRevealed] = useState<boolean>(false);
  const [showBokorys, setShowBokorys] = useState<boolean>(false);

  // Stepping / Hovering active segment
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Self-evaluation score tracking
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [evaluatedThisRound, setEvaluatedThisRound] = useState<boolean>(false);

  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isGitHubPagesOpen, setIsGitHubPagesOpen] = useState<boolean>(false);

  // Generate new wire path
  const handleGenerateNew = useCallback(() => {
    const newPath = generateRandomWirePath(segmentCount, allowedOption);
    setWirePath(newPath);
    setIsNarysRevealed(false);
    setIsPudorysRevealed(false);
    setIsBokorysRevealed(false);
    setActiveSegmentIndex(null);
    setIsPlaying(false);
    setEvaluatedThisRound(false);
  }, [segmentCount, allowedOption]);

  // When segmentCount or allowedOption changes from settings, generate a fresh path
  const handleSegmentCountChange = (count: number) => {
    setSegmentCount(count);
    const newPath = generateRandomWirePath(count, allowedOption);
    setWirePath(newPath);
    setIsNarysRevealed(false);
    setIsPudorysRevealed(false);
    setIsBokorysRevealed(false);
    setActiveSegmentIndex(null);
    setEvaluatedThisRound(false);
  };

  const handleAllowedOptionChange = (option: AllowedSegmentsOption) => {
    setAllowedOption(option);
    const newPath = generateRandomWirePath(segmentCount, option);
    setWirePath(newPath);
    setIsNarysRevealed(false);
    setIsPudorysRevealed(false);
    setIsBokorysRevealed(false);
    setActiveSegmentIndex(null);
    setEvaluatedThisRound(false);
  };

  // Reveal / Hide All
  const handleRevealAll = () => {
    setIsNarysRevealed(true);
    setIsPudorysRevealed(true);
    if (showBokorys) setIsBokorysRevealed(true);
  };

  const handleHideAll = () => {
    setIsNarysRevealed(false);
    setIsPudorysRevealed(false);
    setIsBokorysRevealed(false);
  };

  // Auto-play stepping animation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveSegmentIndex(prev => {
        if (prev === null || prev >= wirePath.segments.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 1100);

    return () => clearInterval(interval);
  }, [isPlaying, wirePath.segments.length]);

  // Record self-evaluation
  const handleSelfEvaluate = (wasCorrect: boolean) => {
    setScore(prev => ({
      correct: prev.correct + (wasCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setEvaluatedThisRound(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Application Toolbar */}
      <ControlToolbar
        segmentCount={segmentCount}
        onSegmentCountChange={handleSegmentCountChange}
        allowedOption={allowedOption}
        onAllowedOptionChange={handleAllowedOptionChange}
        onGenerateNew={handleGenerateNew}
        isNarysRevealed={isNarysRevealed}
        isPudorysRevealed={isPudorysRevealed}
        onRevealAll={handleRevealAll}
        onHideAll={handleHideAll}
        activeSegmentIndex={activeSegmentIndex}
        onSelectSegment={setActiveSegmentIndex}
        totalSegments={wirePath.segments.length}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenGitHubPages={() => setIsGitHubPagesOpen(true)}
        showBokorys={showBokorys}
        onToggleBokorys={() => setShowBokorys(!showBokorys)}
      />

      {/* Main Workspace: Left 3D View, Right Stacked Projections */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Pane: 3D Interactive Wireframe Cube (takes 7 columns on desktop) */}
        <section className="lg:col-span-7 h-[420px] lg:h-[calc(100vh-62px)] relative border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col">
          <Cube3DViewer
            wirePath={wirePath}
            activeSegmentIndex={activeSegmentIndex}
            onHoverSegment={setActiveSegmentIndex}
          />
        </section>

        {/* Right Pane: Two stacked 2D Projections (Nárys nahoře, Půdorys dole) */}
        <section className="lg:col-span-5 h-auto lg:h-[calc(100vh-62px)] overflow-y-auto p-3 sm:p-4 bg-slate-950/60 flex flex-col gap-4">
          {/* Quick info banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lightbulb className="w-4 h-4" />
              </span>
              <div>
                <strong className="text-slate-200 block">Zadání úkolu:</strong>
                <span className="text-slate-400 text-[11px]">
                  Představte si průměty drátu a poté je odkryjte pro kontrolu.
                </span>
              </div>
            </div>

            {/* Score Tracker */}
            {score.total > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Úspěšnost:</span>
                <span className="font-bold text-amber-400">
                  {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)
                </span>
              </div>
            )}
          </div>

          {/* 1. NÁRYS (Pohled zepředu, nahoře) */}
          <div>
            <ProjectionCanvas
              projection="narys"
              wirePath={wirePath}
              isRevealed={isNarysRevealed}
              onToggleReveal={() => setIsNarysRevealed(!isNarysRevealed)}
              activeSegmentIndex={activeSegmentIndex}
              onHoverSegment={setActiveSegmentIndex}
            />
          </div>

          {/* 2. PŮDORYS (Pohled shora, dole) */}
          <div>
            <ProjectionCanvas
              projection="pudorys"
              wirePath={wirePath}
              isRevealed={isPudorysRevealed}
              onToggleReveal={() => setIsPudorysRevealed(!isPudorysRevealed)}
              activeSegmentIndex={activeSegmentIndex}
              onHoverSegment={setActiveSegmentIndex}
            />
          </div>

          {/* Optional 3. BOKORYS (Pohled z boku) */}
          {showBokorys && (
            <div className="animate-in fade-in duration-200">
              <ProjectionCanvas
                projection="bokorys"
                wirePath={wirePath}
                isRevealed={isBokorysRevealed}
                onToggleReveal={() => setIsBokorysRevealed(!isBokorysRevealed)}
                activeSegmentIndex={activeSegmentIndex}
                onHoverSegment={setActiveSegmentIndex}
              />
            </div>
          )}

          {/* Self-check evaluation section if both revealed */}
          {(isNarysRevealed && isPudorysRevealed) && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <strong className="text-slate-200 block text-sm">
                  {evaluatedThisRound ? 'Výsledek zaznamenán!' : 'Měli jste správnou představu?'}
                </strong>
                <p className="text-slate-400 text-[11px]">
                  {evaluatedThisRound
                    ? 'Pokračujte kliknutím na tlačítko „Nová čára“ výše.'
                    : 'Ohodnoťte svoji prostorovou představivost a sledujte své zlepšení.'}
                </p>
              </div>

              {!evaluatedThisRound ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSelfEvaluate(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ano, uhodl(a) jsem</span>
                  </button>
                  <button
                    onClick={() => handleSelfEvaluate(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition"
                  >
                    <span>Ne, zmýlil(a) jsem se</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateNew}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Další cvičení</span>
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <GitHubPagesModal isOpen={isGitHubPagesOpen} onClose={() => setIsGitHubPagesOpen(false)} />
    </div>
  );
}
