// Pool indices are always in range; relax strict index checks for template lookups.
import type { Brief, Concept, EngineId, Insight, Lang, Scene } from "./types";

// Deterministic local "AI" — seeded PRNG over brief content.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)] as T;
export const uid = () => Math.random().toString(36).slice(2, 9);

const fill = (s: string, b: Brief) =>
  s.replaceAll("{brand}", b.brand || "the brand")
    .replaceAll("{aud}", b.audience || "the audience")
    .replaceAll("{tension}", b.tension || "")
    .replaceAll("{msg}", b.keyMessage || "");

type Pool = Record<Lang, { title: string[]; tension: string[]; contra: string[]; opp: string[] }>;

const POOLS: Record<EngineId, Pool> = {
  provocation: {
    en: {
      title: ["What if {brand} told people to buy less?", "Po: The product is invisible", "What if the audience wrote the ad?"],
      tension: ["{aud} crave belonging but distrust anything that feels manufactured to belong to.", "{aud} want ritual, but resent being sold rituals.", "Status today is quiet; loud brands feel insecure."],
      contra: ["They follow brands they claim not to care about.", "They value slowness while living at maximum speed.", "They want to be seen, but not watched."],
      opp: ["Make {brand} the brand that steps back so the person steps forward.", "Turn silence into the signature: fewer words, more presence.", "Hand authorship to the audience — {brand} becomes the stage, not the star."],
    },
    ar: {
      title: ["ماذا لو طلبت {brand} من الناس أن يشتروا أقل؟", "استفزاز: المنتج غير مرئي", "ماذا لو كتب الجمهور الإعلان بنفسه؟"],
      tension: ["{aud} يتوقون للانتماء لكنهم لا يثقون بأي انتماء مصطنع.", "{aud} يريدون الطقوس، لكنهم يرفضون أن تُباع لهم.", "المكانة اليوم هادئة؛ والعلامات الصاخبة تبدو غير واثقة."],
      contra: ["يتابعون علامات يدّعون أنهم لا يهتمون بها.", "يقدّرون البطء بينما يعيشون بأقصى سرعة.", "يريدون أن يُروا، لا أن يُراقَبوا."],
      opp: ["اجعل {brand} العلامة التي تتراجع خطوة ليتقدّم الإنسان.", "حوّل الصمت إلى توقيع: كلمات أقل وحضور أكبر.", "سلّم القلم للجمهور — تصبح {brand} المسرح لا البطل."],
    },
  },
  analogies: {
    en: {
      title: ["{brand} is a lighthouse, not a billboard", "Like a desert oasis: rare, remembered", "The brand as a well-kept secret recipe"],
      tension: ["{aud} navigate an ocean of noise and look for a fixed point.", "Abundance has made everything forgettable.", "Inheritance matters more than novelty to {aud}."],
      contra: ["They chase the new yet trust the old.", "They have endless choice but feel they have none.", "They share everything but keep the meaningful private."],
      opp: ["Position {brand} as the constant — the light that doesn't move.", "Engineer scarcity of moments, not of product.", "Frame {brand} as something passed down, not bought."],
    },
    ar: {
      title: ["{brand} منارة لا لوحة إعلانية", "كواحة في الصحراء: نادرة ولا تُنسى", "العلامة كوصفة عائلية سرّية"],
      tension: ["{aud} يبحرون في محيط من الضجيج ويبحثون عن نقطة ثابتة.", "الوفرة جعلت كل شيء قابلاً للنسيان.", "الإرث يعني لـ{aud} أكثر من الجديد."],
      contra: ["يطاردون الجديد لكنهم يثقون بالقديم.", "لديهم خيارات لا نهائية ويشعرون أنهم بلا خيار.", "يشاركون كل شيء ويحتفظون بالمهم لأنفسهم."],
      opp: ["ضع {brand} كالثابت — الضوء الذي لا يتحرك.", "اصنع ندرة في اللحظات لا في المنتج.", "قدّم {brand} كشيء يُورَّث لا يُشترى."],
    },
  },
  random: {
    en: {
      title: ["Stimulus: 'a broken clock'", "Stimulus: 'grandmother's hands'", "Stimulus: 'the last train home'"],
      tension: ["Even a stopped clock is right twice a day — {aud} fear being out of time.", "Care is measured in time spent, not money spent.", "{aud} live for the in-between moments nobody advertises."],
      contra: ["They plan everything but remember only the unplanned.", "They outsource care yet crave its texture.", "They treat transit as wasted time — where they actually think."],
      opp: ["Own the 'right moment' — {brand} as perfect timing.", "Show the hands behind {brand}: craft as love.", "Claim the in-between: {brand} for the moments between moments."],
    },
    ar: {
      title: ["محفّز: «ساعة متوقفة»", "محفّز: «يدا الجدة»", "محفّز: «آخر قطار للمنزل»"],
      tension: ["حتى الساعة المتوقفة تصيب مرتين يومياً — {aud} يخشون فوات الوقت.", "الاهتمام يُقاس بالوقت المبذول لا بالمال.", "{aud} يعيشون للحظات البينية التي لا يعلن عنها أحد."],
      contra: ["يخططون لكل شيء ولا يتذكرون إلا غير المخطط.", "يوكلون الرعاية للغير ويشتاقون لملمسها.", "يعتبرون التنقل وقتاً ضائعاً — وفيه يفكرون حقاً."],
      opp: ["امتلك «اللحظة المناسبة» — {brand} كتوقيت مثالي.", "أظهر الأيدي خلف {brand}: الحِرفة كحب.", "احتلّ المسافة البينية: {brand} للحظات بين اللحظات."],
    },
  },
  opposite: {
    en: {
      title: ["Instead of 'more', celebrate 'enough'", "Instead of youth, sell patience", "The anti-launch: {brand} disappears"],
      tension: ["The category screams energy; {aud} are exhausted.", "Everyone promises transformation; {aud} want to stay themselves.", "Every brand wants attention; attention is what {aud} can't spare."],
      contra: ["They buy stimulation to feel calm.", "They seek self-improvement to finally feel accepted as-is.", "They resent ads but love a story."],
      opp: ["{brand} as the category's first calm voice.", "Celebrate who they already are — no 'better you'.", "Earn attention by asking for less of it."],
    },
    ar: {
      title: ["بدلاً من «المزيد»، احتفِ بـ«الكفاية»", "بدلاً من الشباب، بِع الصبر", "الإطلاق المضاد: {brand} تختفي"],
      tension: ["الفئة تصرخ بالطاقة؛ و{aud} منهكون.", "الجميع يعد بالتحول؛ و{aud} يريدون البقاء كما هم.", "كل علامة تريد الانتباه؛ والانتباه هو ما لا يملكه {aud}."],
      contra: ["يشترون الإثارة ليشعروا بالهدوء.", "يسعون لتطوير الذات ليشعروا أخيراً بالقبول.", "يكرهون الإعلانات لكنهم يحبون القصص."],
      opp: ["{brand} كأول صوت هادئ في الفئة.", "احتفِ بمن هم عليه الآن — لا «نسخة أفضل».", "اكسب الانتباه بطلب القليل منه."],
    },
  },
  constraint: {
    en: {
      title: ["No logo, no product shot — only feeling", "A campaign told in one word", "Zero budget: what spreads by itself?"],
      tension: ["{aud} recognise brands by behaviour, not badges.", "Complexity reads as dishonesty to {aud}.", "What {aud} share is what they'd say themselves."],
      contra: ["They ignore logos yet can name a brand from a colour.", "They want depth but reward brevity.", "They distrust paid media but trust their group chat."],
      opp: ["Build a sensory signature so strong {brand} needs no logo.", "Find the single word {brand} can own in the culture.", "Design a shareable ritual — the audience is the media."],
    },
    ar: {
      title: ["بلا شعار ولا لقطة منتج — فقط إحساس", "حملة تُروى بكلمة واحدة", "ميزانية صفر: ما الذي ينتشر وحده؟"],
      tension: ["{aud} يتعرّفون على العلامات بالسلوك لا بالشارات.", "التعقيد يبدو كذباً بالنسبة لـ{aud}.", "ما يشاركه {aud} هو ما كانوا سيقولونه بأنفسهم."],
      contra: ["يتجاهلون الشعارات لكنهم يعرفون العلامة من لونها.", "يريدون العمق لكنهم يكافئون الإيجاز.", "لا يثقون بالإعلان المدفوع ويثقون بمجموعة الدردشة."],
      opp: ["ابنِ توقيعاً حسياً قوياً لا تحتاج معه {brand} لشعار.", "جد الكلمة الواحدة التي تمتلكها {brand} في الثقافة.", "صمّم طقساً قابلاً للمشاركة — الجمهور هو الوسيلة."],
    },
  },
};

