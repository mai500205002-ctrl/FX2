// طبقة الخدمة الموحدة: عقد P2 + apiFetch من P5 (مهلة/إعادة محاولة) + مولّد محلي احتياطي
export type Engine = 'provocation' | 'analogies' | 'random' | 'opposite' | 'constraint';
export const ENGINES: { id: Engine; ar: string; en: string }[] = [
  { id: 'provocation', ar: 'الاستفزاز', en: 'Provocation' },
  { id: 'analogies', ar: 'الاستعارة', en: 'Analogies' },
  { id: 'random', ar: 'العشوائي', en: 'Random' },
  { id: 'opposite', ar: 'النقيض', en: 'Opposite' },
  { id: 'constraint', ar: 'القيد', en: 'Constraint' },
];
export const ARCHETYPES = ['The Sage', 'The Rebel', 'The Magician', 'The Explorer', 'The Ruler'];

export interface Idea { title: string; idea: string }
export interface Work {
  brief: string; archetype: string; engine: Engine; intensity: number;
  insight?: string; concept?: Idea; mirror?: Idea; source?: 'api' | 'local'; mirrorSource?: 'api' | 'local';
  tagline?: string; beats?: string[]; scriptText?: string; camera?: string;
}
export const EMPTY_WORK: Work = { brief: '', archetype: 'The Sage', engine: 'opposite', intensity: 50 };

// الـBackend الفعلي (P5) على المنفذ 3001؛ نمرّ عبر بروكسي Vite (/api) لتفادي CORS (الأصل المسموح 5000)
const ENV = (import.meta as any).env ?? {};
export const hasBackend = ENV.VITE_FX_BACKEND === '1';
const API = hasBackend ? ((ENV.VITE_FX_API_URL as string) ?? '') : '';

async function apiFetch(path: string, body: unknown, signal?: AbortSignal, retry = 1): Promise<any> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60_000);
  signal?.addEventListener('abort', () => ctl.abort());
  try {
    const r = await fetch(API + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: ctl.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    if (retry > 0 && !signal?.aborted) return apiFetch(path, body, signal, retry - 1);
    throw e;
  } finally { clearTimeout(timer); }
}
const str = (d: any, ...keys: string[]) => {
  for (const k of keys) if (typeof d?.[k] === 'string') return d[k] as string;
  return typeof d === 'string' ? d : JSON.stringify(d);
};

const T = (b: string) => b.trim().split(/\s+/).slice(0, 5).join(' ') || 'الفكرة';
const LOCAL: Record<Engine, (t: string) => { a: Idea; m: Idea }> = {
  provocation: t => ({ a: { title: `${t}: ما لا يُقال`, idea: `نكشف الجملة التي يتجنبها الجميع عن «${t}» على لوحة بلا شعار، والمنتج يظهر في اللقطة الأخيرة فقط.` },
    m: { title: `${t}: ما يُقال بصوت عالٍ`, idea: 'نكرر الجملة المألوفة حتى تفقد معناها، ثم نقطعها في منتصفها ويبقى الصمت هو الرسالة.' } }),
  analogies: t => ({ a: { title: `${t} كأنه مدينة`, idea: `نعامل «${t}» كمدينة لها أحياء ومواسم، وكل مشهد يزور حيًّا بعين سائح غريب.` },
    m: { title: `${t} كأنه غرفة واحدة`, idea: 'غرفة بلا نوافذ، وطاولة واحدة وضوء واحد، وكل المشاهد تدور حولهما.' } }),
  random: t => ({ a: { title: `الصدفة تصنع ${t}`, idea: `نرمي كلمة عشوائية في كل مشهد ونلزم الفريق بربطها بـ«${t}» أمام الكاميرا دون إعادة.` },
    m: { title: `الإتقان يفسد ${t}`, idea: 'نصوّر المشهد ثلاثين مرة حتى يبهت، ونعرض اللقطة الأخيرة المتعبة بوصفها الحقيقة.' } }),
  opposite: t => ({ a: { title: `${t} بالمقلوب`, idea: `يبدأ العمل من النهاية: أثر «${t}» أولًا، ثم يعود الزمن مشهدًا بعد مشهد حتى السبب.` },
    m: { title: `${t} بالمستقيم`, idea: 'لقطة واحدة متصلة من الصباح إلى الليل، لا شيء مقلوب ولا شيء مخبّأ.' } }),
  constraint: t => ({ a: { title: `${t} في ثلاث ثوانٍ`, idea: `لا كلام ولا موسيقى ولا قطع، فقط ثلاث ثوانٍ وإضاءة واحدة عن «${t}».` },
    m: { title: `${t} بلا حدود`, idea: 'نفتح الزمن والميزانية: فيلم من ساعة كاملة ينتهي دون إجابة.' } }),
};

