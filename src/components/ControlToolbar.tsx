import React, { useState } from 'react';
import { AllowedSegmentsOption } from '../types/cube';
import {
  Dices,
  Eye,
  EyeOff,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sliders,
  HelpCircle,
  Globe,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ControlToolbarProps {
  segmentCount: number;
  onSegmentCountChange: (count: number) => void;
  allowedOption: AllowedSegmentsOption;
  onAllowedOptionChange: (option: AllowedSegmentsOption) => void;
  onGenerateNew: () => void;
  isNarysRevealed: boolean;
  isPudorysRevealed: boolean;
  onRevealAll: () => void;
  onHideAll: () => void;
  // Step-by-step playback
  activeSegmentIndex: number | null;
  onSelectSegment: (index: number | null) => void;
  totalSegments: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  // Modals & extra views
  onOpenHelp: () => void;
  onOpenGitHubPages: () => void;
  showBokorys: boolean;
  onToggleBokorys: () => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  segmentCount,
  onSegmentCountChange,
  allowedOption,
  onAllowedOptionChange,
  onGenerateNew,
  isNarysRevealed,
  isPudorysRevealed,
  onRevealAll,
  onHideAll,
  activeSegmentIndex,
  onSelectSegment,
  totalSegments,
  isPlaying,
  onTogglePlay,
  onOpenHelp,
  onOpenGitHubPages,
  showBokorys,
  onToggleBokorys,
}) => {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const bothRevealed = isNarysRevealed && isPudorysRevealed;

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-3 py-2.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-md">
      {/* Left section: App Brand & Main Action */}
      <div className="flex items-center flex-wrap gap-2.5">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/40">
            <span className="text-sm font-mono">3D</span>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 leading-tight flex items-center gap-1.5">
              <span>Drátěná krychle</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-400 bg-amber-950/70 border border-amber-800/60 px-1.5 py-0.5 rounded">
                Test představivosti
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Pravoúhlé průměty 3D lomené čáry (nárys & půdorys)
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerateNew}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Dices className="w-4 h-4" />
          <span>Nová čára</span>
        </button>

        {/* Reveal/Hide both toggle */}
        <button
          onClick={bothRevealed ? onHideAll : onRevealAll}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          title={bothRevealed ? 'Skrýt nárys i půdorys' : 'Odkrýt nárys i půdorys'}
        >
          {bothRevealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Skrýt oba průměty</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Odkrýt oba průměty</span>
            </>
          )}
        </button>
      </div>

      {/* Center / Controls: Step-by-step playback */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
        <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Krok:</span>
        <button
          onClick={() => {
            if (activeSegmentIndex === null || activeSegmentIndex <= 0) {
              onSelectSegment(totalSegments - 1);
            } else {
              onSelectSegment(activeSegmentIndex - 1);
            }
          }}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Předchozí segment"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`p-1.5 rounded-md transition ${
            isPlaying
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title={isPlaying ? 'Pozastavit animaci' : 'Přehrát průchod drátem'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => {
            if (activeSegmentIndex === null || activeSegmentIndex >= totalSegments - 1) {
              onSelectSegment(0);
            } else {
              onSelectSegment(activeSegmentIndex + 1);
            }
          }}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Další segment"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <span className="text-[11px] font-mono text-amber-300 px-1 min-w-[45px] text-center">
          {activeSegmentIndex !== null ? `${activeSegmentIndex + 1}/${totalSegments}` : `Vše (${totalSegments})`}
        </span>

        {activeSegmentIndex !== null && (
          <button
            onClick={() => onSelectSegment(null)}
            className="text-[10px] text-slate-400 hover:text-slate-200 underline ml-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* Right section: Difficulty Settings & Modals */}
      <div className="flex items-center gap-2">
        {/* Difficulty Quick Selector */}
        <div className="relative">
          <button
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Obtížnost:</span>
            <span className="text-amber-400 font-medium">
              {allowedOption === 'edges'
                ? 'Snadná'
                : allowedOption === 'edges_and_face_diagonals'
                ? 'Střední'
                : 'Pokročilá'}
            </span>
          </button>

          {/* Dropdown for generator configuration */}
          {showSettingsDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl z-30 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Povolené typy čar:
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onAllowedOptionChange('edges');
                      setShowSettingsDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                      allowedOption === 'edges'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>Pouze hrany krychle</span>
                    <span className="text-[10px] text-slate-400">Snadné</span>
                  </button>

                  <button
                    onClick={() => {
                      onAllowedOptionChange('edges_and_face_diagonals');
                      setShowSettingsDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                      allowedOption === 'edges_and_face_diagonals'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>Hrany + stěnové úhlopříčky</span>
                    <span className="text-[10px] text-slate-400">Doporučeno</span>
                  </button>

                  <button
                    onClick={() => {
                      onAllowedOptionChange('all');
                      setShowSettingsDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                      allowedOption === 'all'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>Všechny včetně tělesových</span>
                    <span className="text-[10px] text-slate-400">Výzva</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Délka drátu (segmenty):
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {segmentCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={segmentCount}
                  onChange={e => onSegmentCountChange(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>3 (krátká)</span>
                  <span>6 (standard)</span>
                  <span>10 (dlouhá)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setShowSettingsDropdown(false);
                    onGenerateNew();
                  }}
                  className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition text-center"
                >
                  Použít a vygenerovat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Bokorys */}
        <button
          onClick={onToggleBokorys}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
            showBokorys
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
          }`}
          title="Zobrazit třetí průmět – bokorys (pohled z boku)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">+ Bokorys</span>
        </button>

        {/* GitHub Pages Modal trigger */}
        <button
          onClick={onOpenGitHubPages}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
          title="Jak publikovat aplikaci na GitHub Pages"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden md:inline">GitHub Pages</span>
        </button>

        {/* Help Modal trigger */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
          title="Nápověda a metodika Mongeova promítání"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Nápověda</span>
        </button>
      </div>
    </div>
  );
};