export function generateInsights(b: Brief, engine: EngineId, seed: number): Insight[] {
  const r = rng(hash(JSON.stringify(b) + engine) + seed);
  const p = POOLS[engine][b.language];
  const idx = [0, 1, 2].sort(() => r() - 0.5);
  return idx.map((i, k) => ({
    id: uid(),
    engine,
    title: fill(p.title[i], b),
    tension: fill(p.tension[(i + k) % 3], b),
    contradiction: fill(pick(r, p.contra), b),
    opportunity: fill(p.opp[i], b),
  }));
}

const C = {
  en: {
    core: ["{brand} doesn't fill the silence — it frames it.", "Every pour is a pause the city can't take from you.", "The quiet ones are the ones you remember."],
    theme: ["The Quiet Signal", "Pause, Owned", "Unhurried", "Light That Stays"],
    mech: ["A 30-second film shot entirely in one unbroken take, paired with a city-wide 'silence hour' activation.", "Out-of-home that dims at night; a social ritual where people post one still frame of their pause.", "Audio-first campaign: ambient soundscapes on streaming platforms, the brand heard before it's seen."],
    emo: ["Calm confidence", "Tender nostalgia", "Defiant serenity", "Warm intimacy"],
  },
  ar: {
    core: ["{brand} لا تملأ الصمت — بل تؤطّره.", "كل رشفة وقفة لا تستطيع المدينة أن تأخذها منك.", "الهادئون هم من نتذكرهم."],
    theme: ["الإشارة الهادئة", "وقفة تخصّك", "بلا عجلة", "ضوء يبقى"],
    mech: ["فيلم مدته ٣٠ ثانية بلقطة واحدة متصلة، مع فعالية «ساعة الصمت» في أنحاء المدينة.", "إعلانات خارجية تخفت ليلاً؛ وطقس اجتماعي ينشر فيه الناس لقطة ثابتة واحدة من وقفتهم.", "حملة صوتية أولاً: مشاهد صوتية محيطية على منصات البث، تُسمع العلامة قبل أن تُرى."],
    emo: ["ثقة هادئة", "حنين رقيق", "سكينة متحدّية", "حميمية دافئة"],
  },
};
const MOODS = [
  ["oklch(0.35 0.06 60)", "oklch(0.75 0.08 70)", "oklch(0.2 0.02 260)", "oklch(0.9 0.03 80)"],
  ["oklch(0.25 0.05 240)", "oklch(0.6 0.1 220)", "oklch(0.85 0.05 200)", "oklch(0.45 0.12 30)"],
  ["oklch(0.3 0.04 150)", "oklch(0.7 0.07 120)", "oklch(0.92 0.02 90)", "oklch(0.5 0.1 50)"],
];
const MOODWORDS = { en: ["Golden hour", "Grain", "Negative space", "Breath", "Dust", "Linen", "Night blue", "Stillness"], ar: ["الساعة الذهبية", "حُبيبات", "مساحة فارغة", "نَفَس", "غبار", "كتان", "أزرق ليلي", "سكون"] };

