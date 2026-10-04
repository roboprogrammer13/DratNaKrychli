import React, { useState } from 'react';
import { ProjectionType, WirePath, Point2D, VertexId, WireSegment } from '../types/cube';
import {
  projectVertexTo2D,
  getProjectionCornerLabels,
  getProjectionNameCz,
  isSegmentPerpendicularToView,
  CornerLabel,
} from '../utils/cubeGeometry';
import { Eye, EyeOff, Check, X, RotateCcw, HelpCircle, Layers, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectionCanvasProps {
  projection: ProjectionType;
  wirePath: WirePath;
  isRevealed: boolean;
  onToggleReveal: () => void;
  activeSegmentIndex: number | null;
  onHoverSegment?: (index: number | null) => void;
  isQuizMode?: boolean;
}

export const ProjectionCanvas: React.FC<ProjectionCanvasProps> = ({
  projection,
  wirePath,
  isRevealed,
  onToggleReveal,
  activeSegmentIndex,
  onHoverSegment,
  isQuizMode = false,
}) => {
  const meta = getProjectionNameCz(projection);
  const cornerLabels = getProjectionCornerLabels(projection);

  // Quiz interactive drawing state: array of corner IDs clicked by user ('tl', 'tr', 'bl', 'br')
  const [userPath, setUserPath] = useState<string[]>([]);
  const [quizStatus, setQuizStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showExplanation, setShowExplanation] = useState(false);

  // SVG coordinate dimensions
  const svgSize = 320;
  const padding = 54;
  const contentSize = svgSize - 2 * padding;

  // Transform normalized coords [-1, 1] to SVG coords [padding, svgSize - padding]
  // In normalized coords: x=-1 is left, x=+1 is right; y=-1 is bottom, y=+1 is top
  const toSvgX = (x: number) => padding + ((x + 1) / 2) * contentSize;
  const toSvgY = (y: number) => padding + ((1 - y) / 2) * contentSize; // invert Y for SVG

  // Map each corner ID to its SVG point
  const cornerPositions: Record<string, Point2D> = {};
  cornerLabels.forEach(corner => {
    cornerPositions[corner.id] = {
      x: toSvgX(corner.pos.x),
      y: toSvgY(corner.pos.y),
    };
  });

  // Convert a vertex ID to corner ID for this projection
  const vertexToCornerId = (vId: VertexId): string => {
    const p = projectVertexTo2D(vId, projection);
    if (p.x < 0 && p.y > 0) return 'tl';
    if (p.x > 0 && p.y > 0) return 'tr';
    if (p.x < 0 && p.y < 0) return 'bl';
    return 'br';
  };

  // Build the correct sequence of corner projections
  const correctCornerPath = wirePath.vertices.map(v => vertexToCornerId(v));

  // Compute 2D projected segments
  const projectedSegments = wirePath.segments.map((seg, idx) => {
    const p1 = projectVertexTo2D(seg.from, projection);
    const p2 = projectVertexTo2D(seg.to, projection);
    const isDegenerate = Math.abs(p1.x - p2.x) < 0.001 && Math.abs(p1.y - p2.y) < 0.001;

    return {
      segment: seg,
      index: idx,
      fromSvg: { x: toSvgX(p1.x), y: toSvgY(p1.y) },
      toSvg: { x: toSvgX(p2.x), y: toSvgY(p2.y) },
      isDegenerate,
      fromVertex: seg.from,
      toVertex: seg.to,
    };
  });

  // Find degenerate points for annotations
  const degenerateSegments = projectedSegments.filter(s => s.isDegenerate);

  // Handle clicking a corner in Quiz Mode
  const handleCornerClick = (cornerId: string) => {
    if (isRevealed) return;
    setQuizStatus('idle');
    setUserPath(prev => [...prev, cornerId]);
  };

  const handleUndoCorner = () => {
    setUserPath(prev => prev.slice(0, -1));
    setQuizStatus('idle');
  };

  const handleClearUserPath = () => {
    setUserPath([]);
    setQuizStatus('idle');
  };

  const handleCheckQuizAnswer = () => {
    // Check if user path matches correct corner path
    if (userPath.length !== correctCornerPath.length) {
      setQuizStatus('wrong');
      return;
    }

    const matches = userPath.every((val, i) => val === correctCornerPath[i]);
    if (matches) {
      setQuizStatus('correct');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } else {
      setQuizStatus('wrong');
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold ${
              projection === 'narys'
                ? 'bg-amber-500 text-slate-950'
                : projection === 'pudorys'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-indigo-500 text-white'
            }`}
          >
            {projection === 'narys' ? '2' : projection === 'pudorys' ? '1' : '3'}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 leading-none">
              <span>{meta.title}</span>
              <span className="text-xs text-slate-400 font-normal">({meta.subtitle})</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">{meta.plane}</span>
          </div>
        </div>

        {/* Action button to reveal / hide */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleReveal}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
              isRevealed
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-amber-950/50'
            }`}
          >
            {isRevealed ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Skrýt průmět</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-950" />
                <span>Odkrýt {meta.title.toLowerCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Area with SVG */}
      <div className="relative w-full flex items-center justify-center p-2 sm:p-3 bg-slate-950/90 min-h-[260px]">
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full max-w-[280px] sm:max-w-[300px] h-auto select-none"
        >
          {/* Subtle grid background */}
          <defs>
            <pattern id={`grid-${projection}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>
            {/* Arrow marker for wire direction */}
            <marker
              id={`arrow-${projection}`}
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
            </marker>
            <marker
              id={`arrow-active-${projection}`}
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Background grid */}
          <rect width={svgSize} height={svgSize} fill={`url(#grid-${projection})`} />

          {/* Axis indicators in drafting style */}
          <line
            x1={padding - 18}
            y1={svgSize - padding + 18}
            x2={svgSize - padding + 22}
            y2={svgSize - padding + 18}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <text
            x={svgSize - padding + 28}
            y={svgSize - padding + 21}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
          >
            x
          </text>

          <line
            x1={padding - 18}
            y1={svgSize - padding + 18}
            x2={padding - 18}
            y2={padding - 22}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <text
            x={padding - 20}
            y={padding - 26}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
          >
            {projection === 'narys' ? 'z' : 'y'}
          </text>

          {/* Cube boundary square (front or top outline of the cube) */}
          <rect
            x={padding}
            y={padding}
            width={contentSize}
            height={contentSize}
            fill="#0f172a"
            fillOpacity="0.4"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="4,3"
            rx="2"
          />

          {/* Center reference crosshair */}
          <line
            x1={svgSize / 2}
            y1={padding + 5}
            x2={svgSize / 2}
            y2={svgSize - padding - 5}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2,4"
          />
          <line
            x1={padding + 5}
            y1={svgSize / 2}
            x2={svgSize - padding - 5}
            y2={svgSize / 2}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2,4"
          />

          {/* If Revealed: Draw the true projected wire */}
          {isRevealed && (
            <g className="transition-opacity duration-300">
              {/* Segments */}
              {projectedSegments.map((s, idx) => {
                if (s.isDegenerate) return null;
                const isActive = activeSegmentIndex === idx;

                // Midpoint for segment number pill
                const midX = (s.fromSvg.x + s.toSvg.x) / 2;
                const midY = (s.fromSvg.y + s.toSvg.y) / 2;

                return (
                  <g
                    key={`seg-${idx}`}
                    onMouseEnter={() => onHoverSegment && onHoverSegment(idx)}
                    onMouseLeave={() => onHoverSegment && onHoverSegment(null)}
                    className="cursor-pointer"
                  >
                    {/* Shadow / Glow */}
                    <line
                      x1={s.fromSvg.x}
                      y1={s.fromSvg.y}
                      x2={s.toSvg.x}
                      y2={s.toSvg.y}
                      stroke={isActive ? '#ef4444' : '#f59e0b'}
                      strokeWidth={isActive ? 8 : 6}
                      strokeOpacity={isActive ? 0.4 : 0.25}
                      strokeLinecap="round"
                    />

                    {/* Main stroke with direction arrow */}
                    <line
                      x1={s.fromSvg.x}
                      y1={s.fromSvg.y}
                      x2={s.toSvg.x}
                      y2={s.toSvg.y}
                      stroke={isActive ? '#ef4444' : '#f59e0b'}
                      strokeWidth={isActive ? 3.5 : 2.75}
                      strokeLinecap="round"
                      markerEnd={`url(#arrow${isActive ? '-active' : ''}-${projection})`}
                    />

                    {/* Step number badge at segment midpoint */}
                    <circle
                      cx={midX}
                      cy={midY}
                      r="7"
                      fill="#0f172a"
                      stroke={isActive ? '#ef4444' : '#f59e0b'}
                      strokeWidth="1.5"
                    />
                    <text
                      x={midX}
                      y={midY + 3}
                      textAnchor="middle"
                      fill={isActive ? '#ef4444' : '#fde68a'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {idx + 1}
                    </text>
                  </g>
                );
              })}

              {/* Degenerate point indicators (edges perpendicular to the projection plane) */}
              {degenerateSegments.map((s, dIdx) => (
                <g key={`deg-${dIdx}`}>
                  {/* Concentric rings to highlight perpendicular wire segment */}
                  <circle
                    cx={s.fromSvg.x}
                    cy={s.fromSvg.y}
                    r="12"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    className="animate-pulse"
                  />
                  <circle cx={s.fromSvg.x} cy={s.fromSvg.y} r="5" fill="#ec4899" />
                  <text
                    x={s.fromSvg.x}
                    y={s.fromSvg.y - 15}
                    textAnchor="middle"
                    fill="#f472b6"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    segment {s.index + 1} (kolmo)
                  </text>
                </g>
              ))}

              {/* Start & End vertex indicators */}
              {(() => {
                const startPos = cornerPositions[vertexToCornerId(wirePath.vertices[0])];
                const endPos = cornerPositions[vertexToCornerId(wirePath.vertices[wirePath.vertices.length - 1])];
                return (
                  <>
                    {startPos && (
                      <circle
                        cx={startPos.x}
                        cy={startPos.y}
                        r="6"
                        fill="#10b981"
                        stroke="#064e3b"
                        strokeWidth="1.5"
                      />
                    )}
                    {endPos && (
                      <circle
                        cx={endPos.x}
                        cy={endPos.y}
                        r="6"
                        fill="#a855f7"
                        stroke="#581c87"
                        strokeWidth="1.5"
                      />
                    )}
                  </>
                );
              })()}
            </g>
          )}

          {/* If Quiz Mode and User has clicked corners: draw user's predicted path */}
          {userPath.length > 1 && !isRevealed && (
            <g>
              {userPath.slice(0, -1).map((cId, i) => {
                const nextCId = userPath[i + 1];
                const p1 = cornerPositions[cId];
                const p2 = cornerPositions[nextCId];
                if (!p1 || !p2) return null;
                const isDegen = cId === nextCId;

                return (
                  <g key={`user-seg-${i}`}>
                    {isDegen ? (
                      <circle
                        cx={p1.x}
                        cy={p1.y}
                        r="9"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="2,2"
                      />
                    ) : (
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#38bdf8"
                        strokeWidth="3"
                        strokeDasharray="4,2"
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Interactive corner vertices (A, B, C, D, E, F, G, H projections) */}
          {cornerLabels.map(corner => {
            const pos = cornerPositions[corner.id];
            if (!pos) return null;

            // In quiz mode: allows clicking corners
            const canClick = isQuizMode && !isRevealed;

            // Label offset based on corner position
            const isLeft = corner.pos.x < 0;
            const isTop = corner.pos.y > 0;

            const textX = isLeft ? pos.x - 12 : pos.x + 12;
            const textY = isTop ? pos.y - 10 : pos.y + 16;
            const textAnchor = isLeft ? 'end' : 'start';

            return (
              <g
                key={corner.id}
                className={canClick ? 'cursor-pointer' : 'cursor-default'}
                onClick={() => canClick && handleCornerClick(corner.id)}
              >
                {/* Click target hit area */}
                {canClick && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="18"
                    fill="transparent"
                    className="hover:fill-sky-500/20 transition-colors"
                  />
                )}

                {/* Vertex node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="5"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />

                {/* Descriptive Geometry Label (e.g., E₂ ≡ H₂) */}
                <text
                  x={textX}
                  y={textY}
                  textAnchor={textAnchor}
                  fill="#f1f5f9"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                >
                  {corner.displayLabel}
                </text>

                {/* Subtext description on projection */}
                <text
                  x={textX}
                  y={textY + (isTop ? -11 : 11)}
                  textAnchor={textAnchor}
                  fill="#94a3b8"
                  fontSize="8.5"
                  fontFamily="sans-serif"
                >
                  {corner.description}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hidden Mystery Overlay when NOT revealed */}
        {!isRevealed && (
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[3px] flex flex-col items-center justify-center p-4 text-center select-none rounded-xl">
            <div className="w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center mb-2.5 shadow-inner">
              <EyeOff className="w-5 h-5 text-amber-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100">
              Průmět je skrytý
            </h4>
            <p className="text-xs text-slate-400 max-w-[210px] mt-1 leading-snug">
              Zkuste si představit, jak čára vypadá při pohledu {meta.subtitle.toLowerCase()}
            </p>

            <button
              onClick={onToggleReveal}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition-all hover:scale-105 active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Odkrýt {meta.title.toLowerCase()}</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer info or Quiz Controls */}
      <div className="px-3.5 py-2 bg-slate-950 border-t border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          {isRevealed ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Start: <strong className="text-slate-200">{wirePath.vertices[0]}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                Cíl: <strong className="text-slate-200">{wirePath.vertices[wirePath.vertices.length - 1]}</strong>
              </span>
              {degenerateSegments.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-pink-400 font-medium">
                    {degenerateSegments.length}× bodový průmět
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-slate-400 italic">
              Klikněte na „Odkrýt“ pro kontrolu vaší představy
            </span>
          )}
        </div>

        {/* Quick reveal/hide small button */}
        <button
          onClick={onToggleReveal}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          title={isRevealed ? 'Skrýt' : 'Odkrýt'}
        >
          {isRevealed ? 'Skrýt' : 'Odkrýt'}
        </button>
      </div>
    </div>
  );
};
