import React, { useState } from 'react';
import { CinematicScene } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentScene: CinematicScene;
  onApplyCoverage: (coverageTitle: string, promptText: string) => void;
  isRtl: boolean;
}

export const AlternateCoverageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentScene,
  onApplyCoverage,
  isRtl
}) => {
  const [prompt, setPrompt] = useState(
    'Cinematic 2.39:1 low-angle master of Hegra Nabataean tomb facade at 04:48 AM twilight, warm tungsten rim on sandstone crevices, cold slate pre-dawn sky, Alexa 65 anamorphic streak flare.'
  );

  const [generating, setGenerating] = useState(false);
  const [selectedAngle, setSelectedAngle] = useState(0);

  const presetAngles = [
    {
      titleAr: 'زاوية ماكرو فائقة (Extreme Chisel Macro)',
      lens: '50mm Prime 65-S T2.0',
      descAr: 'تركيز دقيق على أثر إزميل النحات النبطي، ضوء جانبي حاد يبرز عمق المسام الحجرية.',
      distance: '0.45m',
      iso: 400
    },
    {
      titleAr: 'لقطة جوية منخفضة للممر الصخري (Low Canyon Flythrough)',
      lens: '35mm DNA LF T2.8',
      descAr: 'حركة انزلاقية سفلية تعبر فوهة الوادي نحو مدائن صالح مع صدى ضوء الفجر.',
      distance: '18.0m',
      iso: 800
    },
    {
      titleAr: 'لقطة عكسية على ظل الشخصية (Reverse Silhouette Key)',
      lens: '80mm Prime 65-S T1.8',
      descAr: 'عزل الشبح الصامت لـ "سارة" وهي تشاهد أول شعاع شمسي يلمس قمة الصخرة المنحوتة.',
      distance: '6.20m',
      iso: 800
    },
    {
      titleAr: 'انضغاط أفق التيليفوتو (Telephoto Horizon Heat)',
      lens: '110mm DNA T2.3',
      descAr: 'ضغط مسافات الرمال البعيدة مع خط المقبرة في أفق الشفق البرتقالي الساحر.',
      distance: '45.0m',
      iso: 320
    }
  ];

  if (!isOpen) return null;

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      onApplyCoverage(presetAngles[selectedAngle].titleAr, prompt);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1b1b1f] border border-white/10 rounded-xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d0e11] border-b border-white/10 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-[#ffc174] font-bold">توليد زوايا ولقطات بديلة (ALTERNATE COVERAGE GENERATOR)</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#292a2d] rounded text-[#cac7b8] transition">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 font-mono text-xs">
          {/* Target Scene Summary */}
          <div className="p-3 bg-[#121316] rounded border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[#cac7b8] text-[10px]">المشهد المستهدف:</span>
              <div className="text-white font-bold">{currentScene.titleAr} ({currentScene.locationAr})</div>
            </div>
            <span className="text-[#ffc174] bg-[#292a2d] px-2 py-0.5 rounded text-[11px]">{currentScene.timecode}</span>
          </div>

          {/* Preset Angle Selection */}
          <div className="space-y-2">
            <div className="text-[#cac7b8] text-[11px]">اختر نمط اللقطة البديلة المطلوبة:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presetAngles.map((ang, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedAngle(idx)}
                  className={`p-3 rounded border cursor-pointer transition ${
                    selectedAngle === idx
                      ? 'bg-[#292a2d] border-[#f59e0b] shadow-sm'
                      : 'bg-[#121316] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-xs">{ang.titleAr}</span>
                    <span className="text-[10px] text-[#ffc174]">{ang.lens}</span>
                  </div>
                  <p className="text-[11px] text-[#cac7b8] mt-1 font-sans leading-relaxed">{ang.descAr}</p>
                  <div className="mt-2 text-[10px] text-[#d8c3ad] flex justify-between">
                    <span>مسافة البؤرة: {ang.distance}</span>
                    <span>ISO {ang.iso}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Prompt Staging */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#cac7b8]">الموجه التوليدي للذكاء البصري (Cinematic Prompt Spec):</span>
              <span className="text-[#ffc174]">2.39:1 ANAMORPHIC</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full bg-[#0d0e11] border border-white/10 rounded p-3 text-xs text-[#e3e2e6] focus:border-[#f59e0b] outline-none font-mono resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0d0e11] border-t border-white/10 flex items-center justify-between font-mono text-xs">
          <span className="text-[#cac7b8] text-[11px]">⌘G لتأكيد التوليد الميداني</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#292a2d] hover:bg-[#343538] text-white rounded transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2 bg-[#f59e0b] hover:bg-[#ffb95f] text-[#472a00] font-bold rounded transition shadow flex items-center gap-2"
            >
              {generating ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#472a00] animate-ping" />
                  <span>جارِ المحاكاة والتوليد...</span>
                </>
              ) : (
                <span>اعتماد الزاوية البديلة ومزامنة الكاميرا ←</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
