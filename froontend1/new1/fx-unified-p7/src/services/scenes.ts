import type { CinematicScene } from '../types';
import type { Work } from './fx';

export interface ScriptScene {
  id: number; slugline: string; timecode: string; summary: string; cameraDirection: string; action: string;
  dialogue: { character: string; parenthetical?: string; text: string }[];
}

// ملصق SVG مضمّن: لا يعتمد على الشبكة (يعالج مخاطر روابط الصور الخارجية في P7)
const poster = (hue: number, label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},40%,12%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},55%,28%)"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1180" cy="330" r="190" fill="hsl(${hue},70%,60%)" opacity=".18"/><text x="90" y="780" font-size="64" fill="#ece6d6" opacity=".55" font-family="serif">${label.replace(/[<>&]/g, '')}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
const t = (b: string) => b.trim().split(/\s+/).slice(0, 5).join(' ') || 'الفكرة';

const BEATS = [
  { ar: 'الافتتاح', en: 'Opening', lens: '80mm', tc: '01:00:00:00', ls: 'EXT. افتتاح - فجر', cam: 'PAN SLOW UPWARDS // 80mm PRIME // T1.8 // ISO 800', wb: '3200K', el: '12 m' },
  { ar: 'التصعيد', en: 'Escalation', lens: '50mm', tc: '01:00:20:00', ls: 'INT. التصعيد - نهار', cam: 'HANDHELD PUSH-IN // 50mm // T2.8 // ISO 1250', wb: '4300K', el: '3 m' },
  { ar: 'الانكسار', en: 'Break', lens: '35mm', tc: '01:00:45:00', ls: 'INT. الانكسار - ليل', cam: 'STATIC LOW ANGLE // 35mm // T2 // ISO 1600', wb: '5600K', el: '1 m' },
  { ar: 'الختام', en: 'Close', lens: '50mm', tc: '01:01:10:00', ls: 'EXT. الختام - شفق', cam: 'LOCKED OFF // 50mm // T4 // ISO 400', wb: '3600K', el: '30 m' },
];

export function buildScenes(w: Work): { sim: CinematicScene[]; script: ScriptScene[] } {
  const topic = t(w.brief), title = w.concept?.title ?? topic, hard = w.intensity > 66;
  const lines = [
    `الكاميرا تدخل ببطء. لا أحد يشرح شيئًا عن «${topic}»؛ فقط ${title}.`,
    `يتسع التوتر حول «${topic}» ويضيق الإطار شيئًا فشيئًا.`,
    hard ? 'قطع حاد وصوت يعلو ثم ينقطع فجأة.' : 'همسة واحدة تغيّر معنى كل ما سبق.',
    `سطر أخير بصوت ${w.archetype}: «${topic}» لم يكن ما ظنّناه.`,
  ];
  if (w.beats && w.beats.length >= 3) w.beats.slice(0, 3).forEach((b, i) => { lines[i] = b; });
  if (w.tagline) lines[3] = w.tagline;
  const sim = BEATS.map((b, i): CinematicScene => ({
    id: i + 1, titleAr: `٠${i + 1} ${b.ar}`, titleEn: `0${i + 1}. ${b.en}`, locationAr: b.ls, locationEn: b.ls,
    timecode: `TC ${b.tc}`, imageUrl: poster(35 + i * 55, `${b.en} · ${title}`),
    directorCalloutAr: `"اللقطة 0${i + 1} - ${lines[i]}"`, directorCalloutEn: `"Shot 0${i + 1} - ${b.en}"`,
    defaultLensId: b.lens, tStop: b.cam.match(/T[\d.]+/)?.[0] ?? 'T2', focusDistance: '3.0 m',
    iso: +(b.cam.match(/ISO (\d+)/)?.[1] ?? 800), shutter: '1/48', wb: b.wb, aspectRatio: '2.39:1',
    elevation: b.el, gps: '—',
  }));
  const script = BEATS.map((b, i): ScriptScene => ({
    id: i + 1, slugline: b.ls, timecode: `TC ${b.tc}`, summary: lines[i], cameraDirection: i === 0 && w.camera ? w.camera : b.cam, action: lines[i],
    dialogue: i === 3 ? [{ character: 'صوت الراوي (V.O.)', parenthetical: '(بهدوء)', text: lines[3] }] : [],
  }));
  return { sim, script };
}
