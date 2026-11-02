import React, { useState } from 'react';
import { SceneShot, AspectRatioType } from '../types/studio';
import { LENS_PROFILES, FILM_STOCKS } from '../data/mockProduction';
import {
  Sparkles,
  Camera,
  Layers,
  Grid,
  Crosshair,
  Maximize2,
  Play,
  RotateCcw,
  Plus,
  Compass,
  Aperture,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

interface StagingDirectorProps {
  shots: SceneShot[];
  activeShot: SceneShot;
  onSelectShot: (shotId: string) => void;
  onUpdateShot: (updated: SceneShot) => void;
  onOpenDirectorModal: () => void;
  onOpenGrading: () => void;
}

export const StagingDirector: React.FC<StagingDirectorProps> = ({
  shots,
  activeShot,
  onSelectShot,
  onUpdateShot,
  onOpenDirectorModal,
  onOpenGrading,
}) => {
  const [showGrid, setShowGrid] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [showLetterboxScope, setShowLetterboxScope] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [promptText, setPromptText] = useState(activeShot.promptSerif);

  // Sync promptText if active shot changes
  React.useEffect(() => {
    setPromptText(activeShot.promptSerif);
  }, [activeShot.id, activeShot.promptSerif]);

  const activeLens = LENS_PROFILES.find((l) => l.id === activeShot.lensId) || LENS_PROFILES[0];
  const activeStock = FILM_STOCKS.find((f) => f.id === activeShot.filmStockId) || FILM_STOCKS[0];

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPromptText(val);
    onUpdateShot({
      ...activeShot,
      promptSerif: val,
    });
  };

  const handleAddToken = (token: string) => {
    if (!activeShot.parameterTokens.includes(token)) {
      const updatedTokens = [...activeShot.parameterTokens, token];
      onUpdateShot({
        ...activeShot,
        parameterTokens: updatedTokens,
      });
    }
  };

  const handleRemoveToken = (tokenToRemove: string) => {
    const updatedTokens = activeShot.parameterTokens.filter((t) => t !== tokenToRemove);
    onUpdateShot({
      ...activeShot,
      parameterTokens: updatedTokens,
    });
  };

  const handleAspectRatioChange = (ar: AspectRatioType) => {
    // Update ar token
    const filteredTokens = activeShot.parameterTokens.filter((t) => !t.startsWith('--ar'));
    const updatedTokens = [...filteredTokens, `--ar ${ar}`];
    onUpdateShot({
      ...activeShot,
      aspectRatio: ar,
      parameterTokens: updatedTokens,
    });
  };

  const handleLensChange = (lensId: string) => {
    const lens = LENS_PROFILES.find((l) => l.id === lensId);
    if (!lens) return;
    const filtered = activeShot.parameterTokens.filter((t) => !t.startsWith('--lens'));
    const updatedTokens = [...filtered, `--lens ${lens.focalLength}`];
    onUpdateShot({
      ...activeShot,
      lensId,
      parameterTokens: updatedTokens,
    });
  };

  const handleFilmStockChange = (stockId: string) => {
    const stock = FILM_STOCKS.find((s) => s.id === stockId);
    if (!stock) return;
    const filtered = activeShot.parameterTokens.filter((t) => !t.startsWith('--film'));
    const updatedTokens = [...filtered, `--film ${stock.id}`];
    onUpdateShot({
      ...activeShot,
      filmStockId: stockId,
      parameterTokens: updatedTokens,
    });
  };

  const triggerRender = () => {
    if (isRendering) return;
    setIsRendering(true);
    setRenderProgress(0);
    setCurrentStep(1);

    const totalSteps = activeShot.steps || 30;
    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        const next = prev + 100 / totalSteps;
        if (next >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          // Increment take count
          onUpdateShot({
            ...activeShot,
            takeNumber: activeShot.takeNumber + 1,
            seed: Math.floor(Math.random() * 899999) + 100000,
          });
          return 100;
        }
        setCurrentStep(Math.min(totalSteps, Math.floor((next / 100) * totalSteps) + 1));
        return next;
      });
    }, 50);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#08090a]">
      {/* LEFT RAIL: Scenes & Acts List (Collapsed/Compact Drawer) */}
      <aside className="w-full lg:w-64 bg-[#0d0e11] border-r border-white/[0.07] flex flex-col shrink-0">
        <div className="p-3.5 border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-[#f3efe0] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Scene Directory</span>
          </div>
          <span className="text-[10px] font-mono text-[#94a3b8] tabular-nums">
            {shots.length} SCENES
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {shots.map((shot, idx) => {
            const isSelected = shot.id === activeShot.id;
            return (
              <div
                key={shot.id}
                onClick={() => onSelectShot(shot.id)}
                className={`p-2.5 transition-all cursor-pointer border select-none ${
                  isSelected
                    ? 'bg-[#1c1f26] border-[#f59e0b]/50 shadow-[0_0_15px_-4px_rgba(245,158,11,0.2)]'
                    : 'bg-[#14161b] border-white/[0.05] hover:border-white/[0.15] hover:bg-[#181a20]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className={isSelected ? 'text-[#ffc174]' : 'text-[#94a3b8]'}>
                    {shot.sceneNumber}
                  </span>
                  <span className="text-[#94a3b8] tabular-nums">
                    TAKE {shot.takeNumber} · {shot.duration.toFixed(1)}s
                  </span>
                </div>

                <div className="flex gap-2.5 items-center">
                  <div className="w-16 h-10 bg-black overflow-hidden shrink-0 border border-white/[0.1] relative">
                    <img
                      src={shot.imageUrl}
                      alt={shot.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-serif text-[#f3efe0] truncate font-medium">
                      {shot.title}
                    </p>
                    <p className="text-[10px] font-mono text-[#94a3b8] mt-0.5 truncate">
                      {shot.aspectRatio} · {shot.seed}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2 border-t border-white/[0.07] bg-[#090a0d]">
          <button
            onClick={() => {
              const newShot: SceneShot = {
                id: `shot-${Date.now()}`,
                title: `Scene 0${shots.length + 1}: Uncharted Frame`,
                sceneNumber: `SCENE 0${shots.length + 1} / REEL C`,
                takeNumber: 1,
                duration: 5.5,
                timecodeStart: '00:00:28:15',
                promptSerif: 'Atmospheric 35mm film shot in low-angle chiaroscuro lighting, subtle film halation around luminous glass prism.',
                parameterTokens: ['--ar 16:9', '--chaos 10', '--film kodak-500t', '--lens panavision-40mm', '--shutter 180', `--seed ${Math.floor(Math.random() * 800000 + 100000)}`],
                imageUrl: activeShot.imageUrl,
                aspectRatio: '16:9',
                lensId: 'panavision-c',
                filmStockId: 'kodak-5219',
                seed: Math.floor(Math.random() * 800000 + 100000),
                cfgScale: 7.0,
                steps: 30,
                colorGrade: { ...activeShot.colorGrade },
                tags: ['Exterior', 'Atmospheric'],
              };
              onSelectShot(newShot.id);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#14161b] hover:bg-[#1c1f26] text-[11px] font-mono text-[#cac7b8] border border-white/[0.08] hover:border-white/[0.2] transition-colors"
          >
            <Plus className="w-3 h-3 text-[#ffc174]" />
            <span>Add Sequence Scene</span>
          </button>
        </div>
      </aside>

      {/* CENTER & BOTTOM: Staging Viewport and Parameter Prompt Deck */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* VIEWPORT CONTROLS BAR */}
        <div className="px-4 py-2 bg-[#0d0e11] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
          <div className="flex items-center gap-3">
            <span className="text-[#ffc174] font-medium tracking-wider">
              {activeShot.sceneNumber}
            </span>
            <span className="text-white/20">|</span>
            <span className="text-[#94a3b8] flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#ffc174]" />
              {activeLens.name}
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="hidden sm:inline text-[#94a3b8] tabular-nums">
              SHUTTER {activeLens.shutterAngle} · {activeStock.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Rule of Thirds Grid"
              className={`p-1.5 border transition-colors ${
                showGrid
                  ? 'bg-[#1c1f26] border-[#f59e0b] text-[#f59e0b]'
                  : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8] hover:text-[#f3efe0]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowCrosshair(!showCrosshair)}
              title="Toggle Center Crosshair"
              className={`p-1.5 border transition-colors ${
                showCrosshair
                  ? 'bg-[#1c1f26] border-[#f59e0b] text-[#f59e0b]'
                  : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8] hover:text-[#f3efe0]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowLetterboxScope(!showLetterboxScope)}
              title="Toggle 2.39:1 Cinemascope Matte"
              className={`px-2 py-1 border text-[10px] uppercase transition-colors ${
                showLetterboxScope
                  ? 'bg-[#1c1f26] border-[#f59e0b] text-[#f59e0b]'
                  : 'bg-[#14161b] border-white/[0.08] text-[#94a3b8] hover:text-[#f3efe0]'
              }`}
            >
              2.39 Matte
            </button>

            <button
              onClick={onOpenGrading}
              className="flex items-center gap-1 px-2 py-1 bg-[#14161b] hover:bg-[#1c1f26] border border-white/[0.08] text-[#94a3b8] hover:text-[#ffc174] text-[10px] uppercase transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3 text-[#ffc174]" />
              <span>Color Grade</span>
            </button>
          </div>
        </div>

        {/* MAIN CINEMATIC FRAME VIEWPORT */}
        <div className="flex-1 relative bg-[#060708] flex items-center justify-center p-4 lg:p-6 overflow-hidden">
          {/* Subtle Ambient Studio Vignette */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />

          {/* Film Frame Container */}
          <div
            className={`relative max-w-full max-h-full transition-all duration-300 border border-white/[0.15] shadow-2xl overflow-hidden bg-black ${
              activeShot.aspectRatio === '2.39:1'
                ? 'aspect-[2.39/1] w-[950px]'
                : activeShot.aspectRatio === '16:9'
                ? 'aspect-[16/9] w-[860px]'
                : activeShot.aspectRatio === '4:3'
                ? 'aspect-[4/3] w-[640px]'
                : activeShot.aspectRatio === '1:1'
                ? 'aspect-square w-[560px]'
                : 'aspect-[9/16] w-[340px]'
            }`}
          >
            {/* Master Render Image */}
            <img
              src={activeShot.imageUrl}
              alt={activeShot.title}
              className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-700"
              style={{
                filter: `
                  brightness(${1 + activeShot.colorGrade.exposure * 0.4})
                  contrast(${activeShot.colorGrade.contrast})
                  saturate(${activeShot.colorGrade.saturation})
                  sepia(${activeShot.colorGrade.temperature > 0 ? activeShot.colorGrade.temperature * 0.005 : 0})
                  hue-rotate(${activeShot.colorGrade.temperature < 0 ? activeShot.colorGrade.temperature * 0.3 : 0}deg)
                `,
                transform: isPlayingPreview ? 'scale(1.03)' : 'scale(1.0)',
              }}
              referrerPolicy="no-referrer"
            />

            {/* Film Grain Texture Overlay */}
            <div className="absolute inset-0 film-grain pointer-events-none mix-blend-overlay" />

            {/* Anamorphic Flare Streak Simulation */}
            {activeShot.colorGrade.anamorphicFlare > 20 && (
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-[#ffb95f]/40 to-transparent pointer-events-none blur-[2px] opacity-75"
                style={{
                  boxShadow: `0 0 ${activeShot.colorGrade.anamorphicFlare * 0.5}px rgba(255, 185, 95, 0.6)`,
                }}
              />
            )}

            {/* Letterbox Scope Bars (2.39:1 overlay if enabled on 16:9) */}
            {showLetterboxScope && (
              <>
                <div className="absolute top-0 inset-x-0 h-[12.5%] bg-black pointer-events-none z-10 border-b border-white/[0.05]" />
                <div className="absolute bottom-0 inset-x-0 h-[12.5%] bg-black pointer-events-none z-10 border-t border-white/[0.05]" />
              </>
            )}

            {/* Rule of Thirds Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            )}

            {/* Center Crosshair */}
            {showCrosshair && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div className="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#f59e0b]" />
                </div>
              </div>
            )}

            {/* Live Denoising / Render Simulation Overlay */}
            {isRendering && (
              <div className="absolute inset-0 bg-[#08090a]/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-2 border-[#2a2e39] border-t-[#f59e0b] rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                <p className="font-serif text-lg text-[#f3efe0] italic mb-1">
                  Synthesizing 35mm Latent Coordinates...
                </p>
                <p className="font-mono text-xs text-[#94a3b8] mb-4 tabular-nums">
                  INFERENCE STEP {currentStep} OF {activeShot.steps} · SEED #{activeShot.seed}
                </p>
                <div className="w-64 h-1.5 bg-[#14161b] rounded-full overflow-hidden border border-white/[0.1]">
                  <div
                    className="h-full bg-gradient-to-r from-[#f59e0b] to-[#ffc174] transition-all duration-75"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Bottom Telemetry HUD overlay in viewport */}
            <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[10px] font-mono text-[#cac7b8] bg-black/60 backdrop-blur-md px-2.5 py-1 border border-white/[0.08] z-10">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#10b981]" />
                <span className="tabular-nums">FRAME #{activeShot.takeNumber * 24}</span>
                <span className="text-white/20">/</span>
                <span>TC {activeShot.timecodeStart}</span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span>CFG {activeShot.cfgScale.toFixed(1)}</span>
                <span className="text-white/20">/</span>
                <span>STEPS {activeShot.steps}</span>
                <span className="text-white/20">/</span>
                <span>SEED {activeShot.seed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM STAGING PROMPT & PARAMETER INJECTION DECK */}
        <section className="bg-[#0d0e11] border-t border-white/[0.07] p-3.5 lg:p-4 space-y-3 shrink-0">
          {/* Header Row: Title & Staging Tools */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-[#ffc174] tracking-wider">
                Prompt Staging Deck
              </span>
              <span className="text-white/20 text-xs">/</span>
              <span className="text-[11px] font-mono text-[#94a3b8]">
                Editorial Narrative & Parameter Injection
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenDirectorModal}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#14161b] hover:bg-[#1c1f26] border border-[#f59e0b]/40 text-[#ffc174] text-xs font-mono transition-all hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              >
                <Sparkles className="w-3 h-3 text-[#f59e0b]" />
                <span>AI Director Prompt Engine</span>
              </button>
            </div>
          </div>

          {/* Editorial Prompt Input Area with Inset Depth */}
          <div className="relative bg-[#08090a] border border-white/[0.09] shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)] p-3">
            <textarea
              value={promptText}
              onChange={handlePromptChange}
              rows={2}
              className="w-full bg-transparent text-[#f3efe0] font-serif text-sm lg:text-base leading-relaxed resize-none focus:outline-none placeholder:text-white/25 selection:bg-[#f59e0b]/30"
              placeholder="Describe scene composition, camera movement, natural light dynamics, and filmic nuances..."
            />

            {/* Active Parameter Tokens Row */}
            <div className="mt-2 pt-2 border-t border-white/[0.05] flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#94a3b8] uppercase mr-1">
                Active Tokens:
              </span>
              {activeShot.parameterTokens.map((token) => (
                <span
                  key={token}
                  className="group inline-flex items-center gap-1 px-2 py-0.5 bg-[#14161b] border border-white/[0.1] text-[10px] font-mono text-[#cac7b8] hover:border-[#f59e0b]/50 transition-colors"
                >
                  <span className="text-[#ffc174]">{token.split(' ')[0]}</span>
                  <span>{token.split(' ').slice(1).join(' ')}</span>
                  <button
                    onClick={() => handleRemoveToken(token)}
                    className="text-white/30 hover:text-[#e11d48] ml-0.5 text-xs"
                    title="Remove token"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tactical Parameter Injectors & Render Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Quick Token Pickers */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {/* Aspect Ratio Selector */}
              <div className="flex items-center gap-1 bg-[#08090a] p-1 border border-white/[0.07]">
                {(['2.39:1', '16:9', '4:3', '1:1', '9:16'] as AspectRatioType[]).map((ar) => (
                  <button
                    key={ar}
                    onClick={() => handleAspectRatioChange(ar)}
                    className={`px-2 py-0.5 text-[10px] transition-colors ${
                      activeShot.aspectRatio === ar
                        ? 'bg-[#1c1f26] text-[#ffc174] border border-white/[0.15]'
                        : 'text-[#94a3b8] hover:text-[#f3efe0]'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>

              {/* Lens Quick Selector */}
              <select
                value={activeShot.lensId}
                onChange={(e) => handleLensChange(e.target.value)}
                className="bg-[#08090a] text-[#cac7b8] border border-white/[0.07] px-2 py-1 text-[10px] focus:outline-none focus:border-[#f59e0b]"
              >
                {LENS_PROFILES.map((lens) => (
                  <option key={lens.id} value={lens.id}>
                    {lens.name}
                  </option>
                ))}
              </select>

              {/* Film Stock Selector */}
              <select
                value={activeShot.filmStockId}
                onChange={(e) => handleFilmStockChange(e.target.value)}
                className="bg-[#08090a] text-[#cac7b8] border border-white/[0.07] px-2 py-1 text-[10px] focus:outline-none focus:border-[#f59e0b]"
              >
                {FILM_STOCKS.map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    {stock.name} ({stock.format})
                  </option>
                ))}
              </select>

              {/* Quick Lens/Light Presets */}
              <button
                onClick={() => handleAddToken('--camera dolly-in-slow')}
                className="px-2 py-1 bg-[#14161b] hover:bg-[#1c1f26] text-[#94a3b8] hover:text-[#f3efe0] border border-white/[0.05] text-[10px]"
              >
                + Dolly In
              </button>
              <button
                onClick={() => handleAddToken('--lighting sodium-chiaroscuro')}
                className="px-2 py-1 bg-[#14161b] hover:bg-[#1c1f26] text-[#94a3b8] hover:text-[#f3efe0] border border-white/[0.05] text-[10px]"
              >
                + Sodium Vapor
              </button>
              <button
                onClick={() => handleAddToken('--grain 35mm-authentic')}
                className="px-2 py-1 bg-[#14161b] hover:bg-[#1c1f26] text-[#94a3b8] hover:text-[#f3efe0] border border-white/[0.05] text-[10px]"
              >
                + Kodak Grain
              </button>
            </div>

            {/* Tactical Render CTA Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                className="p-2 bg-[#14161b] hover:bg-[#1c1f26] border border-white/[0.1] text-[#94a3b8] hover:text-[#f3efe0] text-xs font-mono"
                title="Preview Motion"
              >
                <Play className={`w-3.5 h-3.5 ${isPlayingPreview ? 'text-[#10b981]' : ''}`} />
              </button>

              <button
                onClick={triggerRender}
                disabled={isRendering}
                className="relative group flex items-center gap-2 px-5 py-2 bg-[#14161b] hover:bg-[#1c1f26] border border-white/[0.2] hover:border-[#f59e0b] text-xs font-mono uppercase tracking-wider text-[#f3efe0] shadow-sm hover:shadow-[0_0_24px_-4px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <Aperture className={`w-3.5 h-3.5 text-[#ffc174] ${isRendering ? 'animate-spin' : ''}`} />
                <span>{isRendering ? 'Synthesizing...' : 'Stage & Render Take'}</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
