import React from 'react';
import { ViewMode } from '../types/studio';
import { Film, Sliders, LayoutGrid, Clapperboard, Download } from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenRenderModal: () => void;
  activeProjectName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenRenderModal,
  activeProjectName,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0d0e11] border-b border-white/[0.07] shrink-0 z-30 select-none">
      {/* Zone 1: Single text element Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
          <span className="font-serif text-lg tracking-wider text-[#f3efe0] font-normal uppercase">
            Atelier FX
          </span>
        </div>
        <span className="text-white/20 text-xs font-mono">/</span>
        <span className="font-mono text-xs text-[#94a3b8] tracking-tight truncate max-w-[200px]">
          {activeProjectName}
        </span>
      </div>

      {/* Zone 2: Navigation Links (4-5 single-line clean controls) */}
      <nav className="flex items-center gap-1 sm:gap-2 bg-[#08090a] p-1 border border-white/[0.05]">
        <button
          onClick={() => onViewChange('staging')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wide transition-all whitespace-nowrap shrink-0 ${
            currentView === 'staging'
              ? 'bg-[#1c1f26] text-[#f3efe0] border border-white/[0.12] shadow-sm'
              : 'text-[#94a3b8] hover:text-[#f3efe0] hover:bg-white/[0.02]'
          }`}
        >
          <Clapperboard className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span>Staging Director</span>
        </button>

        <button
          onClick={() => onViewChange('sequencer')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wide transition-all whitespace-nowrap shrink-0 ${
            currentView === 'sequencer'
              ? 'bg-[#1c1f26] text-[#f3efe0] border border-white/[0.12] shadow-sm'
              : 'text-[#94a3b8] hover:text-[#f3efe0] hover:bg-white/[0.02]'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span>Scene Sequencer</span>
        </button>

        <button
          onClick={() => onViewChange('contact')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wide transition-all whitespace-nowrap shrink-0 ${
            currentView === 'contact'
              ? 'bg-[#1c1f26] text-[#f3efe0] border border-white/[0.12] shadow-sm'
              : 'text-[#94a3b8] hover:text-[#f3efe0] hover:bg-white/[0.02]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span>Contact Sheet</span>
        </button>

        <button
          onClick={() => onViewChange('grading')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wide transition-all whitespace-nowrap shrink-0 ${
            currentView === 'grading'
              ? 'bg-[#1c1f26] text-[#f3efe0] border border-white/[0.12] shadow-sm'
              : 'text-[#94a3b8] hover:text-[#f3efe0] hover:bg-white/[0.02]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span>Grading Suite</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#94a3b8] tabular-nums">
          <span className="w-1.5 h-1.5 bg-[#10b981] inline-block" />
          <span>24.00 FPS · 4K DCI</span>
        </div>

        <button
          onClick={onOpenRenderModal}
          className="group relative flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-wider uppercase text-[#f3efe0] bg-[#14161b] border border-white/[0.15] hover:border-[#f59e0b] hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.35)] transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5 text-[#ffc174] group-hover:translate-y-0.5 transition-transform" />
          <span>Render Master</span>
        </button>
      </div>
    </header>
  );
};
