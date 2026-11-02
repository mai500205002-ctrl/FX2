import type { Brief, EngineId, Idea, Locale, Scene, Script, Strategy } from './types'

/**
 * Realistic placeholder content used by the mock service until the FX backend
 * is connected. Everything is derived from the user's brief so edits are reflected.
 */

export const sampleBrief: Record<Locale, Brief> = {
  ar: {
    project: 'ذاكرة — إطلاق ٢٠٢٧',
    brand: 'دار العود',
    product: 'عطر «ذاكرة»، أول عطر عود خفيف للاستخدام اليومي',
    objective: 'جعل العود جزءاً من الهوية اليومية لجيل الشباب في الخليج، لا مناسبة خاصة فقط.',
    audience: 'شباب وشابات بين ١٩ و٢٨ عاماً، يعيشون بين ثقافتين، يقدّرون الأصالة لكنهم يرفضون كل ما يبدو قديماً.',
    challenge: 'العود في أذهانهم رائحة الآباء والمناسبات الرسمية — ثقيل، رسمي، ولا يشبههم.',
    context: 'موجة عودة إلى الجذور في الموضة والموسيقى الخليجية، مع هيمنة العطور الغربية على الاستخدام اليومي.',
    requirements: 'فيلم رئيسي ٦٠ ثانية، نسخ قصيرة للمنصات الاجتماعية، نبرة واثقة غير متكلفة، دون كليشيهات الصحراء.',
  },
  en: {
    project: 'Memory — 2027 Launch',
    brand: 'Dar Al Oud',
    product: '“Memory”, the first light oud fragrance made for everyday wear',
    objective: 'Make oud part of the everyday identity of young Gulf audiences — not just a special-occasion scent.',
    audience: 'Men and women aged 19–28 living between two cultures. They value authenticity but reject anything that feels old.',
    challenge: 'To them, oud smells like their parents and formal occasions — heavy, formal, not them.',
    context: 'A return-to-roots wave in Gulf fashion and music, while Western fragrances dominate everyday wear.',
    requirements: '60-second hero film, short social cut-downs, confident unforced tone, no desert clichés.',
  },
}

const fallback = (value: string, alt: string) => (value.trim() ? value.trim() : alt)

export function buildStrategy(brief: Brief, locale: Locale): Strategy {
  const brand = fallback(brief.brand, locale === 'ar' ? 'العلامة' : 'the brand')
  const product = fallback(brief.product, locale === 'ar' ? 'المنتج' : 'the product')

  if (locale === 'ar') {
    return {
      insight: `الجيل الجديد لا يرفض التراث — يرفض أن يُفرض عليه. حين يختار الإرث بنفسه، يصبح جزءاً من هويته.`,
      audienceInsight: `«أنا لا أريد أن أشبه أبي، لكنني أريد أن أحمل شيئاً منه.» — هم يبحثون عن طريقة شخصية لحمل الأصل دون أن يبدو كزيّ رسمي.`,
      tension: `الانتماء مقابل التفرّد: يريدون جذوراً عميقة، وصوتاً لا يشبه أحداً.`,
      opportunity: `أن تتحول ${brand} من حارسة للتقاليد إلى أداة شخصية للتعبير عن الذات، وأن يكون ${product} أول عود يُختار لا يُورث.`,
      territory: `الحنين الحاضر — ذلك الشعور حين تعيدك رائحة إلى لحظة، ثم تدرك أنك تصنع ذكرى جديدة الآن.`,
      direction: `لا نبيع العود كتراث، بل كذاكرة شخصية تُكتب الآن. كل يوم عادي يستحق أن يُتذكر.`,
    }
  }

  return {
    insight: `The new generation doesn't reject heritage — they reject having it imposed. When they choose legacy for themselves, it becomes identity.`,
    audienceInsight: `"I don't want to be my father, but I want to carry something of him." They want a personal way to wear their roots without it feeling like a uniform.`,
    tension: `Belonging versus standing out: they want deep roots and a voice that sounds like no one else.`,
    opportunity: `Move ${brand} from guardian of tradition to a personal tool for self-expression — making ${product} the first oud you choose, not inherit.`,
    territory: `Present nostalgia — the moment a scent takes you back, and you realize you're making a new memory right now.`,
    direction: `We don't sell oud as heritage, but as personal memory being written today. Every ordinary day deserves to be remembered.`,
  }
}

type IdeaSeed = Omit<Idea, 'id' | 'score' | 'version' | 'refinements'>

