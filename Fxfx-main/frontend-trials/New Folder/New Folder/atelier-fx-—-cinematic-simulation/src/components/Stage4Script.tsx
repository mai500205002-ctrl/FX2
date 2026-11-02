import React, { useState } from 'react';

interface Props {
  isRtl: boolean;
  onNavigateToStage: (stage: 1 | 2 | 3 | 4 | 5) => void;
  onSelectSceneForSimulation: (sceneId: number) => void;
}

export const Stage4Script: React.FC<Props> = ({ isRtl, onNavigateToStage, onSelectSceneForSimulation }) => {
  const [selectedScriptScene, setSelectedScriptScene] = useState<number>(3);

  const scriptScenes = [
    {
      id: 1,
      slugline: 'EXT. مركز الملك عبدالله المالي (KAFD) - الرياض - ليل / شفق بارد',
      timecode: 'TC 01:14:22:18',
      summary: 'انعكاس الشفق على الزجاج العمودي وتدفق خيوط الضوء الرقمية السريعة.',
      cameraDirection: 'PAN SLOW UPWARDS // 80mm PRIME // T1.8 // ISO 1250',
      action: 'الكاميرا تبدأ من مستوى الرصيف التيتانيومي المصقول. تتدفق انعكاسات مصابيح السيارات الرياضية كأطياف ضوئية أفقية بيضاوية. تقف "سارة" (٣٤ عاماً، متأملة)، تحمل جهاز استشعار زمني كهرومغناطيسي، شاشته الرقمية تعدّ بالنانوثانية.',
      dialogue: [
        {
          character: 'صوت الراوي (V.O.)',
          text: 'في الرياض، الوقت لا ينتظر أحداً. هو خط مستقيم، سرعة معالجة، وحساب للمستقبل قبل أن يولد.'
        },
        {
          character: 'سارة',
          parenthetical: '(تنظر للأفق البعيد، هامسة)',
          text: 'لكن في مكان ما هناك... الأرض لا تزال تحفظ النسخة الأولى من الصمت.'
        }
      ]
    },
    {
      id: 2,
      slugline: 'EXT. ممر الكثبان الغربية - قطار الحرمين - سرعة ٣٠٠ كم/س - شروق',
      timecode: 'TC 02:33:09:04',
      summary: 'اندفاع القطار الأبيض الفائق كقوس ضوء عبر رمال الحجاز.',
      cameraDirection: 'TRACKING HIGH SPEED // 50mm PRIME // T2.0 // RAMP 120 FPS → 24 FPS',
      action: 'شريط القطار السريع يشق الصحراء. الظلال الطويلة للكثبان الرملية تتحرك كالستائر المتسارعة. داخل المقطورة الزجاجية، قطرة ماء موضوعة على حافة طاولة تهتز بانتظام هندسي دقيق.',
      dialogue: [
        {
          character: 'صوت الراوي (V.O.)',
          text: 'ثلاثمائة كيلومتر في الساعة. نقترب من خط التماس بين أسرع ما اخترعناه، وأقدم ما عرفه الكوكب.'
        }
      ]
    },
    {
      id: 3,
      slugline: 'EXT. مدائن صالح - صخرة الحِجر - العُلا - فجر ٠٤:٤٨ ص',
      timecode: 'TC 04:48:19:14',
      summary: 'المشهد الرئيسي: الصمت المطلق، خط الظل ينزل على واجهة المقبرة النبطية.',
      cameraDirection: 'STATIC MASTER 2.39:1 // 35mm DNA LF // T2.8 // WB 2800K // KEY 8200 LUX',
      action: 'سكون مطلق. لا أثر للريح. واجهة المقبرة المنحوتة في الصخر الرملي العملاق ترتفع أمام الفجر كأنها عمارة لم تُمس منذ ألفي عام. خط ظل الجبل المقابل ينحدر ببطء ملليمتر تلو الآخر فوق النقوش. تضع سارة يدها المكشوفة على مسام الحجر البارد.',
      dialogue: [
        {
          character: 'سارة',
          parenthetical: '(تتحسس خطوط الإزميل القديمة)',
          text: 'هنا... النبضة ليست بالملي ثانية. هنا النبضة عمرها قرن كامل.'
        },
        {
          character: 'صوت الراوي (V.O.)',
          parenthetical: '(يرافقه رنين التردد المنخفض 24Hz)',
          text: 'عايِر نبضك وفق هذا الحجر. هذا الصمت لم يُكسر قط؛ هو فقط يستمع إليك.'
        }
      ]
    },
    {
      id: 4,
      slugline: 'EXT. وادي عِشار - قاعة مرايا - ضوء الفجر المتسلل',
      timecode: 'TC 05:12:44:02',
      summary: 'انعكاس الجبال الشاهقة على سطح المرآة العملاقة، اختفاء المعمار داخل الطبيعة.',
      cameraDirection: 'SLOW GIMBAL PUSH // 50mm PRIME // T2.4 // FILL 4000 LUX',
      action: 'واجهة قاعة مرايا العاكسة تبتلع الجبال المحيطة. لا يمكن للعين تمييز أين ينتهي الصخر وأين يبدأ الزجاج. الكاميرا تقترب من نقطة الالتقاء حتى يختفي الخط الفاصل.',
      dialogue: [
        {
          character: 'سارة',
          text: 'حين تصبح المرآة صخرة، وحين يصبح الصخر زمناً... تفهم لماذا لا نركض بعد الآن.'
        }
      ]
    },
    {
      id: 5,
      slugline: 'EXT. أفق صخرة الفيل - العُلا - غروب الشمس ٠٥:٤٢ م',
      timecode: 'TC 06:02:18:22',
      summary: 'الساعة الذهبية واحتراق الأفق، التلاشي الشمسي الكلي ورسالة الختام.',
      cameraDirection: 'TELEPHOTO COMPRESSION // 110mm DNA // T2.3 // SUN RIM 29000 LUX',
      action: 'قرص الشمس البرتقالي العملاق يهبط خلف صخرة الفيل. الهواء الصحراوي يتموج بالحرارة العالقة. سارة تنظر إلى ساعة يدها الرقمية التي توقفت تماماً عند الصفر، ثم تبتسم وتغلق الجهاز.',
      dialogue: [
        {
          character: 'صوت الراوي (V.O.)',
          text: 'ساعة الصمت المطلق... ليست نهاية الوقت، بل بدايته الحقيقية.'
        }
      ]
    }
  ];

  const current = scriptScenes.find(s => s.id === selectedScriptScene) || scriptScenes[2];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#1f1f23] p-8 rounded-xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#ffc174]">
              <span className="bg-[#292a2d] px-2 py-0.5 rounded uppercase">FX // STAGE 04</span>
              <span>•</span>
              <span>السيناريو السينمائي المعتمد والتوجيهات الإخراجية</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif text-[#e3e2e6] tracking-tight">
              {isRtl ? 'نص السيناريو واللقطات الميدانية' : 'Cinematic Screenplay & Shot Beats'}
            </h1>
            <p className="text-sm text-[#d8c3ad] max-w-3xl mt-3 leading-relaxed">
              مسودة السيناريو المصادق عليها للتصوير الميداني، مرتبطة مباشرة بمخططات الإضاءة والعدسات في المرحلة الخامسة.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                onSelectSceneForSimulation(current.id);
                onNavigateToStage(5);
              }}
              className="px-5 py-2.5 bg-[#f59e0b] hover:bg-[#ffb95f] text-xs font-mono font-bold rounded text-[#472a00] transition flex items-center gap-2 shadow-lg"
            >
              <span>محاكاة هذه اللقطة في الكاميرا (المرحلة ٥)</span>
              <span>←</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scene Selectors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 font-mono text-xs">
        <span className="text-[#cac7b8] px-2 whitespace-nowrap">المشهد:</span>
        {scriptScenes.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedScriptScene(s.id)}
            className={`px-3 py-1.5 rounded transition whitespace-nowrap ${
              s.id === selectedScriptScene
                ? 'bg-[#343538] text-[#ffc174] font-bold border border-[#f59e0b]/40 shadow-sm'
                : 'bg-[#1b1b1f] text-[#cac7b8] hover:bg-[#292a2d] border border-white/5'
            }`}
          >
            {s.slugline.split(' - ')[0]}
          </button>
        ))}
      </div>

      {/* Screenplay Paper Presentation Deck */}
      <div className="bg-[#1b1b1f] rounded-xl border border-white/10 p-8 shadow-2xl relative">
        <div className="max-w-3xl mx-auto space-y-6 font-mono text-sm leading-relaxed">
          {/* Top metadata strip */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 text-xs text-[#cac7b8]">
            <span className="text-[#ffc174] font-bold">SCENE {current.id.toString().padStart(2, '0')}</span>
            <span>{current.timecode}</span>
            <span className="bg-[#292a2d] px-2 py-0.5 rounded text-[11px] text-[#e3e2e6]">{current.cameraDirection}</span>
          </div>

          {/* Slugline */}
          <div className="font-bold text-[#e3e2e6] text-base tracking-wide border-r-2 border-[#f59e0b] pr-3">
            {current.slugline}
          </div>

          {/* Action paragraph */}
          <div className="text-[#cac7b8] text-xs leading-loose pl-4 font-sans">
            {current.action}
          </div>

          {/* Dialogue Blocks */}
          <div className="space-y-6 pt-4">
            {current.dialogue.map((d, idx) => (
              <div key={idx} className="max-w-md mx-auto text-center space-y-1">
                <div className="font-bold text-[#ffc174] uppercase tracking-wider text-xs font-mono">
                  {d.character}
                </div>
                {d.parenthetical && (
                  <div className="text-[11px] text-[#cac7b8] italic">
                    {d.parenthetical}
                  </div>
                )}
                <div className="text-[#e3e2e6] text-sm leading-relaxed font-serif pt-1">
                  "{d.text}"
                </div>
              </div>
            ))}
          </div>

          {/* Director's Technical Note */}
          <div className="mt-8 pt-4 border-t border-white/10 text-xs text-[#d8c3ad] flex items-center justify-between font-mono bg-[#0d0e11] p-4 rounded">
            <div>
              <span className="text-[#ffc174] font-bold block">ملاحظة مدير التصوير (DP Note):</span>
              <span className="text-[11px] text-[#cac7b8]">{current.summary}</span>
            </div>
            <button
              onClick={() => {
                onSelectSceneForSimulation(current.id);
                onNavigateToStage(5);
              }}
              className="px-3 py-1.5 bg-[#292a2d] hover:bg-[#343538] text-[#ffc174] border border-[#f59e0b]/30 rounded text-xs transition"
            >
              افتح لوحة الإضاءة والكاميرا لهذا المشهد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