export function generateConcepts(b: Brief, insight: Insight, seed: number): Concept[] {
  const r = rng(hash(insight.id + insight.title) + seed);
  const c = C[b.language];
  return [0, 1, 2].map((i) => ({
    id: uid(),
    insightId: insight.id,
    coreIdea: fill(c.core[(i + seed) % 3], b),
    theme: pick(r, c.theme),
    mechanism: c.mech[(i + seed + 1) % 3],
    emotion: pick(r, c.emo),
    keyMessage: b.keyMessage || insight.opportunity,
    score: { originality: 70 + Math.floor(r() * 28), relevance: 68 + Math.floor(r() * 30), impact: 65 + Math.floor(r() * 32) },
    mood: MOODS[(i + seed) % 3],
    moodWords: [...MOODWORDS[b.language]].sort(() => r() - 0.5).slice(0, 4),
  }));
}

const S = {
  en: {
    visual: ["Dawn over rooftops. A figure on a balcony, city still asleep.", "Close on hands wrapping around a glass; condensation catches light.", "Rush-hour street — then everything slows; one person stops walking.", "Wide: the person among the crowd, lit differently, calm.", "Product resting on a windowsill as the sun rises fully. Logo appears softly."],
    camera: ["Slow push-in, 35mm, handheld breathing", "Macro, locked off, shallow depth", "Speed ramp 100% → 20%, dolly left", "Crane up, 24mm wide", "Static frame, rack focus to product"],
    dialogue: ["VO: “The city never asks how you are.”", "(No dialogue — breath only)", "VO: “So we stopped asking it for permission.”", "VO: “{msg}”", "SUPER: {brand}. — Own the pause."],
    music: ["Solo oud, sparse notes", "Oud continues, low drone enters", "Music drops out entirely", "Strings swell, warm", "Single resolving note"],
    sound: ["Distant call to prayer, wind", "Ice settling, glass tap", "Traffic muffles into heartbeat", "Crowd hush, birds", "Room tone, soft exhale"],
    trans: ["Fade from black", "Match cut on circle", "Hard cut to silence", "Light leak dissolve", "Fade to black"],
  },
  ar: {
    visual: ["فجر فوق الأسطح. شخص على شرفة والمدينة نائمة.", "لقطة قريبة ليدين تحتضنان كوباً؛ قطرات التكثّف تلتقط الضوء.", "شارع في ساعة الذروة — ثم يتباطأ كل شيء؛ شخص واحد يتوقف.", "لقطة واسعة: الشخص وسط الحشد بإضاءة مختلفة، هادئ.", "المنتج على حافة نافذة مع شروق الشمس. يظهر الشعار بهدوء."],
    camera: ["اقتراب بطيء، عدسة 35مم، كاميرا محمولة", "ماكرو ثابت، عمق ميدان ضحل", "تغيير سرعة 100% ← 20%، حركة يساراً", "رافعة للأعلى، عدسة 24مم", "كادر ثابت، تحويل التركيز للمنتج"],
    dialogue: ["صوت: «المدينة لا تسألك أبداً كيف حالك.»", "(بلا حوار — أنفاس فقط)", "صوت: «فتوقفنا عن طلب الإذن منها.»", "صوت: «{msg}»", "نص: {brand}. — امتلك وقفتك."],
    music: ["عود منفرد، نغمات متباعدة", "يستمر العود مع طنين منخفض", "تنقطع الموسيقى تماماً", "أوتار تتصاعد بدفء", "نغمة ختامية واحدة"],
    sound: ["أذان بعيد، رياح", "ثلج يستقر، نقرة على الزجاج", "ضجيج السير يتحول لنبض قلب", "سكون الحشد، طيور", "صوت الغرفة، زفير ناعم"],
    trans: ["ظهور تدريجي من السواد", "قطع متطابق على دائرة", "قطع حاد إلى الصمت", "ذوبان بتسرب ضوئي", "تلاشٍ إلى السواد"],
  },
};