function ideaSeeds(brief: Brief, locale: Locale): Record<EngineId, IdeaSeed> {
  const brand = fallback(brief.brand, locale === 'ar' ? 'العلامة' : 'the brand')

  if (locale === 'ar') {
    return {
      provocation: {
        engine: 'provocation',
        bigIdea: 'العود ليس لأبيك.',
        territory: 'تمرّد هادئ على الوراثة',
        theme: 'ليس إرثاً. اختيار.',
        hook: 'نفتح على أب يرشّ العود على ابنه — ثم يتوقف الابن ويختار زجاجته الخاصة.',
        message: `${brand} تمنحك العود بشروطك أنت.`,
      },
      analogies: {
        engine: 'analogies',
        bigIdea: 'العطر كألبوم صور لا يُرى',
        territory: 'الذاكرة الحسية',
        theme: 'كل يوم صورة.',
        hook: 'لقطات يومية عادية تتجمد كصور فوتوغرافية، وتحت كل صورة اسم الرائحة التي حملتها.',
        message: 'الرائحة أقوى ذاكرة نملكها — اصنع ذكرياتك عمداً.',
      },
      random: {
        engine: 'random',
        bigIdea: 'مترو الرياض، ٧:٤٠ صباحاً',
        territory: 'الشعر في اليومي',
        theme: 'العود في كل مكان تذهب إليه.',
        hook: 'رائحة واحدة تنتقل بين ركاب مترو مزدحم وتغيّر مزاج العربة بأكملها.',
        message: 'العود ليس للمناسبات. هو لرحلتك اليومية.',
      },
      opposite: {
        engine: 'opposite',
        bigIdea: 'أخف عود في التاريخ',
        territory: 'الخفة كقوة',
        theme: 'خفيف. ولا يُنسى.',
        hook: 'بدلاً من الدخان الكثيف، نصوّر العود كنسمة شفافة تكاد لا تُرى.',
        message: 'العمق لا يحتاج إلى ثقل.',
      },
      constraint: {
        engine: 'constraint',
        bigIdea: 'ثلاث ثوانٍ تكفي',
        territory: 'الأثر الفوري',
        theme: 'ثلاث ثوانٍ. ذكرى كاملة.',
        hook: 'كل نسخة قصيرة تبدأ بثلاث ثوانٍ صامتة — ثم لحظة يلتفت فيها أحدهم.',
        message: 'قيد المدة القصيرة يصبح دليلاً على قوة الأثر.',
      },
    }
  }

  return {
    provocation: {
      engine: 'provocation',
      bigIdea: "Oud isn't your father's.",
      territory: 'A quiet rebellion against inheritance',
      theme: 'Not a legacy. A choice.',
      hook: 'We open on a father spraying oud on his son — who pauses, and reaches for his own bottle instead.',
      message: `${brand} gives you oud on your own terms.`,
    },
    analogies: {
      engine: 'analogies',
      bigIdea: 'Scent as an invisible photo album',
      territory: 'Sensory memory',
      theme: 'Every day, a picture.',
      hook: 'Ordinary moments freeze like photographs; beneath each one, the name of the scent it carried.',
      message: 'Scent is our strongest memory — make yours on purpose.',
    },
    random: {
      engine: 'random',
      bigIdea: 'Riyadh Metro, 7:40am',
      territory: 'Poetry in the everyday',
      theme: 'Oud, wherever you go.',
      hook: 'One scent travels through a packed metro carriage and shifts the mood of everyone on board.',
      message: "Oud isn't for occasions. It's for your daily commute.",
    },
    opposite: {
      engine: 'opposite',
      bigIdea: 'The lightest oud ever made',
      territory: 'Lightness as strength',
      theme: 'Light. Unforgettable.',
      hook: 'Instead of thick smoke, we film oud as a translucent breeze you can barely see.',
      message: "Depth doesn't need weight.",
    },
    constraint: {
      engine: 'constraint',
      bigIdea: 'Three seconds is enough',
      territory: 'Instant impact',
      theme: 'Three seconds. A whole memory.',
      hook: 'Every short cut opens with three silent seconds — then a moment where someone turns around.',
      message: 'The short-format constraint becomes proof of the scent’s impact.',
    },
  }
}

const engineOrder: EngineId[] = ['provocation', 'analogies', 'random', 'opposite', 'constraint']

const baseScores: Record<EngineId, number> = {
  provocation: 88,
  analogies: 79,
  random: 74,
  opposite: 83,
  constraint: 77,
}

let ideaCounter = 0
const nextIdeaId = () => `idea_${Date.now().toString(36)}_${(ideaCounter++).toString(36)}`

