import React from 'react';

interface Props {
  isRtl: boolean;
  onNavigateToStage: (stage: 1 | 2 | 3 | 4 | 5) => void;
}

export const Stage2Vision: React.FC<Props> = ({ isRtl, onNavigateToStage }) => {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#1f1f23] p-8 rounded-xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#ffc174]">
              <span className="bg-[#292a2d] px-2 py-0.5 rounded uppercase">FX // STAGE 02</span>
              <span>•</span>
              <span>الرؤية الاستراتيجية والمصفوفة الثقافية</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif text-[#e3e2e6] tracking-tight">
              {isRtl ? 'ثنائية الصمت والحركة الفائقة' : 'Dualism of Lithic Silence & Hyper-Velocity'}
            </h1>
            <p className="text-sm text-[#d8c3ad] max-w-3xl mt-3 leading-relaxed">
              تأسيس المعادلة البصرية بين الثبات الصخري الذي تشكّل عبر ٥٠٠ مليون سنة، والتحول المعماري الرقمي المتسارع في المملكة.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigateToStage(1)}
              className="px-4 py-2 bg-[#292a2d] hover:bg-[#343538] text-xs font-mono rounded text-[#e3e2e6] transition"
            >
              ← السابق: الموجز
            </button>
            <button
              onClick={() => onNavigateToStage(3)}
              className="px-4 py-2 bg-[#f59e0b] hover:bg-[#ffb95f] text-xs font-mono font-bold rounded text-[#472a00] transition"
            >
              التالي: الفكرة الإبداعية ←
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1b1b1f] p-6 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif text-[#e3e2e6]">المحور الأول: الرنين الحجري النبطي</h3>
            <span className="font-mono text-xs text-[#ffc174] bg-[#292a2d] px-2 py-0.5 rounded">AL-ULA</span>
          </div>
          <p className="text-xs text-[#cac7b8] leading-relaxed">
            التركيز على ملمس الصخور الرملية المحفورة بيد النحاتين الأوائل في مدائن صالح. حركة الكاميرا هنا هادئة وبطيئة كأنفاس الجبال، مع استيعاب الترددات الصوتية التحت أرضية (24Hz) التي تحاكي استقرار القشرة الأرضية.
          </p>
          <div className="p-3 bg-[#0d0e11] rounded font-mono text-[11px] text-[#ffc174] border border-white/5">
            القياس البصري: T2.8 • سرعة غالق 172.8° • تركيز بؤري بطيء • تشوه بيضاوي عضوي
          </div>
        </div>

        <div className="bg-[#1b1b1f] p-6 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif text-[#e3e2e6]">المحور الثاني: الحداثة والانعكاس الرقمي</h3>
            <span className="font-mono text-xs text-[#becee4] bg-[#292a2d] px-2 py-0.5 rounded">KAFD & RAIL</span>
          </div>
          <p className="text-xs text-[#cac7b8] leading-relaxed">
            الانتقال إلى خطوط الأبراج الحادة في كافد وشريط قطار الحرمين المغناطيسي. حركة الكاميرا تتحول إلى سرعات انزلاقية مع وميض أنامورفيكي أفقي أزرق بارد، لتعزيز فكرة القفزة الزمنية.
          </p>
          <div className="p-3 bg-[#0d0e11] rounded font-mono text-[11px] text-[#becee4] border border-white/5">
            القياس البصري: T1.8 • سرعة غالق 144° • انزلاق كاميرا دولي آلي • وميض أزرق تيتانيوم
          </div>
        </div>
      </div>

      {/* Production Values Table */}
      <div className="bg-[#1f1f23] p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="text-base font-serif text-[#e3e2e6]">مصفوفة التباين الدرامي والتقني</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-[#d8c3ad]">
                <th className="py-2.5 px-3">العنصر الفني</th>
                <th className="py-2.5 px-3">مشاهد صخور العلا</th>
                <th className="py-2.5 px-3">مشاهد الأبراج والقطار</th>
                <th className="py-2.5 px-3">نقطة الالتقاء الدرامي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#cac7b8]">
              <tr>
                <td className="py-2.5 px-3 text-[#ffc174]">درجة حرارة اللون (CCT)</td>
                <td className="py-2.5 px-3">2800K (تنجستن ذهبي دافئ)</td>
                <td className="py-2.5 px-3">4200K (سماء شفق باردة)</td>
                <td className="py-2.5 px-3">3400K (تداخل الشروق بالأبراج)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-[#ffc174]">حركة الإطار (FPS)</td>
                <td className="py-2.5 px-3">24.000 إطار سينمائي ثابت</td>
                <td className="py-2.5 px-3">120 → 24 إطار (Ramp تدريجي)</td>
                <td className="py-2.5 px-3">تجميد زمني كلي للنانوثانية</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-[#ffc174]">التردد الصوتي السائد</td>
                <td className="py-2.5 px-3">24Hz رنين صخري أرضي</td>
                <td className="py-2.5 px-3">صفير هوائي احتكاكي فائق</td>
                <td className="py-2.5 px-3">سكون مطلق (ساعة الصمت)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