export function generateScenes(b: Brief, _c: Concept): Scene[] {
  const s = S[b.language];
  const d = [5, 6, 7, 6, 6];
  return d.map((duration, i) => ({
    id: uid(), duration,
    visual: s.visual[i], camera: s.camera[i], dialogue: fill(s.dialogue[i], b),
    music: s.music[i], sound: s.sound[i], transition: s.trans[i],
  }));
}

const TONES: Record<Lang, Record<string, string>> = {
  en: { cinematic: " — rendered in long, luminous shadows.", playful: " — with a wink and a sudden burst of colour.", intimate: " — so close we hear the breath." },
  ar: { cinematic: " — بظلال طويلة مضيئة.", playful: " — بلمسة مرحة وانفجار مفاجئ للألوان.", intimate: " — قريباً لدرجة أننا نسمع الأنفاس." },
};
export function rewriteScene(sc: Scene, lang: Lang, tone: "cinematic" | "playful" | "intimate"): Scene {
  const base = sc.visual.replace(/ — .*$/, "");
  return { ...sc, visual: base + TONES[lang][tone] };
}
export function expandScene(sc: Scene, lang: Lang): Scene {
  const add = lang === "ar" ? " تفاصيل: ضوء جانبي دافئ، غبار معلّق في الهواء، إيقاع تنفّس بطيء." : " Detail: warm side-light, dust suspended in air, a slow breathing rhythm.";
  return sc.visual.includes(add) ? sc : { ...sc, visual: sc.visual + add, duration: sc.duration + 2 };
}

export function buildRationale(b: Brief, i?: Insight, c?: Concept) {
  if (!i || !c) return "";
  return b.language === "ar"
    ? `انطلقنا من التوتر: «${i.tension}» الفرصة كانت ${i.opportunity} لذلك تقوم الفكرة «${c.theme}» على أن ${c.coreIdea} ومن خلال آلية واضحة، نحقق الهدف: ${b.objective}`
    : `We started from the tension: “${i.tension}” The opportunity: ${i.opportunity} So “${c.theme}” rests on one idea — ${c.coreIdea} Through a clear mechanism, it delivers the objective: ${b.objective}`;
}

export function exampleBrief(lang: Lang): Brief {
  return lang === "ar"
    ? { projectName: "صحراء — وقفة المدينة", brand: "صحراء", audience: "شباب المدن الخليجية ٢٢–٣٤", challenge: "فئة المياه المعدنية متشابهة، والعلامة تُرى كسلعة لا كخيار.", objective: "رفع تفضيل العلامة ٢٠٪ بين الجمهور خلال ستة أشهر.", tension: "يعيشون بسرعة قصوى لكنهم يتوقون للحظة سكون حقيقية.", keyMessage: "امتلك وقفتك.", tone: "سينمائي، هادئ، واثق", constraints: "٣٠ ثانية، بدون مشاهير، إطلاق في رمضان", language: "ar" }
    : { projectName: "Sahra — The City Pause", brand: "Sahra", audience: "Gulf urban millennials, 22–34", challenge: "Mineral water is a commodity category; Sahra is chosen on price, not meaning.", objective: "Lift brand preference by 20% among the core audience in six months.", tension: "They live at maximum speed, yet crave one moment of genuine stillness.", keyMessage: "Own the pause.", tone: "Cinematic, calm, confident", constraints: "30s film, no celebrities, Ramadan launch", language: "en" };
}
