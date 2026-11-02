import React from 'react';
import type { Work } from '../services/fx';
import { MirrorReveal } from './MirrorReveal';

interface Props {
  isRtl: boolean;
  onNavigateToStage: (stage: 1 | 2 | 3 | 4 | 5) => void;
  work?: Work;
}

export const Stage3Concept: React.FC<Props> = ({ isRtl, onNavigateToStage, work }) => {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-8 space-y-8">
      {work?.concept && work.mirror && <MirrorReveal idea={work.concept} mirror={work.mirror} />}
      {/* Header */}
      <div className="bg-[#1f1f23] p-8 rounded-xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#ffc174]">
              <span className="bg-[#292a2d] px-2 py-0.5 rounded uppercase">FX // STAGE 03</span>
              <span>•</span>
              <span>الفكرة الإبداعية ولوحات الإلهام البصري</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif text-[#e3e2e6] tracking-tight">
              {isRtl ? 'الهندسة الجيولوجية والضوء المنكسر' : 'Lithic Geometry & Refracted Light'}
            </h1>
            <p className="text-sm text-[#d8c3ad] max-w-3xl mt-3 leading-relaxed">
              المعايير الجمالية المتبعة: تباين ألوان أوكر الصحراء مع أزرق فجر الجزيرة، تشبع الحبيبات التناظرية لفيلم كوداك، واستخدام توهجات العدسات الأنامورفيكية كخيوط زمنية تربط المشاهد.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigateToStage(2)}
              className="px-4 py-2 bg-[#292a2d] hover:bg-[#343538] text-xs font-mono rounded text-[#e3e2e6] transition"
            >
              ← السابق: الرؤية
            </button>
            <button
              onClick={() => onNavigateToStage(4)}
              className="px-4 py-2 bg-[#f59e0b] hover:bg-[#ffb95f] text-xs font-mono font-bold rounded text-[#472a00] transition"
            >
              التالي: السيناريو السينمائي ←
            </button>
          </div>
        </div>
      </div>

      {/* Color Script Palette Bar */}
      <div className="bg-[#1b1b1f] p-6 rounded-xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif text-[#e3e2e6]">مخطط التوزيع اللوني السينمائي (Color Palette Script)</h3>
          <span className="font-mono text-xs text-[#cac7b8]">LUT: KODAK 5219 BLEACH BYPASS</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-[#0d0e11] rounded border border-white/5 space-y-2">
            <div className="h-16 w-full rounded bg-[#0d0e11] border border-white/10" />
            <div className="font-mono text-xs text-[#e3e2e6] font-bold">Deep Carbon #0D0E11</div>
            <div className="text-[11px] text-[#cac7b8]">ظلال الصخور والتجاويف النبطية</div>
          </div>
          <div className="p-3 bg-[#1b1b1f] rounded border border-white/5 space-y-2">
            <div className="h-16 w-full rounded bg-[#472a00] border border-white/10" />
            <div className="font-mono text-xs text-[#e3e2e6] font-bold">Raw Umber #472A00</div>
            <div className="text-[11px] text-[#cac7b8]">عمق الحجر الرملي المشبع بالشمس</div>
          </div>
          <div className="p-3 bg-[#1b1b1f] rounded border border-white/5 space-y-2">
            <div className="h-16 w-full rounded bg-[#f59e0b] border border-white/10" />
            <div className="font-mono text-xs text-[#e3e2e6] font-bold">Film Amber #F59E0B</div>
            <div className="text-[11px] text-[#cac7b8]">حافة الضوء القادمة مع الشروق (Key)</div>
          </div>
          <div className="p-3 bg-[#1b1b1f] rounded border border-white/5 space-y-2">
            <div className="h-16 w-full rounded bg-[#becee4] border border-white/10" />
            <div className="font-mono text-xs text-[#e3e2e6] font-bold">Twilight Slate #BECEE4</div>
            <div className="text-[11px] text-[#cac7b8]">ضوء السماء الأزرق البارد في الفجر</div>
          </div>
          <div className="p-3 bg-[#1b1b1f] rounded border border-white/5 space-y-2">
            <div className="h-16 w-full rounded bg-[#cac7b8] border border-white/10" />
            <div className="font-mono text-xs text-[#e3e2e6] font-bold">Titanium Dust #CAC7B8</div>
            <div className="text-[11px] text-[#cac7b8]">انعكاس غبار الصحراء وواجهات كافد</div>
          </div>
        </div>
      </div>

      {/* Moodboards & Textural Studies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1b1b1f] p-6 rounded-xl border border-white/5 space-y-4">
          <h3 className="text-base font-serif text-[#e3e2e6]">فلسفة العدسات الأنامورفيكية (Anamorphic Feel)</h3>
          <p className="text-xs text-[#cac7b8] leading-relaxed">
            اختيار عدسات ARRI Rental DNA LF بضغط 1.85x يضمن أن تكون الخطوط الأفقية متسعة بدون تشويه مزعج للوجوه في المنتصف. في ذات الوقت، تمنح حواف الإطار تشتتاً انسيابياً (Barrel Roll-off) وتنتج توهجاً دافئاً بلون شمس العلا بدلاً من التوهج الأزرق التجاري المعتاد.
          </p>
          <div className="flex gap-3 text-xs font-mono text-[#ffc174]">
            <span className="p-2 bg-[#0d0e11] rounded border border-white/5">بوكيه بيضاوي 1.85:1</span>
            <span className="p-2 bg-[#0d0e11] rounded border border-white/5">توهج عنبري أصفر وأزرق ناعم</span>
          </div>
        </div>

        <div className="bg-[#1b1b1f] p-6 rounded-xl border border-white/5 space-y-4">
          <h3 className="text-base font-serif text-[#e3e2e6]">الهندسة الصوتية المكانية (Lithic Acoustics)</h3>
          <p className="text-xs text-[#cac7b8] leading-relaxed">
            الاعتماد على التسجيل الصوتي الميداني في فوالق العلا الطبيعية، باستخدام مصفوفات ميكروفونات كروية ثنائية التردد. يتم ترشيح صوت الريح لإنتاج موجة 24Hz تحاكي الإحساس الجسدي بالعمق والرسوخ قبل أن تنفجر الموسيقى التصويرية التناظرية.
          </p>
          <div className="flex gap-3 text-xs font-mono text-[#becee4]">
            <span className="p-2 bg-[#0d0e11] rounded border border-white/5">Dolby Atmos 9.1.6</span>
            <span className="p-2 bg-[#0d0e11] rounded border border-white/5">زمن تردد RT60: 2.84s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
