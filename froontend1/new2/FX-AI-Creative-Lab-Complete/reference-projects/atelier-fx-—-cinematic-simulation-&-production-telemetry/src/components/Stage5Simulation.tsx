import React, { useState, useEffect } from 'react';
import {
  CinematicScene,
  LensSpec,
  LightingFixture,
  AudioStem,
  StageId
} from '../types';
import { SCENES, LENSES, INITIAL_FIXTURES, INITIAL_AUDIO_STEMS } from '../data';
import { lithicAudio } from '../utils/audioEngine';

interface Props {
  isRtl: boolean;
  activeSceneId: number;
  setActiveSceneId: (id: number) => void;
  onNavigateToStage: (stage: StageId) => void;
  onOpenCallSheet: () => void;
  onOpenAlternateCoverage: () => void;
  peakingActive: boolean;
  setPeakingActive: React.Dispatch<React.SetStateAction<boolean>>;
  falseColorActive: boolean;
  setFalseColorActive: React.Dispatch<React.SetStateAction<boolean>>;
  zebraActive: boolean;
  setZebraActive: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLensId: string;
  setSelectedLensId: (id: string) => void;
  isAudioPlaying: boolean;
  setIsAudioPlaying: (playing: boolean) => void;
}

export const Stage5Simulation: React.FC<Props> = ({
  isRtl,
  activeSceneId,
  setActiveSceneId,
  onNavigateToStage,
  onOpenCallSheet,
  onOpenAlternateCoverage,
  peakingActive,
  setPeakingActive,
  falseColorActive,
  setFalseColorActive,
  zebraActive,
  setZebraActive,
  selectedLensId,
  setSelectedLensId,
  isAudioPlaying,
  setIsAudioPlaying
}) => {
  // Lighting Fixtures state
  const [fixtures, setFixtures] = useState<LightingFixture[]>(INITIAL_FIXTURES);

  // Audio Stems state
  const [stems, setStems] = useState<AudioStem[]>(INITIAL_AUDIO_STEMS);

  // Viewfinder settings
  const [aspect169, setAspect169] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [streakFlareStrength, setStreakFlareStrength] = useState(84);
  const [caFringe, setCaFringe] = useState(0.18);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Running timecode
  const [frames, setFrames] = useState(14);
  const [seconds, setSeconds] = useState(19);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrames((prev) => {
        if (prev >= 23) {
          setSeconds((s) => (s + 1) % 60);
          return 0;
        }
        return prev + 1;
      });
    }, 1000 / 24);
    return () => clearInterval(timer);
  }, []);

  const currentScene = SCENES.find((s) => s.id === activeSceneId) || SCENES[2];
  const currentLens = LENSES.find((l) => l.id === selectedLensId) || LENSES[0];

  // Recalculate generator load based on dimmer sliders
  const totalGeneratorLoad = (
    (fixtures[0].dimmer * 8.2 + fixtures[1].dimmer * 6.5 + fixtures[2].dimmer * 29.0) /
    100
  ).toFixed(1);

  const handleFixtureDimmer = (id: string, value: number) => {
    setFixtures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, dimmer: value } : f))
    );
  };

  const handleToggleStemMute = (id: string) => {
    setStems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, muted: !s.muted } : s))
    );
  };

  const handleToggleStemSolo = (id: string) => {
    setStems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, solo: !s.solo } : s))
    );
  };

  const handlePlayClapperSlate = () => {
    lithicAudio.playClapper();
    showToast('🎬 تم تسجيل صوت الكلاکت والمزامنة الصوتية (Slate Synced A01)');
  };

  const handleToggleAudioEngine = () => {
    const active = lithicAudio.togglePlayback();
    setIsAudioPlaying(active);
    showToast(
      active
        ? '🔊 تم تفعيل تردد الرنين الصخري 24Hz وهسيس الرياح'
        : '🔇 تم إيقاف الصوت الميداني'
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#f59e0b] text-[#472a00] font-bold px-5 py-2.5 rounded-lg shadow-2xl font-mono text-xs animate-bounce border border-white/20">
          {toastMessage}
        </div>
      )}

      {/* Top Stage Masthead & Director's Status Ribbon */}
      <section className="w-full bg-[#0d0e11] px-6 py-4 border-b border-white/[0.07]">
        <div className="w-full max-w-[1720px] mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          {/* Stage Identification & Live Stream Telemetry */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#ffc174] tracking-widest uppercase bg-[#292a2d] px-2 py-0.5 rounded font-bold">
                FX // STAGE 05
              </span>
              <span className="font-serif text-lg text-[#e3e2e6] font-semibold">
                محاكاة الإنتاج الميداني والقياسات البصرية السينمائية
              </span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* Live AI Telemetry Node */}
            <div className="flex items-center gap-2 bg-[#1b1b1f] px-3 py-1 rounded border border-white/5">
              <div className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping absolute opacity-75" />
                <span className="w-2 h-2 rounded-full bg-[#ffc174]" />
              </div>
              <span className="font-mono text-[10px] text-[#ffc174] font-bold tracking-wider">
                [يُحاكي // SIMULATING]
              </span>
              <span className="text-white/20 font-mono text-[10px]">|</span>
              <span className="font-mono text-[10px] text-[#cac7b8]">
                ARRI /i Data: 2.39:1 SQUEEZE
              </span>
              <span className="text-white/20 font-mono text-[10px]">|</span>
              <span className="font-mono text-[10px] text-[#ffb95f]">
                LATENCY: 18ms
              </span>
            </div>
          </div>

          {/* Quick Stage Switcher & Current Project Capsule */}
          <div className="flex items-center gap-6 w-full xl:w-auto justify-between xl:justify-end">
            <div className="hidden lg:flex items-center p-0.5 bg-[#1f1f23] rounded text-[#d8c3ad] font-mono text-[10px] border border-white/5">
              <button
                onClick={() => onNavigateToStage(1)}
                className="px-2 py-1 hover:text-white transition"
              >
                ١. الموجز
              </button>
              <span className="px-1 text-white/20 select-none">←</span>
              <button
                onClick={() => onNavigateToStage(2)}
                className="px-2 py-1 hover:text-white transition"
              >
                ٢. الرؤية
              </button>
              <span className="px-1 text-white/20 select-none">←</span>
              <button
                onClick={() => onNavigateToStage(3)}
                className="px-2 py-1 hover:text-white transition"
              >
                ٣. الفكرة
              </button>
              <span className="px-1 text-white/20 select-none">←</span>
              <button
                onClick={() => onNavigateToStage(4)}
                className="px-2 py-1 hover:text-white transition"
              >
                ٤. السيناريو
              </button>
              <span className="px-1 text-white/20 select-none">←</span>
              <span className="px-2 py-1 bg-[#343538] text-[#ffc174] font-bold rounded shadow-sm">
                ٥. المحاكاة البصرية
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#292a2d] px-3 py-1 rounded border border-white/5">
              <span className="material-symbols-outlined text-[#ffc174] text-[16px]">
                movie_edit
              </span>
              <span className="font-mono text-[10px] text-[#e3e2e6] font-medium">
                ساعة الصمت المطلق / CHRONO AL-ULA
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Virtual Viewfinder Section: 2.39:1 Anamorphic HUD */}
      <section className="w-full bg-[#0d0e11] px-6 pt-4 pb-8">
        <div className="w-full max-w-[1720px] mx-auto rounded-xl bg-[#1b1b1f] overflow-hidden shadow-2xl border border-white/10 relative">
          {/* Top Monitor Strip / Metadata */}
          <div className="h-10 bg-[#0d0e11] flex items-center justify-between px-4 font-mono text-[11px] text-[#cac7b8] border-b border-white/[0.05]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[#ffb4ab] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                REC RAW
              </span>
              <span className="text-white/20">|</span>
              <span className="text-white font-mono font-semibold">
                TC 04:48:{seconds.toString().padStart(2, '0')}:{frames.toString().padStart(2, '0')}
              </span>
              <span className="text-white/20 hidden sm:inline">|</span>
              <span className="text-[#ffb95f] font-mono hidden md:inline">
                SENSOR: ALEXA 65 OPEN-GATE (6560×3102)
              </span>
            </div>

            {/* Live Scene Selector Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-[#cac7b8]/70 ml-2 hidden xl:inline text-[10px]">اللقطة المستهدفة:</span>
              {SCENES.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setActiveSceneId(scene.id);
                    setSelectedLensId(scene.defaultLensId);
                  }}
                  className={`px-2.5 py-0.5 rounded text-[10px] transition-colors whitespace-nowrap ${
                    scene.id === activeSceneId
                      ? 'bg-[#343538] text-[#ffc174] font-bold border border-[#f59e0b]/40 shadow-sm'
                      : 'bg-[#1f1f23] text-[#cac7b8] hover:text-white hover:bg-[#292a2d]'
                  }`}
                >
                  {scene.titleAr}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3 text-[#cac7b8] text-[10px]">
              <span className="font-mono">FPS: 24.000</span>
              <span className="text-white/20">|</span>
              <span className="text-[#10b981] font-mono">GENLOCK: LOCKED</span>
            </div>
          </div>

          {/* Viewfinder Stage Screen: 2.39:1 Anamorphic Canvas Preview */}
          <div
            className={`relative w-full ${
              aspect169 ? 'aspect-[16/9]' : 'aspect-[2.39/1]'
            } bg-[#0d0e11] overflow-hidden group transition-all duration-300 min-h-[380px] sm:min-h-[440px]`}
          >
            {/* Rendered Scene Layer */}
            <div
              className={`absolute inset-0 bg-cover bg-center transition-all duration-700 filter contrast-105 ${
                falseColorActive ? 'hud-false-color' : ''
              } ${peakingActive ? 'hud-peaking' : ''}`}
              style={{
                backgroundImage: `url('${currentScene.imageUrl}')`,
                transform: currentLens.id === '110mm' ? 'scale(1.25)' : currentLens.id === '80mm' ? 'scale(1.12)' : currentLens.id === '35mm' ? 'scale(1.0)' : 'scale(1.05)',
                transition: 'transform 0.5s ease-out, opacity 0.3s ease-out'
              }}
            />

            {/* Zebra Highlight Layer */}
            {zebraActive && (
              <div className="absolute inset-0 pointer-events-none hud-zebra opacity-40 mix-blend-overlay" />
            )}

            {/* Anamorphic Lens Flare Line (Horizontal Streak) */}
            <div
              className="absolute top-[52%] left-0 right-0 pointer-events-none transition-opacity duration-300"
              style={{ opacity: streakFlareStrength / 100 }}
            >
              <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#ffc174] to-transparent blur-[0.5px]" />
              <div className="h-[5px] -mt-[2px] bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent blur-[3px] opacity-60" />
            </div>

            {/* Atmospheric Grain and Vignette Filter Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e11]/85 via-transparent to-[#0d0e11]/60 pointer-events-none film-grain" />

            {/* HUD: Anamorphic Scope Frame Overlay Lines & Crosshairs */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-8 md:p-10">
              {/* Outer Anamorphic Mask Borders */}
              <div className="absolute inset-x-6 sm:inset-x-12 top-4 bottom-4 border border-white/20 rounded-sm">
                {/* Corner Reticles */}
                <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#ffc174]" />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#ffc174]" />
                <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#ffc174]" />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#ffc174]" />

                {/* Optical Center Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                  <div className="w-full h-px bg-[#ffc174]/60" />
                  <div className="h-full w-px bg-[#ffc174]/60 absolute" />
                  <div className="w-2.5 h-2.5 rounded-full border border-[#ffc174]/80 absolute" />
                </div>

                {/* Rule of Thirds Guides */}
                {showGrid && (
                  <>
                    <div className="absolute inset-y-0 left-1/3 w-px border-r border-dashed border-white/10" />
                    <div className="absolute inset-y-0 right-1/3 w-px border-r border-dashed border-white/10" />
                    <div className="absolute inset-x-0 top-1/3 h-px border-b border-dashed border-white/10" />
                    <div className="absolute inset-x-0 bottom-1/3 h-px border-b border-dashed border-white/10" />
                  </>
                )}
              </div>

              {/* Top HUD Telemetry Readouts */}
              <div className="relative z-10 flex items-center justify-between font-mono text-[10px] text-[#e3e2e6]">
                <div className="flex items-center gap-2 bg-[#0d0e11]/90 backdrop-blur-md px-3 py-1 rounded border border-white/10 shadow-lg">
                  <span className="text-[#ffc174] font-bold">{currentScene.locationAr}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-[#cac7b8] font-mono">T-STOP: {currentScene.tStop}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-[#10b981] font-mono">
                    FOCUS: {currentScene.focusDistance} [LIDAR LOCK]
                  </span>
                </div>

                {/* Exposure False Color & Histogram Pill */}
                <div className="hidden sm:flex items-center gap-3 bg-[#0d0e11]/90 backdrop-blur-md px-3 py-1 rounded border border-white/10 shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#cac7b8] text-[9px]">HISTOGRAM</span>
                    <svg className="w-16 h-4 text-[#ffc174]" fill="currentColor" viewBox="0 0 64 16">
                      <path
                        d="M0,16 Q8,14 16,8 Q24,2 32,5 Q40,9 48,2 Q56,12 64,16 L64,16 L0,16 Z"
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                  <span className="text-white/20">|</span>
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-[#cac7b8] text-[9px]">ETTR:</span>
                    <span className="text-[#f59e0b] font-bold">+0.3 EV</span>
                  </div>
                </div>
              </div>

              {/* Bottom HUD Telemetry Readouts */}
              <div className="relative z-10 flex flex-wrap items-end justify-between gap-3 font-mono text-[10px]">
                {/* Left Rig Parameters */}
                <div className="flex flex-wrap items-center gap-1 bg-[#0d0e11]/90 backdrop-blur-md p-1 rounded border border-white/10 shadow-lg">
                  <div className="px-1.5 py-0.5 rounded bg-[#292a2d] text-white">ISO {currentScene.iso}</div>
                  <div className="px-1.5 py-0.5 rounded bg-[#292a2d] text-white">SHUTTER {currentScene.shutter}</div>
                  <div className="px-1.5 py-0.5 rounded bg-[#292a2d] text-white">WB {currentScene.wb}</div>
                  <div className="px-1.5 py-0.5 rounded bg-[#292a2d] text-white">SQUEEZE {currentLens.squeeze.split(' ')[0]}</div>
                  <div className="px-1.5 py-0.5 rounded bg-[#292a2d] text-[#ffc174] font-bold">{currentLens.name}</div>
                </div>

                {/* Right Interactive Viewfinder Overlays Switcher */}
                <div className="flex items-center gap-1.5 bg-[#0d0e11]/90 backdrop-blur-md p-1 rounded border border-white/10 shadow-lg pointer-events-auto">
                  <button
                    onClick={() => {
                      setPeakingActive(!peakingActive);
                      showToast(peakingActive ? 'تم إيقاف قناع التركيز' : 'تم تفعيل قناع التركيز (Focus Peaking)');
                    }}
                    className={`px-2.5 py-1 rounded font-mono text-[10px] transition-colors flex items-center gap-1 ${
                      peakingActive
                        ? 'bg-[#f59e0b]/20 text-[#ffc174] border border-[#f59e0b]/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'bg-[#1f1f23] hover:bg-[#292a2d] text-[#cac7b8]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${peakingActive ? 'bg-[#ffc174] animate-pulse' : 'bg-neutral-500'}`} />
                    PEAKING
                  </button>

                  <button
                    onClick={() => {
                      setZebraActive(!zebraActive);
                      showToast(zebraActive ? 'تم إيقاف نمط الزيبرا' : 'تم تفعيل تحذير الإشباع (Zebra 70%)');
                    }}
                    className={`px-2.5 py-1 rounded font-mono text-[10px] transition-colors ${
                      zebraActive
                        ? 'bg-[#f59e0b]/20 text-[#ffc174] border border-[#f59e0b]/50'
                        : 'bg-[#1f1f23] hover:bg-[#292a2d] text-[#cac7b8]'
                    }`}
                  >
                    ZEBRA 70%
                  </button>

                  <button
                    onClick={() => {
                      setFalseColorActive(!falseColorActive);
                      showToast(falseColorActive ? 'تم إيقاف فحص التعريض' : 'تم تفعيل False Color');
                    }}
                    className={`px-2.5 py-1 rounded font-mono text-[10px] transition-colors ${
                      falseColorActive
                        ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/50'
                        : 'bg-[#1f1f23] hover:bg-[#292a2d] text-[#cac7b8]'
                    }`}
                  >
                    FALSE COLOR
                  </button>

                  <button
                    onClick={() => setAspect169(!aspect169)}
                    className="px-2 py-1 rounded bg-[#1f1f23] hover:bg-[#292a2d] text-[#cac7b8] font-mono text-[10px]"
                    title="تبديل نسبة الإطار بين 2.39:1 و 16:9"
                  >
                    {aspect169 ? '16:9' : '2.39:1'}
                  </button>

                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-2 py-1 rounded font-mono text-[10px] ${
                      showGrid ? 'text-[#ffc174] bg-[#292a2d]' : 'text-[#cac7b8] bg-[#1f1f23]'
                    }`}
                    title="شبكة الإرشاد"
                  >
                    #
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Virtual Viewfinder Toolbar Ribbon */}
          <div className="bg-[#1f1f23] p-2.5 flex flex-wrap items-center justify-between gap-3 text-[#e3e2e6] font-mono text-[10px] border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[#cac7b8] font-medium">بيانات الإرسال المباشر:</span>
              <span className="text-[#ffc174]">LUT: ARRI_LOGC4_KODAK_5219_EMULATION_V3</span>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="text-[#cac7b8] hidden sm:inline">GAMMA: 2.4 REC709 BROADCAST READY</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#cac7b8]">مستوى تغطية المستشعر:</span>
              <div className="w-24 h-1.5 bg-[#343538] rounded-full overflow-hidden">
                <div className="w-[96%] h-full bg-[#f59e0b]" />
              </div>
              <span className="text-[#ffc174] font-bold">96.4%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modular Production Lab Grid (3 Columns: Optics, Lighting/DMX, Lithic Acoustics) */}
      <section className="w-full max-w-[1720px] mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Right Column (RTL Col 1): Anamorphic Optics Rig & Telemetry (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#1f1f23] p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffc174] text-[20px]">
                    lens
                  </span>
                  <h3 className="font-serif text-lg text-[#e3e2e6] font-medium">
                    حزمة العدسات الأنامورفيكية
                  </h3>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#343538] text-[#ffc174] uppercase font-bold">
                  ARRI /i PROTOCOL
                </span>
              </div>
              <p className="text-xs text-[#d8c3ad] leading-relaxed">
                معايرة الانحراف البيضاوي ومحاكاة تشتت التوهج على صخور العلا الرملية.
              </p>

              {/* Lens Selector Grid */}
              <div className="grid grid-cols-2 gap-2">
                {LENSES.map((lens) => (
                  <button
                    key={lens.id}
                    onClick={() => {
                      setSelectedLensId(lens.id);
                      showToast(`تم تركيب عدسة ${lens.name}`);
                    }}
                    className={`p-3 rounded text-right transition-all border ${
                      selectedLensId === lens.id
                        ? 'bg-[#343538] border-[#f59e0b]/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-[#1b1b1f] border-white/5 hover:bg-[#292a2d] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-base text-[#ffc174] font-bold font-mono">
                        {lens.focalLength}
                      </span>
                      {selectedLensId === lens.id && (
                        <span className="font-mono text-[9px] text-[#ffc174] bg-[#f59e0b]/10 px-1.5 py-0.2 rounded border border-[#f59e0b]/30">
                          نشط الآن
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-[#cac7b8] mt-1 truncate">
                      {lens.name} • {lens.maxAperture}
                    </div>
                    <div className="font-mono text-[9px] text-[#d8c3ad]/80 mt-0.5">
                      FOV {lens.fov} | {lens.squeeze}
                    </div>
                  </button>
                ))}
              </div>

              {/* Distortion Curve Interactive Diagram */}
              <div className="p-3 bg-[#0d0e11] rounded border border-white/5 space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#cac7b8]">
                  <span>منحنى التشوه البصري (BARREL DISTORTION)</span>
                  <span className="text-[#ffc174] font-bold">
                    {currentLens.distortionPct > 0 ? `+${currentLens.distortionPct}%` : `${currentLens.distortionPct}%`} (عضوي)
                  </span>
                </div>

                {/* SVG Barrel Curve Vector Graph */}
                <div className="w-full h-24 bg-[#1b1b1f] rounded flex items-center justify-center p-2 relative overflow-hidden border border-white/5">
                  <svg className="w-full h-full text-[#ffc174]" fill="none" stroke="currentColor" viewBox="0 0 200 60">
                    <line stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="200" y1="30" y2="30" />
                    <line stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" strokeWidth="1" x1="100" x2="100" y1="0" y2="60" />
                    <path d="M10,48 Q100,6 190,48" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M10,48 Q100,6 190,48 L190,60 L10,60 Z" fill="rgba(245,158,11,0.08)" />
                    <circle cx="100" cy="27" fill="#ffc174" r="3" />
                    <circle cx="30" cy="42" fill="#ffc174" r="2" />
                    <circle cx="170" cy="42" fill="#ffc174" r="2" />
                  </svg>
                  <div className="absolute bottom-1 right-2 font-mono text-[8px] text-[#d8c3ad]">
                    SAGITTAL / TANGENTIAL MTF
                  </div>
                </div>

                {/* Optical Telemetry Parameter Sliders */}
                <div className="space-y-1.5 pt-1 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-[#cac7b8]">
                    <span>تشتت الانحراف اللوني (CA Fringe):</span>
                    <span className="text-white">{caFringe}px [مضبوط]</span>
                  </div>
                  <div className="flex items-center justify-between text-[#cac7b8]">
                    <span>توهج العدسة الأفقي (Streak Flare):</span>
                    <span className="text-[#ffc174]">{streakFlareStrength}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={streakFlareStrength}
                    onChange={(e) => setStreakFlareStrength(Number(e.target.value))}
                    className="w-full h-1 bg-[#292a2d] rounded-lg appearance-none cursor-pointer accent-[#f59e0b]"
                  />
                  <div className="flex items-center justify-between text-[#cac7b8] pt-1">
                    <span>استدارة البوكيه البيضاوي (Bokeh Ovality):</span>
                    <span className="text-white">1.85:1</span>
                  </div>
                </div>
              </div>

              {/* Micro-Texture MTF50 Resolution Card */}
              <div className="p-3 bg-[#292a2d] rounded border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffc174] text-[20px]">
                    grain
                  </span>
                  <div>
                    <div className="font-mono text-[10px] text-white font-bold">
                      حدة حبيبات الحجر الرملي MTF50
                    </div>
                    <div className="font-mono text-[9px] text-[#cac7b8]">
                      {currentLens.mtfCenter} lp/mm عند مركز العدسة
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[9px] text-[#ffc174] font-bold bg-[#f59e0b]/10 px-2 py-1 rounded border border-[#f59e0b]/30">
                  معاير 4K+
                </span>
              </div>
            </div>
          </div>

          {/* Center Column: Photometric Lighting Grid & DMX Topology (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#1f1f23] p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffc174] text-[20px]">
                    light_group
                  </span>
                  <h3 className="font-serif text-lg text-[#e3e2e6] font-medium">
                    مخطط الإضاءة الفوتومترية للـ Gaffer
                  </h3>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#343538] text-[#ffc174] uppercase font-bold">
                  CRMX WIRELESS MESH
                </span>
              </div>
              <p className="text-xs text-[#d8c3ad] leading-relaxed">
                توزيع طاقة وحدات الإنارة الفائقة وقياسات اللوكس على جدران الصخور الأثرية.
              </p>

              {/* Fixture Cards Stack */}
              <div className="space-y-2.5">
                {fixtures.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 bg-[#0d0e11] rounded border border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${f.id === 'fixture-skypanel' ? 'bg-[#ffc174]' : f.id === 'fixture-orbiter' ? 'bg-[#f59e0b]' : 'bg-[#cac7b8]'}`} />
                        <span className="text-white font-bold">{f.name}</span>
                      </div>
                      <span className="text-[#ffc174] font-bold">{f.lux} LUX {f.luxDistance}</span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[9px] text-[#cac7b8]">
                      <span>{f.cct}</span>
                      <span>DMX: {f.universe}</span>
                    </div>

                    {/* Dimmer Slider Bar */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-mono text-[8px] text-[#cac7b8]">DIM:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={f.dimmer}
                        onChange={(e) => handleFixtureDimmer(f.id, Number(e.target.value))}
                        className="flex-1 h-1.5 bg-[#292a2d] rounded-lg appearance-none cursor-pointer accent-[#f59e0b]"
                      />
                      <span className="font-mono text-[10px] text-[#ffc174] w-8 text-left">{f.dimmer}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DMX Mesh Topology & Battery Power telemetry */}
              <div className="p-3 bg-[#292a2d] rounded border border-white/5 space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-[#cac7b8]">حالة شبكة الإشارة اللاسلكية CRMX:</span>
                  <span className="text-[#10b981] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    LINKED 100% (4 Universes)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[9px]">
                  <div className="p-2 bg-[#0d0e11] rounded border border-white/5">
                    <div className="text-[#cac7b8]/70">حمولة المولد</div>
                    <div className="text-[#ffc174] font-bold text-xs mt-0.5">{totalGeneratorLoad} kW</div>
                  </div>
                  <div className="p-2 bg-[#0d0e11] rounded border border-white/5">
                    <div className="text-[#cac7b8]/70">حرارة الصمام</div>
                    <div className="text-white font-bold text-xs mt-0.5">58° C</div>
                  </div>
                  <div className="p-2 bg-[#0d0e11] rounded border border-white/5">
                    <div className="text-[#cac7b8]/70">بطاريات Block</div>
                    <div className="text-[#ffc174] font-bold text-xs mt-0.5">88% (6.2h)</div>
                  </div>
                </div>
              </div>

              {/* Photometric Lux Heat-Map Mini Indicator */}
              <div className="p-2.5 bg-[#0d0e11] rounded border border-white/5 flex items-center justify-between font-mono text-[9px]">
                <span className="text-[#cac7b8]">تدرج شدة الضوء (Rock Fall-off):</span>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" />
                  <span className="text-[#cac7b8]">Key (14K)</span>
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#ffc174] ml-1" />
                  <span className="text-[#cac7b8]">Fill (4K)</span>
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#343538] ml-1" />
                  <span className="text-[#cac7b8]">Shadow (120)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Left Column: Lithic Acoustic Engine & Sub-Bass Telemetry (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#1f1f23] p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffc174] text-[20px]">
                    graphic_eq
                  </span>
                  <h3 className="font-serif text-lg text-[#e3e2e6] font-medium">
                    هندسة الصوت والأكوستيك الترددي
                  </h3>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#343538] text-[#ffc174] uppercase font-bold">
                  LITHIC SUB-BASS 24Hz
                </span>
              </div>
              <p className="text-xs text-[#d8c3ad] leading-relaxed">
                محاكاة الرنين الترددي لصخور الحجر الرملي وتوازن القنوات الصوتية للبيئة المحيطة.
              </p>

              {/* Live Web Audio Engine Trigger */}
              <div className="p-3 bg-[#0d0e11] rounded border border-white/5 space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-[#cac7b8]">محلل الطيف الترددي (32-Band RTA)</span>
                  <button
                    onClick={handleToggleAudioEngine}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono transition flex items-center gap-1 ${
                      isAudioPlaying
                        ? 'bg-[#ef4444]/20 text-[#ffb4ab] border border-[#ef4444]/40'
                        : 'bg-[#f59e0b]/20 text-[#ffc174] border border-[#f59e0b]/40 hover:bg-[#f59e0b]/30'
                    }`}
                  >
                    <span>{isAudioPlaying ? '⏹ إيقاف الصوت الحي' : '▶ تشغيل الصوت الحي (24Hz Drone)'}</span>
                  </button>
                </div>

                {/* Animated Spectrum Equalizer Bars */}
                <div className="w-full h-24 bg-[#1b1b1f] rounded p-2 flex items-end justify-between gap-1 border border-white/5">
                  {[75, 88, 94, 65, 40, 32, 50, 62, 45, 28, 35, 22, 18, 14, 12, 10].map((h, i) => (
                    <div
                      key={i}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        i < 4
                          ? 'bg-[#f59e0b]'
                          : i < 8
                          ? 'bg-[#ffc174]'
                          : 'bg-[#becee4]/60'
                      }`}
                      style={{
                        height: isAudioPlaying ? `${Math.min(100, Math.max(15, h + (Math.sin(frames + i) * 20)))}%` : `${h}%`
                      }}
                    />
                  ))}
                </div>

                <div className="flex justify-between text-[8px] font-mono text-[#cac7b8] px-1">
                  <span>20Hz (رنين الأرض)</span>
                  <span>1kHz (صوت الراوي)</span>
                  <span>16kHz (صفير الريح)</span>
                </div>
              </div>

              {/* Stems Audio Mixer */}
              <div className="space-y-2">
                {stems.map((stem) => (
                  <div
                    key={stem.id}
                    className="p-2.5 bg-[#0d0e11] rounded border border-white/5 flex items-center justify-between font-mono text-[10px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stem.color }} />
                      <div>
                        <span className="text-white font-bold block">{stem.titleAr}</span>
                        <span className="text-[#cac7b8] text-[9px]">{stem.micAr}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stem.id === 'stem-drone' ? (
                        <button
                          onClick={() => handleToggleStemSolo(stem.id)}
                          className={`px-2 py-0.5 rounded text-[9px] transition ${
                            stem.solo
                              ? 'bg-[#f59e0b] text-[#472a00] font-bold'
                              : 'bg-[#292a2d] text-[#cac7b8]'
                          }`}
                        >
                          SOLO
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStemMute(stem.id)}
                          className={`px-2 py-0.5 rounded text-[9px] transition ${
                            stem.muted
                              ? 'bg-[#ef4444] text-white font-bold'
                              : 'bg-[#292a2d] text-[#cac7b8]'
                          }`}
                        >
                          {stem.muted ? 'MUTED' : 'MUTE'}
                        </button>
                      )}
                      <span className="text-[#ffc174] font-bold w-12 text-left">{stem.volume} dB</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Acoustic Resonance Factor */}
              <div className="p-3 bg-[#292a2d] rounded border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ffc174] text-[20px]">
                    surround_sound
                  </span>
                  <div>
                    <div className="font-mono text-[10px] text-white font-bold">
                      زمن ارتداد الصدى RT60
                    </div>
                    <div className="font-mono text-[9px] text-[#cac7b8]">
                      2.84 ثانية في الفالق الصخري
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[9px] text-[#ffc174] font-bold bg-[#f59e0b]/10 px-2 py-1 rounded border border-[#f59e0b]/30">
                  Spatial 7.1.4
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Production Slate & Master Export Execution Dock */}
      <section className="w-full bg-[#0d0e11] px-6 py-6 border-t border-white/[0.07]">
        <div className="w-full max-w-[1720px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Hollywood-Grade Production Slate Metadata Tile */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div
              onClick={handlePlayClapperSlate}
              className="p-3 bg-[#1f1f23] rounded-xl flex items-center gap-4 cursor-pointer hover:bg-[#292a2d] transition border border-white/10 group"
              title="اضغط هنا لتفعيل صوت الكلاکت والمزامنة"
            >
              <div className="w-12 h-12 bg-[#343538] group-hover:bg-[#f59e0b] group-hover:text-[#472a00] transition rounded flex flex-col items-center justify-center font-mono font-bold text-white leading-none">
                <span className="text-[#ffc174] group-hover:text-[#472a00] text-[9px]">SCENE</span>
                <span className="font-serif text-lg mt-0.5">03</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 font-mono text-[10px]">
                <div>
                  <span className="text-[#cac7b8]/70 block">TAKE (اللقطة):</span>
                  <span className="text-white font-bold">04 (DIR CUT)</span>
                </div>
                <div>
                  <span className="text-[#cac7b8]/70 block">SOUND SYNC:</span>
                  <span className="text-[#ffc174] font-bold">A01 DUAL-REC</span>
                </div>
                <div>
                  <span className="text-[#cac7b8]/70 block">DATE (التاريخ):</span>
                  <span className="text-white">2025.10.14</span>
                </div>
                <div>
                  <span className="text-[#cac7b8]/70 block">ROLL / MEDIA:</span>
                  <span className="text-[#cac7b8]">MAG_04 [2TB]</span>
                </div>
              </div>
            </div>

            <div className="hidden xl:flex flex-col text-[#d8c3ad] font-mono text-[10px]">
              <span className="text-white font-bold">حالة المصادقة الإنتاجية:</span>
              <span>جاهز للإرسال المباشر إلى فرق الإخراج والتصوير الميداني</span>
            </div>
          </div>

          {/* High-Priority Contextual Actions & Dispatch Triggers */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* Generate Alternate Coverage Button */}
            <button
              onClick={onOpenAlternateCoverage}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1f1f23] hover:bg-[#292a2d] text-[#e3e2e6] font-mono text-[11px] tracking-wider transition border border-white/5"
            >
              <span className="material-symbols-outlined text-[16px] text-[#ffc174]">
                auto_mode
              </span>
              <span>توليد لقطات بديلة (⌘G)</span>
            </button>

            {/* Sync with AI Engine Button */}
            <button
              onClick={() => showToast('✓ تمت المزامنة مع محرك التصوير التوليدي وكاميرا ARRI Alexa 65')}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#292a2d] hover:bg-[#343538] text-[#ffc174] font-mono text-[11px] tracking-wider transition border border-[#f59e0b]/30"
            >
              <span className="material-symbols-outlined text-[16px]">sync_alt</span>
              <span>مزامنة المحرك التوليدي</span>
            </button>

            {/* Primary Master Call-Sheet & Lighting Plot Export */}
            <button
              onClick={onOpenCallSheet}
              className="flex items-center gap-2 px-5 py-2 rounded bg-[#f59e0b] text-[#472a00] hover:bg-[#ffb95f] font-mono text-[11px] tracking-wider font-bold shadow-lg transition"
            >
              <span className="material-symbols-outlined text-[18px]">
                picture_as_pdf
              </span>
              <span>تصدير وثيقة التصوير والمخطط الضوئي (DP Call Sheet)</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
