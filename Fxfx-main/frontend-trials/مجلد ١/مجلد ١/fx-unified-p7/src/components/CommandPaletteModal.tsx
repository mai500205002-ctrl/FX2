import React, { useState, useEffect } from 'react';
import { StageId } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStage: (stage: StageId) => void;
  onSelectScene: (sceneId: number) => void;
  onTogglePeaking: () => void;
  onToggleFalseColor: () => void;
  onToggleZebra: () => void;
  onSelectLens: (lensId: string) => void;
  onToggleAudio: () => void;
  onOpenCallSheet: () => void;
  onPlayClapper: () => void;
  isAudioPlaying: boolean;
}

export const CommandPaletteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateToStage,
  onSelectScene,
  onTogglePeaking,
  onToggleFalseColor,
  onToggleZebra,
  onSelectLens,
  onToggleAudio,
  onOpenCallSheet,
  onPlayClapper,
  isAudioPlaying
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'stage-5',
      category: 'المراحل (Stages)',
      label: 'الانتقال إلى: ٥. المحاكاة البصرية والقياسات السينمائية (Stage 5)',
      shortcut: 'S5',
      action: () => { onNavigateToStage(5); onClose(); }
    },
    {
      id: 'stage-4',
      category: 'المراحل (Stages)',
      label: 'الانتقال إلى: ٤. السيناريو السينمائي (Stage 4)',
      shortcut: 'S4',
      action: () => { onNavigateToStage(4); onClose(); }
    },
    {
      id: 'stage-1',
      category: 'المراحل (Stages)',
      label: 'الانتقال إلى: ١. الموجز التنفيذي (Stage 1)',
      shortcut: 'S1',
      action: () => { onNavigateToStage(1); onClose(); }
    },
    {
      id: 'stage-2',
      category: 'المراحل (Stages)',
      label: 'الانتقال إلى: ٢. الرؤية الاستراتيجية (Stage 2)',
      shortcut: 'S2',
      action: () => { onNavigateToStage(2); onClose(); }
    },
    {
      id: 'stage-3',
      category: 'المراحل (Stages)',
      label: 'الانتقال إلى: ٣. الفكرة الإبداعية (Stage 3)',
      shortcut: 'S3',
      action: () => { onNavigateToStage(3); onClose(); }
    },
    {
      id: 'scene-3',
      category: 'اللقطات (Scenes)',
      label: 'اللقطة ٠٣: صخرة مدائن صالح - فجر ٠٤:٤٨ ص (المشهد الرئيسي)',
      shortcut: 'SC3',
      action: () => { onSelectScene(3); onNavigateToStage(5); onClose(); }
    },
    {
      id: 'scene-1',
      category: 'اللقطات (Scenes)',
      label: 'اللقطة ٠١: مركز كافد المالي - الرياض',
      shortcut: 'SC1',
      action: () => { onSelectScene(1); onNavigateToStage(5); onClose(); }
    },
    {
      id: 'scene-2',
      category: 'اللقطات (Scenes)',
      label: 'اللقطة ٠٢: قطار الحرمين السريع - الكثبان الغربية',
      shortcut: 'SC2',
      action: () => { onSelectScene(2); onNavigateToStage(5); onClose(); }
    },
    {
      id: 'call-sheet',
      category: 'التصدير (Export)',
      label: 'تصدير وثيقة التصوير والمخطط الضوئي (DP Call Sheet PDF/XML)',
      shortcut: '⌘P',
      action: () => { onOpenCallSheet(); onClose(); }
    },
    {
      id: 'hud-peaking',
      category: 'أدوات الكاميرا (HUD)',
      label: 'تبديل قناع التركيز البؤري (Toggle Focus Peaking)',
      shortcut: 'P',
      action: () => { onTogglePeaking(); onClose(); }
    },
    {
      id: 'hud-false-color',
      category: 'أدوات الكاميرا (HUD)',
      label: 'تبديل فحص التعريض اللوني (Toggle False Color)',
      shortcut: 'F',
      action: () => { onToggleFalseColor(); onClose(); }
    },
    {
      id: 'hud-zebra',
      category: 'أدوات الكاميرا (HUD)',
      label: 'تبديل تحذير الإشباع Zebra 70%',
      shortcut: 'Z',
      action: () => { onToggleZebra(); onClose(); }
    },
    {
      id: 'audio-toggle',
      category: 'الصوت الترددي (Audio)',
      label: isAudioPlaying ? 'إيقاف تشغيل الدرون الصوتي 24Hz' : 'تشغيل الدرون الصوتي الميداني 24Hz Sub-bass',
      shortcut: 'A',
      action: () => { onToggleAudio(); onClose(); }
    },
    {
      id: 'clapper-sound',
      category: 'أدوات الكلاكت (Slate)',
      label: 'إطلاق صوت الكلاكت للتزامن الصوتي (Sound Sync Slate)',
      shortcut: 'C',
      action: () => { onPlayClapper(); onClose(); }
    },
    {
      id: 'lens-35',
      category: 'العدسات (Lenses)',
      label: 'تركيب عدسة 35mm DNA LF T2.8 (زاوية الصخور العريضة)',
      shortcut: 'L35',
      action: () => { onSelectLens('35mm'); onClose(); }
    },
    {
      id: 'lens-50',
      category: 'العدسات (Lenses)',
      label: 'تركيب عدسة 50mm Prime 65-S T2.0 (ماكرو نقوش الحجر)',
      shortcut: 'L50',
      action: () => { onSelectLens('50mm'); onClose(); }
    },
    {
      id: 'lens-80',
      category: 'العدسات (Lenses)',
      label: 'تركيب عدسة 80mm Prime 65-S T1.8 (بورتريه وعزل)',
      shortcut: 'L80',
      action: () => { onSelectLens('80mm'); onClose(); }
    },
    {
      id: 'lens-110',
      category: 'العدسات (Lenses)',
      label: 'تركيب عدسة 110mm DNA Telephoto T2.3 (ضغط الأفق البعيد)',
      shortcut: 'L110',
      action: () => { onSelectLens('110mm'); onClose(); }
    }
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1b1b1f] border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Search Input Bar */}
        <div className="px-4 py-3 bg-[#0d0e11] border-b border-white/10 flex items-center gap-3">
          <span className="text-[#ffc174] font-mono text-sm">⌘K</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن أمر، عدسة، مرحلة، أو لقطة..."
            className="w-full bg-transparent text-sm text-[#e3e2e6] placeholder-[#cac7b8]/50 outline-none font-mono"
          />
          <button
            onClick={onClose}
            className="text-[#cac7b8] hover:text-white px-2 py-0.5 rounded text-xs font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1 font-mono text-xs">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-[#cac7b8]">لا توجد أوامر مطابقة</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={item.action}
                className="p-2.5 rounded hover:bg-[#292a2d] cursor-pointer flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#ffc174] bg-[#0d0e11] px-1.5 py-0.5 rounded border border-white/5">
                    {item.category.split(' ')[0]}
                  </span>
                  <span className="text-[#e3e2e6] group-hover:text-[#ffc174] transition">
                    {item.label}
                  </span>
                </div>
                <span className="text-[10px] text-[#cac7b8] bg-[#0d0e11] px-2 py-0.5 rounded font-mono">
                  {item.shortcut}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-[#0d0e11] border-t border-white/10 text-[10px] text-[#cac7b8] flex justify-between font-mono">
          <span>لوحة أوامر استوديوهات الذكاء الإبداعي FX</span>
          <span>ENTER للتنفيذ • ESC للإغلاق</span>
        </div>
      </div>
    </div>
  );
};
