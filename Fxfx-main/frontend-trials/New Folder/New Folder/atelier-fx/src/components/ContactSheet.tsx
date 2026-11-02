import React, { useState } from 'react';
import { SceneShot, AspectRatioType } from '../types/studio';
import {
  SlidersHorizontal,
  ExternalLink,
  Download,
  Copy,
  SplitSquareVertical,
  Check,
  Filter,
} from 'lucide-react';

interface ContactSheetProps {
  shots: SceneShot[];
  onSelectShot: (shotId: string) => void;
  onNavigateToStaging: (shotId: string) => void;
  onNavigateToGrading: (shotId: string) => void;
}

export const ContactSheet: React.FC<ContactSheetProps> = ({
  shots,
  onSelectShot,
  onNavigateToStaging,
  onNavigateToGrading,
}) => {
  const [aspectFilter, setAspectFilter] = useState<'all' | AspectRatioType>('all');
  const [comparingShot, setComparingShot] = useState<SceneShot | null>(null);
  const [splitPosition, setSplitPosition] = useState(50); // percentage 0-100
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredShots = shots.filter((shot) => {
    if (aspectFilter === 'all') return true;
    return shot.aspectRatio === aspectFilter;
  });

  const handleCopyPrompt = (shot: SceneShot) => {
    navigator.clipboard.writeText(
      `${shot.promptSerif} ${shot.parameterTokens.join(' ')}`
    );
    setCopiedId(shot.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadStill = (shot: SceneShot) => {
    const a = document.createElement('a');
    a.href = shot.imageUrl;
    a.download = `AtelierFX_${shot.sceneNumber.replace(/[\s/]/g, '_')}_Take${shot.takeNumber}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#08090a] overflow-y-auto">
      {/* ARCHIVAL CONTACT SHEET HEADER */}
      <div className="p-6 bg-[#0d0e11] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif text-2xl text-[#f3efe0] font-normal">
              Archival 35mm Contact Sheet
            </span>
            <span className="text-white/20">/</span>
            <span className="font-mono text-xs text-[#ffc174] uppercase tracking-wider">
              Project Proofs
            </span>
          </div>
          <p className="font-grotesk text-xs text-[#94a3b8] max-w-xl">
            Physical proof sheet inspection for all synthesized frames, latent seeds, and photomechanical film passes.
          </p>
        </div>

        {/* Aspect Ratio Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#08090a] p-1 border border-white/[0.08]">
          <button
            onClick={() => setAspectFilter('all')}
            className={`px-3 py-1.5 text-xs font-mono transition-colors ${
              aspectFilter === 'all'
                ? 'bg-[#1c1f26] text-[#ffc174] border border-white/[0.12]'
                : 'text-[#94a3b8] hover:text-[#f3efe0]'
            }`}
          >
            All Takes ({shots.length})
          </button>
          <button
            onClick={() => setAspectFilter('16:9')}
            className={`px-3 py-1.5 text-xs font-mono transition-colors ${
              aspectFilter === '16:9'
                ? 'bg-[#1c1f26] text-[#ffc174] border border-white/[0.12]'
                : 'text-[#94a3b8] hover:text-[#f3efe0]'
            }`}
          >
            16:9 Flat
          </button>
          <button
            onClick={() => setAspectFilter('2.39:1')}
            className={`px-3 py-1.5 text-xs font-mono transition-colors ${
              aspectFilter === '2.39:1'
                ? 'bg-[#1c1f26] text-[#ffc174] border border-white/[0.12]'
                : 'text-[#94a3b8] hover:text-[#f3efe0]'
            }`}
          >
            2.39:1 Scope
          </button>
          <button
            onClick={() => setAspectFilter('4:3')}
            className={`px-3 py-1.5 text-xs font-mono transition-colors ${
              aspectFilter === '4:3'
                ? 'bg-[#1c1f26] text-[#ffc174] border border-white/[0.12]'
                : 'text-[#94a3b8] hover:text-[#f3efe0]'
            }`}
          >
            4:3 Academy
          </button>
        </div>
      </div>

      {/* CONTACT SHEET FRAME GRID */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredShots.map((shot, idx) => (
            <div
              key={shot.id}
              className="bg-[#0d0e11] border border-white/[0.1] hover:border-white/[0.25] transition-all flex flex-col shadow-xl group"
            >
              {/* 35mm Edge Code Header */}
              <div className="h-6 bg-[#08090a] border-b border-white/[0.08] px-3 flex items-center justify-between text-[9px] font-mono text-[#ffc174]">
                <span className="tracking-widest">
                  KODAK 500T 5219 · EDGE {(idx + 24).toString()}A
                </span>
                <span className="text-[#94a3b8]">
                  FRAME #{shot.takeNumber * 24} · TC {shot.timecodeStart}
                </span>
              </div>

              {/* Film Sprocket Perforations Top */}
              <div className="h-2 film-perforations-top opacity-70" />

              {/* Still Viewport Frame */}
              <div className="relative aspect-video bg-black overflow-hidden mx-2 border border-white/[0.1]">
                <img
                  src={shot.imageUrl}
                  alt={shot.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{
                    filter: `
                      brightness(${1 + shot.colorGrade.exposure * 0.4})
                      contrast(${shot.colorGrade.contrast})
                      saturate(${shot.colorGrade.saturation})
                    `,
                  }}
                  referrerPolicy="no-referrer"
                />

                {/* Film grain texture */}
                <div className="absolute inset-0 film-grain pointer-events-none opacity-40" />

                {/* Overlaid metadata badges */}
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm px-2 py-0.5 border border-white/[0.1] font-mono text-[10px] text-[#ffc174]">
                  {shot.sceneNumber}
                </div>

                <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-sm px-2 py-0.5 border border-white/[0.1] font-mono text-[10px] text-[#cac7b8] tabular-nums">
                  TAKE {shot.takeNumber} · SEED {shot.seed}
                </div>

                {/* Hover Quick Action Buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button
                    onClick={() => setComparingShot(shot)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14161b] hover:bg-[#1c1f26] text-[#ffc174] border border-[#f59e0b] text-xs font-mono shadow-md cursor-pointer"
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5" />
                    <span>A/B Split Diff</span>
                  </button>

                  <button
                    onClick={() => onNavigateToStaging(shot.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14161b] hover:bg-[#1c1f26] text-[#f3efe0] border border-white/[0.2] text-xs font-mono shadow-md cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#ffc174]" />
                    <span>Open in Staging</span>
                  </button>
                </div>
              </div>

              {/* Film Sprocket Perforations Bottom */}
              <div className="h-2 film-perforations-bottom opacity-70" />

              {/* Archival Card Body Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="font-serif text-lg text-[#f3efe0] font-normal">
                      {shot.title}
                    </h4>
                    <span className="font-mono text-xs text-[#ffc174] border border-[#f59e0b]/30 px-2 py-0.5">
                      {shot.aspectRatio}
                    </span>
                  </div>

                  <p className="font-serif italic text-xs text-[#cac7b8] leading-relaxed line-clamp-2 mb-3">
                    "{shot.promptSerif}"
                  </p>

                  {/* Token pills */}
                  <div className="flex flex-wrap gap-1">
                    {shot.parameterTokens.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 bg-[#14161b] border border-white/[0.08] text-[9px] font-mono text-[#94a3b8]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Actions Row */}
                <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyPrompt(shot)}
                      className="flex items-center gap-1 text-[#94a3b8] hover:text-[#f3efe0] transition-colors"
                      title="Copy Prompt & Parameters"
                    >
                      {copiedId === shot.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10b981]" />
                          <span className="text-[#10b981]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateToGrading(shot.id)}
                      className="flex items-center gap-1 text-[#94a3b8] hover:text-[#ffc174] transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Grade</span>
                    </button>

                    <button
                      onClick={() => handleDownloadStill(shot)}
                      className="flex items-center gap-1 text-[#94a3b8] hover:text-[#f3efe0] transition-colors"
                      title="Download Archival 4K Still"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Frame</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* A/B SPLIT COMPARISON MODAL */}
      {comparingShot && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.1] text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-[#ffc174] font-medium">A/B SPLIT INSPECTOR</span>
              <span className="text-white/20">|</span>
              <span className="text-[#f3efe0] font-serif text-base">
                {comparingShot.title}
              </span>
              <span className="text-white/20">|</span>
              <span className="text-[#94a3b8]">
                RAW Latent Render vs. Kodak Vision3 500T Master
              </span>
            </div>

            <button
              onClick={() => setComparingShot(null)}
              className="px-3 py-1 bg-[#14161b] hover:bg-[#1c1f26] border border-white/[0.15] text-[#f3efe0] text-xs font-mono"
            >
              Close Inspector (ESC)
            </button>
          </div>

          {/* Interactive Split Viewport */}
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
            <div className="relative max-w-5xl w-full aspect-video border border-white/[0.2] overflow-hidden select-none bg-black">
              {/* Side B: Color Graded Master (Full width behind) */}
              <img
                src={comparingShot.imageUrl}
                alt="Color Graded Master"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: `
                    brightness(${1 + comparingShot.colorGrade.exposure * 0.4})
                    contrast(${comparingShot.colorGrade.contrast})
                    saturate(${comparingShot.colorGrade.saturation})
                  `,
                }}
                referrerPolicy="no-referrer"
              />

              {/* Side A: Raw Latent Un-Graded (Clipped to left side) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                style={{ width: `${splitPosition}%` }}
              >
                <img
                  src={comparingShot.imageUrl}
                  alt="Raw Latent"
                  className="absolute inset-y-0 left-0 h-full object-cover max-w-none"
                  style={{
                    width: '100%',
                    filter: 'grayscale(0.3) contrast(0.95)',
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-black/80 px-2 py-1 text-[11px] font-mono text-[#cac7b8] border border-white/[0.1]">
                  SIDE A: RAW LATENT EMULSION
                </div>
              </div>

              {/* Side B Tag */}
              <div className="absolute top-4 right-4 bg-black/80 px-2 py-1 text-[11px] font-mono text-[#ffc174] border border-[#f59e0b]/40">
                SIDE B: KODAK 5219 VISION3 MASTER
              </div>

              {/* Scrub Slider Input Overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={splitPosition}
                onChange={(e) => setSplitPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />
            </div>
          </div>

          {/* Slider Position HUD */}
          <div className="pt-2 text-center text-xs font-mono text-[#94a3b8] tabular-nums">
            SPLIT DIVIDER: {splitPosition}% · DRAG HORIZONTALLY TO COMPARE LATENT EMULSION AND COLOR GRADE
          </div>
        </div>
      )}
    </div>
  );
};