const jitter = () => Math.round((Math.random() - 0.5) * 8)

export function buildIdeas(
  brief: Brief,
  locale: Locale,
  engines: EngineId[],
  count: number,
): Idea[] {
  const seeds = ideaSeeds(brief, locale)
  const active = engineOrder.filter((e) => engines.includes(e))
  const pool = [...active, ...engineOrder.filter((e) => !active.includes(e))]
  return pool.slice(0, count).map((engine) => ({
    ...seeds[engine],
    id: nextIdeaId(),
    score: Math.min(97, Math.max(60, baseScores[engine] + jitter())),
    version: 1,
    refinements: [],
  }))
}

export function buildReplacementIdea(
  brief: Brief,
  locale: Locale,
  engines: EngineId[],
  exclude: EngineId[],
  previous: Idea,
): Idea {
  const seeds = ideaSeeds(brief, locale)
  const active = engineOrder.filter((e) => engines.includes(e))
  const candidates = [...active, ...engineOrder.filter((e) => !active.includes(e))].filter(
    (e) => !exclude.includes(e),
  )
  const engine = candidates[0] ?? previous.engine
  return {
    ...seeds[engine],
    id: nextIdeaId(),
    score: Math.min(97, Math.max(60, baseScores[engine] + jitter())),
    version: 1,
    refinements: [],
  }
}

export function applyRefinement(idea: Idea, instruction: string, locale: Locale): Idea {
  const trimmed = instruction.trim()
  const note =
    locale === 'ar'
      ? `صيغت بتوجيه: «${trimmed}».`
      : `Reworked toward: “${trimmed}”.`
  return {
    ...idea,
    hook: `${idea.hook} ${note}`,
    score: Math.min(98, idea.score + 2 + Math.round(Math.random() * 3)),
    version: idea.version + 1,
    refinements: [...idea.refinements, trimmed],
  }
}

let sceneCounter = 0
export const nextSceneId = () => `scene_${Date.now().toString(36)}_${(sceneCounter++).toString(36)}`

