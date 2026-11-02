import React, { useState } from 'react';
import type { Idea } from '../services/fx';

// الفكرة ومرآتها: خط ذهبي يُسحب ليكشف الفكرة المعكوسة
export const MirrorReveal: React.FC<{ idea: Idea; mirror: Idea }> = ({ idea, mirror }) => {
  const [cut, setCut] = useState(50);
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 min-h-[240px]" style={{ direction: 'rtl' }}>
      <div className="p-8 min-h-[240px]">
        <div className="text-xs text-[#cac7b8] mb-2 font-mono">الفكرة</div>
        <h3 className="text-2xl font-serif text-[#ffc174] mb-3">{idea.title}</h3>
        <p className="text-base text-[#e3e2e6] max-w-[44ch] leading-relaxed">{idea.idea}</p>
      </div>
      <div className="absolute inset-0 p-8 bg-[#0f1d26] text-[#7bd0ff]" style={{ clipPath: `inset(0 0 0 ${cut}%)` }}>
        <div className="text-xs opacity-70 mb-2 font-mono">المرآة</div>
        <h3 className="text-2xl font-serif mb-3">{mirror.title}</h3>
        <p className="text-base max-w-[44ch] leading-relaxed">{mirror.idea}</p>
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-[#f59e0b] pointer-events-none" style={{ insetInlineStart: `${cut}%` }} />
      <input type="range" min={0} max={100} value={cut} onChange={e => setCut(+e.target.value)}
        aria-label="اسحب لكشف الفكرة المعكوسة" className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" />
    </div>
  );
};
