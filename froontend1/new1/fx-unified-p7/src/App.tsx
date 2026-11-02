/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StageId } from './types';
import { SCENES, LENSES, INITIAL_FIXTURES } from './data';
import { Stage1Brief } from './components/Stage1Brief';
import { Stage2Vision } from './components/Stage2Vision';
import { Stage3Concept } from './components/Stage3Concept';
import { Stage4Script } from './components/Stage4Script';
import { Stage5Simulation } from './components/Stage5Simulation';
import { CallSheetModal } from './components/CallSheetModal';
import { AlternateCoverageModal } from './components/AlternateCoverageModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { buildScenes } from './services/scenes';
import { EMPTY_WORK, type Work } from './services/fx';
import { lithicAudio } from './utils/audioEngine';

export default function App() {
  const [currentStage, setCurrentStage] = useState<StageId>(1);
  const [activeSceneId, setActiveSceneId] = useState<number>(3);
  const [selectedLensId, setSelectedLensId] = useState<string>('35mm');
  const [isRtl, setIsRtl] = useState<boolean>(true);
  const [work, setWork] = useState<Work>(() => {
    try { return { ...EMPTY_WORK, ...JSON.parse(localStorage.getItem('fx-work-v1') || '{}') }; } catch { return EMPTY_WORK; }
  });
  useEffect(() => { try { localStorage.setItem('fx-work-v1', JSON.stringify(work)); } catch { /* التخزين غير متاح */ } }, [work]);

  // HUD filters
  const [peakingActive, setPeakingActive] = useState<boolean>(false);
  const [falseColorActive, setFalseColorActive] = useState<boolean>(false);
  const [zebraActive, setZebraActive] = useState<boolean>(false);

  // Audio state
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // Modals
  const [isCallSheetOpen, setIsCallSheetOpen] = useState<boolean>(false);
  const [isCoverageOpen, setIsCoverageOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Keyboard shortcut listener for ⌘K and ⌘G
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        setIsCoverageOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update HTML document dir attribute when isRtl changes
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = isRtl ? 'ar' : 'en';
  }, [isRtl]);

  const built = useMemo(() => (work.concept ? buildScenes(work) : null), [work]);
  const scenes = built?.sim ?? SCENES;
  const currentScene = scenes.find((s) => s.id === activeSceneId) || scenes[2] || scenes[0];
  const currentLens = LENSES.find((l) => l.id === selectedLensId) || LENSES[0];

  const handleApplyCoverage = (coverageTitle: string, promptText: string) => {
    // Feedback toast simulation
    alert(`✓ تم اعتماد الزاوية البديلة: "${coverageTitle}" ومزامنتها مع المحرك التوليدي!`);
  };

  const handleToggleAudio = () => {
    const active = lithicAudio.togglePlayback();
    setIsAudioPlaying(active);
  };

  const handlePlayClapper = () => {
    lithicAudio.playClapper();
  };

  return (
    <div className={`min-h-screen bg-[#121316] text-[#e3e2e6] flex flex-col ${isRtl ? 'font-sans' : 'font-sans'}`}>
      {/* Top Global Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0d0e11]/95 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="h-16 w-full max-w-[1720px] mx-auto px-6 flex items-center justify-between gap-4">
          
          {/* Brand & Project Info */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tracking-widest text-[#ffc174] uppercase font-bold">
                FX
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#343538] text-[#cac7b8] tracking-wider">
                {isRtl ? '[مُختبر السرد]' : '[NARRATIVE LAB]'}
              </span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="hidden lg:flex items-center gap-1.5 text-[#cac7b8] font-mono text-[10px] tracking-wider">
              <span className="text-[#cac7b8]/60">{isRtl ? 'المشروع:' : 'Project:'}</span>
              <span className="text-[#e3e2e6] font-medium truncate max-w-[220px] xl:max-w-none">
                {work.concept?.title ?? (isRtl ? 'كرونو العلا / الساعة المكتومة' : 'Chrono Al-Ula / The Unspoken Hour')}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse mr-1" />
            </div>
          </div>

          {/* 5-Stage Navigation Ribbon */}
          <nav className="hidden md:flex items-center p-0.5 bg-[#0d0e11] rounded border border-white/[0.07] text-[#cac7b8] font-mono text-[10px] tracking-wider">
            <button
              onClick={() => setCurrentStage(1)}
              className={`px-3 py-1.5 rounded transition ${
                currentStage === 1 ? 'bg-[#343538] text-[#ffc174] font-bold shadow-sm' : 'hover:text-white hover:bg-[#1f1f23]'
              }`}
            >
              ١. الموجز
            </button>
            <div className="text-white/20 select-none px-1">←</div>

            <button
              onClick={() => setCurrentStage(2)}
              className={`px-3 py-1.5 rounded transition ${
                currentStage === 2 ? 'bg-[#343538] text-[#ffc174] font-bold shadow-sm' : 'hover:text-white hover:bg-[#1f1f23]'
              }`}
            >
              ٢. الرؤية
            </button>
            <div className="text-white/20 select-none px-1">←</div>

            <button
              onClick={() => setCurrentStage(3)}
              className={`px-3 py-1.5 rounded transition ${
                currentStage === 3 ? 'bg-[#343538] text-[#ffc174] font-bold shadow-sm' : 'hover:text-white hover:bg-[#1f1f23]'
              }`}
            >
              ٣. الفكرة
            </button>
            <div className="text-white/20 select-none px-1">←</div>

            <button
              onClick={() => setCurrentStage(4)}
              className={`px-3 py-1.5 rounded transition ${
                currentStage === 4 ? 'bg-[#343538] text-[#ffc174] font-bold shadow-sm' : 'hover:text-white hover:bg-[#1f1f23]'
              }`}
            >
              ٤. السيناريو
            </button>
            <div className="text-white/20 select-none px-1">←</div>

            <button
              onClick={() => setCurrentStage(5)}
              className={`px-3 py-1.5 rounded transition ${
                currentStage === 5 ? 'bg-[#343538] text-[#ffc174] font-bold shadow-sm' : 'hover:text-white hover:bg-[#1f1f23]'
              }`}
            >
              ٥. المحاكاة البصرية {currentStage === 5 && <span className="text-[9px] text-[#f59e0b] mr-1">(نشط)</span>}
            </button>
          </nav>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Pipeline Status Pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1f1f23] border border-white/[0.05] font-mono text-[10px]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
              <span className="text-[#ffc174] font-medium">يراجع التسلسل الزمني والإنتاجي</span>
            </div>

            {/* Command Palette Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1b1b1f] hover:bg-[#292a2d] border border-white/[0.07] text-[#cac7b8] hover:text-white font-mono text-[10px] transition"
              title="لوحة الأوامر"
            >
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              <span>⌘K للأوامر</span>
            </button>

            {/* RTL / LTR Language Switcher */}
            <button
              onClick={() => setIsRtl(!isRtl)}
              className="px-2 py-1 rounded text-[#ffc174] hover:bg-[#1f1f23] font-mono text-[10px] font-bold transition border border-white/5"
            >
              {isRtl ? 'العربية (RTL)' : 'English (LTR)'}
            </button>

            {/* Export Call Sheet Button */}
            <button
              onClick={() => setIsCallSheetOpen(true)}
              className="hidden md:flex items-center gap-1 px-3 py-1 rounded bg-[#1f1f23] hover:bg-[#292a2d] border border-[#ffc174]/30 hover:border-[#ffc174]/60 text-[#ffc174] font-mono text-[10px] tracking-wider transition"
            >
              <span className="material-symbols-outlined text-[14px]">ios_share</span>
              <span>تصدير المخطط</span>
            </button>

            {/* Profile Avatar */}
            <div
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-7 h-7 rounded-full bg-[#f59e0b] flex items-center justify-center shrink-0 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              title="مدير الإنتاج والتصوير"
            >
              <span className="material-symbols-outlined text-[#472a00] text-[16px] font-bold">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-16 flex-1 flex flex-col">
        {currentStage === 1 && (
          <Stage1Brief isRtl={isRtl} onNavigateToStage={setCurrentStage} work={work} setWork={setWork} />
        )}

        {currentStage === 2 && (
          <Stage2Vision isRtl={isRtl} onNavigateToStage={setCurrentStage} work={work} />
        )}

        {currentStage === 3 && (
          <Stage3Concept isRtl={isRtl} onNavigateToStage={setCurrentStage} work={work} />
        )}

        {currentStage === 4 && (
          <Stage4Script
            generated={built?.script}
            isRtl={isRtl}
            onNavigateToStage={setCurrentStage}
            onSelectSceneForSimulation={(sceneId) => {
              setActiveSceneId(sceneId);
            }}
          />
        )}

        {currentStage === 5 && (
          <Stage5Simulation
            scenes={scenes}
            isRtl={isRtl}
            activeSceneId={activeSceneId}
            setActiveSceneId={setActiveSceneId}
            onNavigateToStage={setCurrentStage}
            onOpenCallSheet={() => setIsCallSheetOpen(true)}
            onOpenAlternateCoverage={() => setIsCoverageOpen(true)}
            peakingActive={peakingActive}
            setPeakingActive={setPeakingActive}
            falseColorActive={falseColorActive}
            setFalseColorActive={setFalseColorActive}
            zebraActive={zebraActive}
            setZebraActive={setZebraActive}
            selectedLensId={selectedLensId}
            setSelectedLensId={setSelectedLensId}
            isAudioPlaying={isAudioPlaying}
            setIsAudioPlaying={setIsAudioPlaying}
          />
        )}
      </main>

      {/* Global Footer */}
      <footer className="w-full bg-[#0d0e11] border-t border-white/[0.07] py-4 mt-auto">
        <div className="w-full max-w-[1720px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px] text-[#cac7b8]">
          <div className="flex items-center gap-3">
            <span className="text-[#ffc174] font-bold">نواة أرشيف FX الذكية</span>
            <span className="text-white/20">•</span>
            <span className="font-mono">الإصدار V4.2.0-STABLE</span>
            <span className="text-white/20">•</span>
            <span className="text-[#cac7b8] font-mono">زمن الاستجابة: ٢٤ ملي ثانية</span>
          </div>

          <div className="flex items-center gap-6 text-[#cac7b8]">
            <span
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hover:text-white cursor-pointer transition"
            >
              التصريح الأمني: الفئة الإبداعية الأولى Tier 1
            </span>
            <span>© ٢٠٢٥ استوديوهات الذكاء الإبداعي FX</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CallSheetModal
        isOpen={isCallSheetOpen}
        onClose={() => setIsCallSheetOpen(false)}
        currentScene={currentScene}
        currentLens={currentLens}
        fixtures={INITIAL_FIXTURES}
        isRtl={isRtl}
      />

      <AlternateCoverageModal
        isOpen={isCoverageOpen}
        onClose={() => setIsCoverageOpen(false)}
        currentScene={currentScene}
        onApplyCoverage={handleApplyCoverage}
        isRtl={isRtl}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateToStage={setCurrentStage}
        onSelectScene={(id) => {
          setActiveSceneId(id);
          const sc = scenes.find((s) => s.id === id);
          if (sc) setSelectedLensId(sc.defaultLensId);
        }}
        onTogglePeaking={() => setPeakingActive((p) => !p)}
        onToggleFalseColor={() => setFalseColorActive((f) => !f)}
        onToggleZebra={() => setZebraActive((z) => !z)}
        onSelectLens={setSelectedLensId}
        onToggleAudio={handleToggleAudio}
        onOpenCallSheet={() => setIsCallSheetOpen(true)}
        onPlayClapper={handlePlayClapper}
        isAudioPlaying={isAudioPlaying}
      />
    </div>
  );
}
