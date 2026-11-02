import React from 'react';

interface Props {
  isRtl: boolean;
  onNavigateToStage: (stage: 1 | 2 | 3 | 4 | 5) => void;
}

export const Stage1Brief: React.FC<Props> = ({ isRtl, onNavigateToStage }) => {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#1f1f23] p-8 rounded-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f59e0b]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#ffc174]">
              <span className="bg-[#292a2d] px-2 py-0.5 rounded uppercase">FX // STAGE 01</span>
              <span>•</span>
              <span>الموجز التنفيذي والوثيقة التأسيسية للمشروع</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif text-[#e3e2e6] tracking-tight">
              {isRtl ? 'كرونو العُلا / ساعة الصمت المطلق' : 'Chrono Al-Ula : The Unspoken Hour'}
            </h1>
            <p className="text-sm text-[#d8c3ad] max-w-3xl mt-3 leading-relaxed">
              {isRtl
                ? 'ملحمة سينمائية وثائقية-درامية ترصد تقاطع الزمن الجيولوجي السحيق لصخور الحجر والنقوش النبطية مع وتيرة الحداثة الفائقة لقطارات السرعة وأبراج الرياض المالية، معتمدة تقنية تصوير 65mm أنامورفيك.'
                : 'A cinematic docu-drama exploring the intersection of deep geological time in Hegra with hyper-velocity modernity across KAFD and high-speed rail, shot on 65mm large-format anamorphic lenses.'}
            </p>
          </div>
          <button
            onClick={() => onNavigateToStage(5)}
            className="px-5 py-2.5 bg-[#f59e0b] hover:bg-[#ffb95f] text-[#472a00] font-bold text-xs rounded transition shadow-lg shrink-0 font-mono flex items-center gap-2"
          >
            <span>انتقل مباشرة لمحاكاة الكاميرا (المرحلة ٥)</span>
            <span>←</span>
          </button>
        </div>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1b1b1f] p-6 rounded-xl border border-white/5 space-y-3">
          <div className="font-mono text-xs text-[#ffc174] uppercase tracking-wider">٠١ / اللوجلاين (Logline)</div>
          <h3 className="text-lg font-serif text-[#e3e2e6]">حين يلتقي نبض النانوثانية بصمت الجيولوجيا</h3>
          <p className="text-xs text-[#cac7b8] leading-relaxed">
            في لحظة واحدة تجمع بين فجر مدائن صالح وغسق المركز المالي، تحاول مهندسة توثيق زمني قياس الفارق بين ارتداد الصدى في الفوالق الصخرية وسرعة المعالجات الكمومية.
          </p>
        </div>

        <div className="bg-[#1b1b1f] p-6 rounded-xl border border-white/5 space-y-3">
          <div className="font-mono text-xs text-[#ffc174] uppercase tracking-wider">٠٢ / المواصفات الإنتاجية (Specs)</div>
          <h3 className="text-lg font-serif text-[#e3e2e6]">Large Format Anamorphic 2.39:1</h3>
          <ul className="text-xs text-[#cac7b8] space-y-2 font-mono">
            <li>• الكاميرا الأساسية: ARRI Alexa 65 Open Gate</li>
            <li>• العدسات: ARRI Rental DNA LF Custom Squeeze</li>
            <li>• الصوت المكاني: Dolby Atmos 9.1.6 Lithic Resonance</li>
            <li>• المعالجة اللونية: Kodak 5219 Bleach Bypass & Ochre</li>
          </ul>
        </div>

        <div className="bg-[#1b1b1f] p-6 rounded-xl border border-white/5 space-y-3">
          <div className="font-mono text-xs text-[#ffc174] uppercase tracking-wider">٠٣ / المواقع الميدانية (Locations)</div>
          <h3 className="text-lg font-serif text-[#e3e2e6]">رحلة المحاور الثلاثة</h3>
          <p className="text-xs text-[#cac7b8] leading-relaxed">
            ١. العلا (مدائن صالح، وادي عشار، الغراميل)
            <br />
            ٢. الرياض (مركز الملك عبدالله المالي، وادي حنيفة)
            <br />
            ٣. المسار الرابط (ممر الكثبان لقطار الحرمين)
          </p>
        </div>
      </div>

      {/* Target Audience & Deliverables */}
      <div className="bg-[#1f1f23] p-6 rounded-xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-[#cac7b8]">
        <div>
          <span className="text-[#ffc174] font-bold block mb-1">المخرج والمدير الفني:</span>
          <span>استوديوهات الذكاء الإبداعي FX • وحدة الإنتاج السينمائي الميداني</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => onNavigateToStage(2)}
            className="px-4 py-2 bg-[#292a2d] hover:bg-[#343538] text-[#e3e2e6] rounded transition"
          >
            المرحلة التالية: الرؤية الاستراتيجية ←
          </button>
        </div>
      </div>
    </div>
  );
};
