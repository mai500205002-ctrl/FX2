import React, { useState } from 'react';
import { CinematicScene, LensSpec, LightingFixture } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentScene: CinematicScene;
  currentLens: LensSpec;
  fixtures: LightingFixture[];
  isRtl: boolean;
}

export const CallSheetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentScene,
  currentLens,
  fixtures,
  isRtl
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = `
=====================================================
ATELIER FX // CINEMATIC PRODUCTION CALL SHEET #04
PROJECT: CHRONO AL-ULA : THE UNSPOKEN HOUR
DATE: 2025.10.14 | CALL TIME: 04:00 AM (PRE-DAWN)
LOCATION: ${currentScene.locationAr} (GPS: ${currentScene.gps})
=====================================================
SCENE: 03 | TAKE: 04 (DIRECTOR'S CUT)
CAMERA: ARRI ALEXA 65 OPEN-GATE (6560x3102)
LENS: ${currentLens.name} (${currentLens.focalLength} ${currentLens.maxAperture})
FORMAT: 2.39:1 ANAMORPHIC SQUEEZE (${currentLens.squeeze})
MEDIA: CODEX 2TB MAG_04 // PRORES 4444 XQ
SOUND: DOLBY ATMOS 9.1.6 // LITHIC 24Hz RESONANCE

LIGHTING PLOT (GAFFER CONFIGURATION):
${fixtures.map(f => `- ${f.name}: Dimmer ${f.dimmer}%, CCT ${f.cct}, Output: ${f.lux} LUX ${f.luxDistance}`).join('\n')}

ATMOSPHERIC & ENVIRONMENTAL CONDITIONS:
- Sunrise: 05:42 AM | Sun Rim Angle: 104° ESE
- Ambient Temperature: 18°C | Wind: 6 km/h SSW
- Dust Volumetrics: Natural Suspended Sand Particles

AUTHORIZED BY: DIRECTOR & DP HEADQUARTERS // FX STUDIOS
=====================================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1b1b1f] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0d0e11] border-b border-white/10 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] animate-pulse" />
            <span className="text-[#ffc174] font-bold">وثيقة جدول التصوير والمخطط الضوئي المعتمد (DP CALL SHEET)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#292a2d] rounded text-[#cac7b8] transition text-base"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Printable Call Sheet */}
        <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs text-[#e3e2e6] print:p-0">
          {/* Masthead */}
          <div className="border border-white/10 p-5 rounded-lg bg-[#121316] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] text-[#ffc174] uppercase tracking-wider">FX INTELLIGENCE STUDIOS // CALL SHEET DAY 04</div>
              <h2 className="text-xl font-serif text-white font-bold mt-1">ساعة الصمت المطلق / CHRONO AL-ULA</h2>
              <div className="text-[#cac7b8] text-[11px] mt-1">{currentScene.locationAr}</div>
            </div>
            <div className="text-left md:text-right font-mono text-[11px] space-y-1">
              <div>تاريخ التصوير: <span className="text-white font-bold">2025.10.14</span></div>
              <div>ساعة الحضور (Crew Call): <span className="text-[#f59e0b] font-bold">04:00 AM</span></div>
              <div>أول لقطة (First Camera Roll): <span className="text-[#10b981] font-bold">04:48 AM</span></div>
            </div>
          </div>

          {/* Camera & Optics Rig */}
          <div className="border border-white/10 p-4 rounded-lg bg-[#1f1f23] space-y-3">
            <div className="text-[#ffc174] font-bold text-sm border-b border-white/10 pb-2 flex items-center justify-between">
              <span>١. حزمة الكاميرا والعدسات (Camera & Optical Package)</span>
              <span className="text-[10px] text-[#cac7b8]">ARRI /i PROTOCOL</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
              <div>
                <span className="text-[#cac7b8] block">المستشعر والكاميرا:</span>
                <span className="text-white font-bold">ALEXA 65 OPEN GATE</span>
              </div>
              <div>
                <span className="text-[#cac7b8] block">العدسة الحالية:</span>
                <span className="text-[#ffc174] font-bold">{currentLens.name} ({currentLens.squeeze})</span>
              </div>
              <div>
                <span className="text-[#cac7b8] block">الفتحة وفتحة الغالق:</span>
                <span className="text-white font-bold">{currentScene.tStop} // 172.8°</span>
              </div>
              <div>
                <span className="text-[#cac7b8] block">الحساسية والموازنة:</span>
                <span className="text-white font-bold">ISO {currentScene.iso} // {currentScene.wb}</span>
              </div>
            </div>
          </div>

          {/* Photometric Lighting Plan */}
          <div className="border border-white/10 p-4 rounded-lg bg-[#1f1f23] space-y-3">
            <div className="text-[#ffc174] font-bold text-sm border-b border-white/10 pb-2 flex items-center justify-between">
              <span>٢. مخطط الإضاءة وتوزيع الطاقة (Lighting & Gaffer Plot)</span>
              <span className="text-[10px] text-[#cac7b8]">CRMX WIRELESS MESH</span>
            </div>
            <div className="space-y-2">
              {fixtures.map((f) => (
                <div key={f.id} className="p-2.5 bg-[#121316] rounded border border-white/5 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-white font-bold">{f.name}</span>
                    <span className="text-[#cac7b8] text-[10px] mr-2">[{f.roleAr}]</span>
                    <div className="text-[10px] text-[#d8c3ad]">{f.cct} • {f.modifier}</div>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-[#f59e0b] font-bold">{f.dimmer}% DIM</span>
                    <span className="text-[#cac7b8] block text-[10px]">{f.lux} LUX {f.luxDistance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety, Weather & Emergency Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
            <div className="p-3 bg-[#121316] rounded border border-white/5 space-y-1">
              <span className="text-[#ffc174] font-bold block">الظروف الجوية في مدائن صالح:</span>
              <p className="text-[#cac7b8]">الشروق الدقيق: ٠٥:٤٢ ص • درجة الحرارة: ١٨° مئوية • سرعة الرياح: ٦ كم/ساعة • نسبة الرطوبة: ٢٢٪ (جفاف مثالي لنقاء العدسات).</p>
            </div>
            <div className="p-3 bg-[#121316] rounded border border-white/5 space-y-1">
              <span className="text-[#ffc174] font-bold block">إجراءات حماية الموقع الأثري:</span>
              <p className="text-[#cac7b8]">يُمنع تثبيت أي حوامل ثقيلة مباشرة على جدران المقابر النبطية. جميع وحدات الإضاءة محمولة على مركبات رملية بمطاط ناعم أو قواعد هوائية مستقلة.</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-[#0d0e11] border-t border-white/10 flex items-center justify-between font-mono text-xs">
          <span className="text-[#cac7b8] text-[11px]">
            {copied ? '✓ تم نسخ الوثيقة إلى الحافظة' : 'المستند جاهز للطباعة والتوزيع لفرق التصوير'}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-[#292a2d] hover:bg-[#343538] text-white rounded transition"
            >
              {copied ? 'تم النسخ!' : 'نسخ نص الوثيقة (Copy Text)'}
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-[#f59e0b] hover:bg-[#ffb95f] text-[#472a00] font-bold rounded transition shadow"
            >
              طباعة / حفظ كـ PDF (Print / PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