export async function runPipeline(w: Work, lang: 'ar' | 'en', onStep?: (n: 1 | 2) => void, signal?: AbortSignal): Promise<Work> {
  const ctx = { archetype: w.archetype, brandVoice: { formalLevel: 50, metaphorLevel: 60, intensity: w.intensity }, language: lang };
  const local = LOCAL[w.engine](T(w.brief));
  const localInsight = `وراء «${T(w.brief)}» توتر لم يُسمَّ بعد: الناس يريدونه ويخجلون من الاعتراف بذلك.`;
  if (hasBackend) {
    try {
      onStep?.(1);
      const i = await apiFetch('/api/insight', { brief: w.brief, ...ctx }, signal);          // كائن: mainInsight + lateralThinkingBreakdown
      const insight = str(i, 'mainInsight', 'insight');
      onStep?.(2);
      const c = await apiFetch('/api/concept', { insight: i, ...ctx }, signal);              // الخادم يقرأ الكائن كاملًا لا النص فقط
      const concept: Idea = { title: str(c, 'title'), idea: str(c, 'coreIdea', 'idea') };
      const tagline = typeof c?.tagline === 'string' ? c.tagline : undefined;
      // المرآة: طلب ثانٍ لنفس المسار بنص رؤية معكوس؛ عند الفشل نرجع للمولّد المحلي
      let mirror = local.m, mirrorSource: 'api' | 'local' = 'local';
      try {
        const m = await apiFetch('/api/concept', { insight: { ...i, mainInsight: `اعكس هذه الفكرة بالكامل وقدّم نقيضها التام: ${concept.title} — ${concept.idea}` }, ...ctx }, signal, 0);
        const cand: Idea = { title: str(m, 'title'), idea: str(m, 'coreIdea', 'idea') };
        if (cand.title && cand.idea && cand.title !== concept.title) { mirror = cand; mirrorSource = 'api'; }
      } catch (e) { if (signal?.aborted) throw e; }
      // السيناريو الفعلي: 3 beats من /api/script (اختياري)
      let beats: string[] | undefined, scriptText: string | undefined, camera: string | undefined;
      try {
        const sc = await apiFetch('/api/script', { concept: c, ...ctx }, signal, 0);
        if (Array.isArray(sc?.beats)) beats = sc.beats.map(String);
        scriptText = typeof sc?.script === 'string' ? sc.script : undefined;
        camera = typeof sc?.cameraLanguage === 'string' ? sc.cameraLanguage : undefined;
      } catch (e) { if (signal?.aborted) throw e; }
      return { ...w, insight, concept, mirror, tagline, beats, scriptText, camera, source: 'api', mirrorSource };

    } catch (e) { if (signal?.aborted) throw e; }
  }
  onStep?.(1); await new Promise(r => setTimeout(r, 600));
  onStep?.(2); await new Promise(r => setTimeout(r, 600));
  return { ...w, insight: localInsight, concept: local.a, mirror: local.m, source: 'local', mirrorSource: 'local' };
}