export function buildScript(brief: Brief, idea: Idea, locale: Locale): Script {
  const brand = fallback(brief.brand, locale === 'ar' ? 'العلامة' : 'the brand')

  const scenes: Omit<Scene, 'id'>[] =
    locale === 'ar'
      ? [
          {
            duration: 6,
            scene: 'داخلي — بيت العائلة — فجر',
            action: 'أب يقف أمام المرآة يضع العود على ياقة ثوبه بعناية طقسية.',
            visual: 'ضوء أزرق بارد يتسلل من نافذة. دخان رقيق في الهواء.',
            camera: 'لقطة ثابتة واسعة، عدسة ٣٥ ملم، كادر متماثل.',
            dialogue: '—',
            voiceover: 'كل بيت له رائحة…',
            music: 'صمت، ثم نغمة عود منفردة منخفضة.',
            sound: 'صوت الرشّاش، قماش الثوب، أذان بعيد.',
          },
          {
            duration: 8,
            scene: 'داخلي — الممر — متصل',
            action: 'الابن يمر بجانب أبيه. يتوقف الأب ويمد إليه زجاجة العود.',
            visual: 'تباين بين ثوب الأب الأبيض وسترة الابن الداكنة.',
            camera: 'حركة دولي بطيئة نحو اليد الممدودة.',
            dialogue: 'الأب: «خذ… مثل أبوك.»',
            voiceover: '—',
            music: 'العود يستمر، يتصاعد قليلاً.',
            sound: 'خطوات على البلاط.',
          },
          {
            duration: 10,
            scene: 'داخلي — الممر — متصل',
            action: `الابن يبتسم، يضع يده على يد أبيه بلطف، ثم يُخرج من جيبه زجاجة صغيرة: ${idea.bigIdea}`,
            visual: 'لقطة مقرّبة على الزجاجتين جنباً إلى جنب.',
            camera: 'لقطة مقرّبة جداً، عمق ميدان ضحل.',
            dialogue: 'الابن: «عندي واحد يشبهني.»',
            voiceover: '—',
            music: 'توقف مفاجئ للموسيقى.',
            sound: 'نَفَس واحد. صمت.',
          },
          {
            duration: 14,
            scene: 'خارجي — شوارع المدينة — صباح',
            action: 'مونتاج سريع: الابن في المترو، في المقهى، مع أصدقائه — في كل مكان يلتفت إليه أحدهم.',
            visual: 'ألوان دافئة، ضوء صباحي ذهبي، ملمس فيلم ١٦ ملم.',
            camera: 'كاميرا محمولة، قطعات إيقاعية على النبض.',
            dialogue: '—',
            voiceover: idea.message,
            music: 'إيقاع خليجي حديث يدخل بقوة، عود مُعاد توزيعه.',
            sound: 'ضجيج المدينة يتداخل مع الإيقاع.',
          },
          {
            duration: 12,
            scene: 'داخلي — بيت العائلة — مساء',
            action: 'الأب يقترب من ابنه، يشمّ الهواء، ويبتسم بفضول.',
            visual: 'نفس كادر الافتتاح، لكن بإضاءة دافئة الآن.',
            camera: 'لقطة متوسطة، تعود إلى التماثل.',
            dialogue: 'الأب: «وش هذا؟»  الابن: «ذاكرة.»',
            voiceover: '—',
            music: 'العود المنفرد يعود، يمتزج مع الإيقاع الحديث.',
            sound: 'ضحكة خفيفة.',
          },
          {
            duration: 10,
            scene: 'لقطة المنتج',
            action: `الزجاجة على سطح حجري. اسم ${brand}.`,
            visual: 'خلفية جرافيتية، ضوء جانبي واحد.',
            camera: 'دوران بطيء ٤٥ درجة.',
            dialogue: '—',
            voiceover: idea.theme,
            music: 'النغمة الأخيرة تتلاشى.',
            sound: 'نقرة غطاء الزجاجة.',
          },
        ]
      : [
          {
            duration: 6,
            scene: 'INT. FAMILY HOME — DAWN',
            action: 'A father stands at the mirror, applying oud to his collar with ritual care.',
            visual: 'Cold blue light through a window. Thin smoke in the air.',
            camera: 'Locked-off wide, 35mm, symmetrical frame.',
            dialogue: '—',
            voiceover: 'Every home has a scent…',
            music: 'Silence, then a single low oud note.',
            sound: 'Atomizer, fabric of the thobe, distant call to prayer.',
          },
          {
            duration: 8,
            scene: 'INT. HALLWAY — CONTINUOUS',
            action: 'The son walks past. The father stops him and holds out the bottle.',
            visual: "Contrast between the father's white thobe and the son's dark jacket.",
            camera: 'Slow dolly toward the outstretched hand.',
            dialogue: 'FATHER: "Here… like your father."',
            voiceover: '—',
            music: 'Oud continues, rising slightly.',
            sound: 'Footsteps on tile.',
          },
          {
            duration: 10,
            scene: 'INT. HALLWAY — CONTINUOUS',
            action: `The son smiles, gently covers his father's hand, and pulls out a small bottle of his own: ${idea.bigIdea}`,
            visual: 'Close-up of the two bottles side by side.',
            camera: 'Extreme close-up, shallow depth of field.',
            dialogue: 'SON: "I have one that\'s me."',
            voiceover: '—',
            music: 'Music cuts out abruptly.',
            sound: 'A single breath. Silence.',
          },
          {
            duration: 14,
            scene: 'EXT. CITY STREETS — MORNING',
            action: 'Fast montage: the son on the metro, in a café, with friends — everywhere, someone turns toward him.',
            visual: 'Warm palette, golden morning light, 16mm texture.',
            camera: 'Handheld, rhythmic cuts on the beat.',
            dialogue: '—',
            voiceover: idea.message,
            music: 'Modern Gulf beat drops in, oud re-arranged.',
            sound: 'City noise woven into the rhythm.',
          },
          {
            duration: 12,
            scene: 'INT. FAMILY HOME — EVENING',
            action: 'The father leans toward his son, catches the scent, and smiles with curiosity.',
            visual: 'Same frame as the opening, now in warm light.',
            camera: 'Medium shot, returning to symmetry.',
            dialogue: 'FATHER: "What is that?"  SON: "Memory."',
            voiceover: '—',
            music: 'Solo oud returns, blending with the modern beat.',
            sound: 'A soft laugh.',
          },
          {
            duration: 10,
            scene: 'PACKSHOT',
            action: `The bottle on a stone surface. ${brand} wordmark.`,
            visual: 'Graphite background, single side light.',
            camera: 'Slow 45° orbit.',
            dialogue: '—',
            voiceover: idea.theme,
            music: 'Final note fades.',
            sound: 'Click of the bottle cap.',
          },
        ]

  return {
    title: idea.bigIdea,
    logline: idea.hook,
    scenes: scenes.map((s) => ({ ...s, id: nextSceneId() })),
  }
}

export function estimateTokens(...parts: unknown[]) {
  const chars = JSON.stringify(parts).length
  return Math.round(chars / 3.2) + 420
}
