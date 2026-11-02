import React from 'react';
import { SceneShot, ColorGradeSettings } from '../types/studio';
import { FILM_STOCKS } from '../data/mockProduction';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Download,
  Copy,
  Check,
  Flame,
  SunMedium,
  Palette,
  Film,
} from 'lucide-react';

interface GradingSuiteProps {
  activeShot: SceneShot;
  onUpdateShot: (updated: SceneShot) => void;
  onApplyToAllShots: (grade: ColorGradeSettings) => void;
}

export const GradingSuite: React.FC<GradingSuiteProps> = ({
  activeShot,
  onUpdateShot,
  onApplyToAllShots,
}) => {
  const [copiedLut, setCopiedLut] = React.useState(false);
  const grade = activeShot.colorGrade;

  const updateGrade = (updates: Partial<ColorGradeSettings>) => {
    onUpdateShot({
      ...activeShot,
      colorGrade: {
        ...grade,
        ...updates,
      },
    });
  };

  const handleReset = () => {
    updateGrade({
      exposure: 0,
      contrast: 1.0,
      temperature: 0,
      saturation: 1.0,
      lutIntensity: 80,
      halationIntensity: 20,
      grainDensity: 35,
      anamorphicFlare: 30,
      vignette: 20,
    });
  };

  const handleExportLut = () => {
    // Generate .cube 3D LUT file download
    const cubeHeader = `# Atelier FX Photochemical 3D LUT Emulation\n# Stock: ${grade.filmStock}\nLUT_3D_SIZE 17\n`;
    let cubeData = cubeHeader;
    for (let r = 0; r < 17; r++) {
      for (let g = 0; g < 17; g++) {
        for (let b = 0; b < 17; b++) {
          const rVal = (r / 16).toFixed(6);
          const gVal = (g / 16).toFixed(6);
          const bVal = (b / 16).toFixed(6);
          cubeData += `${rVal} ${gVal} ${bVal}\n`;
        }
      }
    }
    const blob = new Blob([cubeData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AtelierFX_${grade.filmStock}_Grade.cube`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopiedLut(true);
    setTimeout(() => setCopiedLut(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#08090a] overflow-hidden">
      {/* LEFT/CENTER: Live Graded Canvas Viewport */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-white/[0.07] overflow-hidden">
        {/* Grading Header bar */}
        <div className="p-3.5 bg-[#0d0e11] border-b border-white/[0.07] flex items-center justify-between text-xs font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="text-[#ffc174] font-medium uppercase tracking-wider">
              {activeShot.sceneNumber}
            </span>
            <span className="text-white/20">/</span>
            <span className="text-[#f3efe0] font-serif text-sm">
              {activeShot.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[#94a3b8] hover:text-[#f3efe0] transition-colors text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Grade</span>
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={() => onApplyToAllShots(grade)}
              className="flex items-center gap-1 text-[#94a3b8] hover:text-[#ffc174] transition-colors text-[11px]"
            >
              <Copy className="w-3 h-3" />
              <span>Copy to All Takes</span>
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="flex-1 bg-[#060708] flex items-center justify-center p-6 relative overflow-hidden select-none">
          <div className="relative max-w-full max-h-full aspect-[16/9] w-[820px] border border-white/[0.15] shadow-2xl overflow-hidden bg-black">
            {/* Live Graded Image */}
            <img
              src={activeShot.imageUrl}
              alt={activeShot.title}
              className="w-full h-full object-cover select-none"
              style={{
                filter: `
                  brightness(${1 + grade.exposure * 0.4})
                  contrast(${grade.contrast})
                  saturate(${grade.saturation})
                  sepia(${grade.temperature > 0 ? grade.temperature * 0.005 : 0})
                  hue-rotate(${grade.temperature < 0 ? grade.temperature * 0.3 : 0}deg)
                `,
              }}
              referrerPolicy="no-referrer"
            />

            {/* Live Photochemical Halation Layer */}
            {grade.halationIntensity > 0 && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70"
                style={{
                  boxShadow: `inset 0 0 ${grade.halationIntensity * 1.2}px rgba(225, 29, 72, 0.4)`,
                }}
              />
            )}

            {/* Anamorphic Flare Streak */}
            {grade.anamorphicFlare > 0 && (
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-[#ffb95f]/50 to-transparent pointer-events-none blur-[1.5px]"
                style={{
                  opacity: grade.anamorphicFlare / 100,
                  boxShadow: `0 0 ${grade.anamorphicFlare * 0.4}px rgba(245, 158, 11, 0.7)`,
                }}
              />
            )}

            {/* Vignette Overlay */}
            {grade.vignette > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, transparent ${100 - grade.vignette * 0.6}%, rgba(0,0,0,${grade.vignette * 0.01}) 100%)`,
                }}
              />
            )}

            {/* Live Film Grain Layer */}
            <div
              className="absolute inset-0 film-grain pointer-events-none mix-blend-overlay"
              style={{ opacity: grade.grainDensity / 100 }}
            />

            {/* In-Frame Status Pill */}
            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 border border-white/[0.08] text-[10px] font-mono text-[#ffc174] tabular-nums">
              LIVE 3D LUT APPLIED · {grade.filmStock.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT RAIL: Latent Parameters & Grading Deck */}
      <aside className="w-full lg:w-80 bg-[#0d0e11] flex flex-col shrink-0 overflow-y-auto select-none border-l border-white/[0.07]">
        {/* Rail Title */}
        <div className="p-3.5 border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#f3efe0] tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Grading Console</span>
          </div>
          <button
            onClick={handleExportLut}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#14161b] hover:bg-[#1c1f26] border border-white/[0.1] text-[10px] font-mono text-[#cac7b8] hover:text-[#ffc174] transition-colors"
          >
            {copiedLut ? (
              <>
                <Check className="w-3 h-3 text-[#10b981]" />
                <span className="text-[#10b981]">Exported</span>
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                <span>Export .CUBE</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 space-y-6 text-xs font-mono">
          {/* SECTION 1: FILM STOCK LUT EMULATION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[#cac7b8]">
              <span className="text-[#ffc174] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" />
                Photochemical Stock
              </span>
              <span className="text-[#94a3b8] text-[10px]">35mm Emulsion</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {FILM_STOCKS.map((stock) => (
                <button
                  key={stock.id}
                  onClick={() => updateGrade({ filmStock: stock.id })}
                  className={`p-2 text-left border transition-all ${
                    grade.filmStock === stock.id
                      ? 'bg-[#1c1f26] border-[#f59e0b] text-[#f3efe0] shadow-sm'
                      : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8] hover:text-[#f3efe0]'
                  }`}
                >
                  <div className="text-[10px] font-bold truncate">{stock.name}</div>
                  <div className="text-[9px] text-[#ffc174] mt-0.5">ISO {stock.iso}</div>
                </button>
              ))}
            </div>

            {/* LUT Blend Intensity */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>LUT Blend Weight</span>
                <span className="text-[#f3efe0] tabular-nums">{grade.lutIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={grade.lutIntensity}
                onChange={(e) => updateGrade({ lutIntensity: Number(e.target.value) })}
                className="w-full studio-slider"
              />
            </div>
          </div>

          {/* SECTION 2: EXPOSURE & TONE CURVES */}
          <div className="space-y-3 pt-3 border-t border-white/[0.07]">
            <span className="text-[#ffc174] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <SunMedium className="w-3.5 h-3.5" />
              Exposure & Density
            </span>

            {/* Exposure Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>Exposure EV</span>
                <span className="text-[#f3efe0] tabular-nums">
                  {grade.exposure > 0 ? `+${grade.exposure.toFixed(2)}` : grade.exposure.toFixed(2)} EV
                </span>
              </div>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.05"
                value={grade.exposure}
                onChange={(e) => updateGrade({ exposure: Number(e.target.value) })}
                className="w-full studio-slider"
              />
            </div>

            {/* Contrast Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>Gamma Contrast</span>
                <span className="text-[#f3efe0] tabular-nums">{grade.contrast.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.02"
                value={grade.contrast}
                onChange={(e) => updateGrade({ contrast: Number(e.target.value) })}
                className="w-full studio-slider"
              />
            </div>

            {/* Color Temperature */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>Color Temperature</span>
                <span className="text-[#f3efe0] tabular-nums">
                  {grade.temperature > 0 ? `+${grade.temperature}K (Warm)` : `${grade.temperature}K (Cool)`}
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                value={grade.temperature}
                onChange={(e) => updateGrade({ temperature: Number(e.target.value) })}
                className="w-full studio-slider"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>Chroma Saturation</span>
                <span className="text-[#f3efe0] tabular-nums">{grade.saturation.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={grade.saturation}
                onChange={(e) => updateGrade({ saturation: Number(e.target.value) })}
                className="w-full studio-slider"
              />
            </div>
          </div>

          {/* SECTION 3: ANALOG FILM OPTICS */}
          <div className="space-y-3 pt-3 border-t border-white/[0.07]">
            <span className="text-[#ffc174] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#e11d48]" />
              Optics & Emulsion
            </span>

            {/* Halation */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>Photochemical Halation</span>
                <span className="text-[#f3efe0] tabular-nums">{grade.halationIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={grade.halationIntensity}
                onChange={(e) => updateGrade({ halationIntensity: Number(e.target.value) })}
                className="w-full studio-slider"
              />
            </div>

            {/* Film Grain */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>35mm Silver Halide Grain</span>
                <span className="text-[#f3efe0] tabular-nums">{grade.grainDensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={grade.grainDensity}
                onChange={(e) => updateGrade({ grainDensity: Number(e.target.value) })}
                className="w-full studio-slider"
              />
            </div>

            {/* Anamorphic Flare Streak */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>Anamorphic Streak Bloom</span>
                <span className="text-[#f3efe0] tabular-nums">{grade.anamorphicFlare}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={grade.anamorphicFlare}
                onChange={(e) => updateGrade({ anamorphicFlare: Number(e.target.value) })}
                className="w-full studio-slider"
              />
            </div>

            {/* Vignette */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>Lens Barrel Vignette</span>
                <span className="text-[#f3efe0] tabular-nums">{grade.vignette}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                value={grade.vignette}
                onChange={(e) => updateGrade({ vignette: Number(e.target.value) })}
                className="w-full studio-slider"
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
