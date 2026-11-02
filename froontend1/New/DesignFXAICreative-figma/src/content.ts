export type Lang = 'en' | 'ar'
export type View = 'directions' | 'home' | 'brief' | 'engines' | 'insight' | 'concept' | 'script' | 'output'
export const STEP_VIEWS = ['brief', 'engines', 'insight', 'concept', 'script', 'output'] as const
export type StepView = (typeof STEP_VIEWS)[number]
export const ENGINE_IDS = ['provocation', 'analogies', 'random', 'opposite', 'reversal'] as const
export type EngineId = (typeof ENGINE_IDS)[number]

export interface Engine {
  name: string
  q: string
  how: string
  applied: string
  trace: string[]
  insight: string
}
export interface SceneCopy {
  slug: string
  action: string
  who: string
  line: string
  vo: string
  vo2: string
  shot: string
  mood: string
  sound: string
  dur: number
}
export interface RouteCopy {
  name: string
  title: string
  lines: [string, string]
  manifesto: string
}
export interface StageCopy {
  title: string
  desc: string
  editable: string
  regen: string
  next: string
}
export interface BriefData {
  text: string
  client: string
  objective: string
  audience: string
  tone: string
  constraint: string
}
export interface Copy {
  dir: 'ltr' | 'rtl'
  ui: Record<string, string>
  steps: string[]
  pipe: { name: string; verb: string; desc: string }[]
  recent: { name: string; step: number; pct: number }[]
  stages: Record<StepView, StageCopy>
  brief: BriefData
  briefTrace: string[]
  engines: Record<EngineId, Engine>
  shared: string[]
  scaffold: { label: string; text: string }[]
  routes: RouteCopy[]
  pillars: [string, string][]
  scenes: SceneCopy[]
}

export interface Work {
  brief: BriefData
  engine: EngineId
  insightGen: boolean
  insightSet: number
  insights: string[]
  insightPick: number
  route: number
  routes: { title: string; line: string; manifesto: string; lineIdx: number }[]
  scenes: { action: string; who: string; line: string; vo: string; dur: number; alt: boolean }[]
}

export interface Ctx {
  t: Copy
  lang: Lang
  work: Work
  setWork: (f: (w: Work) => Work) => void
  go: (v: View) => void
  toast: (m: string) => void
}

export const insightsFor = (t: Copy, e: EngineId, set: number) =>
  set === 0 ? [t.engines[e].insight, t.shared[0], t.shared[1]] : [t.shared[2], t.shared[3], t.shared[4]]

export function initialWork(t: Copy): Work {
  return {
    brief: { ...t.brief },
    engine: 'opposite',
    insightGen: false,
    insightSet: 0,
    insights: insightsFor(t, 'opposite', 0),
    insightPick: 0,
    route: 0,
    routes: t.routes.map((r) => ({ title: r.title, line: r.lines[0], manifesto: r.manifesto, lineIdx: 0 })),
    scenes: t.scenes.map((s) => ({ action: s.action, who: s.who, line: s.line, vo: s.vo, dur: s.dur, alt: false })),
  }
}

const en: Copy = {
  dir: 'ltr',
  ui: {
    brandSub: 'Creative Lab',
    directions: 'Directions',
    trace_title: 'What FX is thinking',
    here: 'You are here',
    stage: 'Stage',
    l_edit: 'Editable',
    l_regen: 'Regenerate',
    l_next: 'Next action',
    back: 'Back',
    regen: 'Regenerate',
    lens: 'Lens',
    home_h1a: 'A brief goes in.',
    home_h1b: 'A film comes out.',
    home_p:
      'FX is a creative laboratory. Give it a brief; it thinks laterally, finds the human truth, shapes the concept and writes the film.',
    home_new: 'Open the brief',
    home_cont: 'Resume Dar Cold Brew',
    home_now: 'Now showing in the lab',
    home_resume: 'Resume script',
    home_pipe: 'The pipeline',
    home_lens: 'Between brief and insight: five lenses of lateral thinking',
    home_recent: 'In the lab',
    bf_text: 'The brief',
    bf_ph: 'Describe the problem plainly. FX reads between the lines.',
    bf_client: 'Client',
    bf_obj: 'Objective',
    bf_aud: 'Audience',
    bf_tone: 'Tone',
    bf_con: 'Constraint',
    strength: 'Brief strength',
    en_apply: 'Applied to your brief',
    en_how: 'How it thinks',
    en_selected: 'Selected lens',
    en_pick: 'Select this lens',
    en_out: 'Hands back three strategic insights.',
    in_thinking: 'FX is thinking',
    in_via: 'Via',
    in_anatomy: 'Anatomy of the selected insight',
    in_hint: 'Select one. Click any sentence to rewrite it.',
    co_route: 'Route',
    co_title: 'Title',
    co_line: 'Line',
    co_manifesto: 'Manifesto',
    co_from: 'Built from the insight',
    co_principles: 'Creative principles',
    sc_scenes: 'Scenes',
    sc_runtime: 'Runtime',
    sc_target: 'target',
    sc_shot: 'Shot',
    sc_mood: 'Mood',
    sc_sound: 'Sound',
    sc_dur: 'Duration',
    sc_regen: 'Regenerate this scene',
    sc_vo: 'Voice-over',
    sc_super: 'SUPER',
    sc_fade: 'FADE IN:',
    sc_film: 'A 60-second film for',
    sc_sec: 's',
    ou_pdf: 'Export PDF',
    ou_copy: 'Copy treatment',
    ou_share: 'Share board',
    ou_next: 'Next creative actions',
    ou_a1: 'Run a second lens on the same brief',
    ou_a2: 'Develop another route to script',
    ou_a3: 'Cut a 15-second social version',
    ou_edit: 'Edit',
    ou_chain: 'The chain of thought',
    ou_treatment: 'Treatment',
    ou_toast: 'Prototype only: nothing is exported or sent.',
    ou_new: 'Start a new brief',
    ou_reset: 'Session reset to the sample brief.',
  },
  steps: ['Brief', 'Lens', 'Insight', 'Concept', 'Script', 'Output'],
  pipe: [
    { name: 'Brief', verb: 'You bring the problem.', desc: 'A plain-language brief, structured by FX into audience, tension and constraint.' },
    { name: 'Insight', verb: 'FX finds the human truth.', desc: 'A lens of lateral thinking turns the brief into three strategic insights.' },
    { name: 'Concept', verb: 'Ideas take a shape.', desc: 'Three creative routes, each with a title, a line and a manifesto.' },
    { name: 'Script', verb: 'The idea becomes a film.', desc: 'A scene-by-scene cinematic script, timed to the second and editable on the page.' },
  ],
  recent: [
    { name: 'Dar Cold Brew: The Second Sunset', step: 4, pct: 80 },
    { name: 'Hayat Telecom: Roaming Home', step: 3, pct: 55 },
    { name: 'Masaa Fragrance: The Smell of Tomorrow', step: 2, pct: 35 },
    { name: 'Al Noor Bank: The Honest Overdraft', step: 1, pct: 20 },
  ],
  stages: {
    brief: {
      title: 'The Brief',
      desc: 'Everything starts with a problem worth solving. Write it plainly; FX reads between the lines.',
      editable: 'Every field',
      regen: 'Not needed here',
      next: 'Choose a thinking lens',
    },
    engines: {
      title: 'Choose a Lens',
      desc: 'Five engines of lateral thinking. Each looks at your brief from a different angle and hands back a different kind of insight.',
      editable: 'Lens selection',
      regen: 'Re-run any lens',
      next: 'Run the lens, read insights',
    },
    insight: {
      title: 'Strategic Insight',
      desc: 'A good insight is a human truth with tension in it. Select the one worth building on, then rewrite it in your own words.',
      editable: 'Click any sentence',
      regen: 'Three new insights',
      next: 'Develop the concept',
    },
    concept: {
      title: 'Creative Concept',
      desc: 'The insight becomes an idea. Compare three routes, then shape the title, the line and the manifesto.',
      editable: 'Title, line, manifesto',
      regen: 'Rewrite the line',
      next: 'Write the script',
    },
    script: {
      title: 'Cinematic Script',
      desc: 'Five scenes, sixty seconds. Edit any line on the page; regenerate one scene without losing the rest.',
      editable: 'Every line on the page',
      regen: 'The selected scene',
      next: 'See the final output',
    },
    output: {
      title: 'Final Output',
      desc: 'Everything that led here, in one place. Edit any link in the chain and the rest follows.',
      editable: 'Jump to any stage',
      regen: 'Run another lens',
      next: 'Start a new brief',
    },
  },
  brief: {
    text: "Dar is a Riyadh specialty roaster launching its first ready-to-drink cold brew. The category talks about energy and mornings. Dar's best customers, though, drink it after sunset. We need a 60-second film that makes cold brew feel like the city's real beginning, not a caffeine fix.",
    client: 'Dar Coffee Roasters',
    objective: 'Launch awareness among 22 to 34 year-old urban professionals in Riyadh and Jeddah',
    audience: 'Late-chronotype creatives, architects and makers',
    tone: 'Warm, nocturnal, quietly confident',
    constraint: 'Sixty seconds. No bottle in the first forty.',
  },
  briefTrace: [
    'Category: specialty coffee, crowded with energy claims.',
    'Audience signal: late-chronotype urban professionals.',
    'Tension found: sold for mornings, loved at night.',
  ],
  engines: {
    provocation: {
      name: 'Provocation',
      q: 'What outrageous statement would force a new path?',
      how: 'FX states something deliberately absurd about your brand, then mines it for the usable truth underneath.',
      applied: 'PO: Coffee is not for waking up. Coffee is for refusing to go to bed.',
      trace: [
        'Reading category conventions: energy, mornings, productivity.',
        "Stating the unacceptable: 'coffee should be sold at night'.",
        'Extracting the usable truth beneath the provocation.',
      ],
      insight: "Nobody drinks cold brew at 9 p.m. to stay awake. They drink it to refuse the day's ending.",
    },
    analogies: {
      name: 'Analogies',
      q: 'What else in the world behaves like this?',
      how: 'FX borrows structures from distant domains such as architecture, tides and theatre, and maps them onto your brand.',
      applied: 'Cold brew is to coffee what blue hour is to the day: slower, deeper, and over before you notice.',
      trace: [
        'Scanning distant domains: tides, theatre, photography.',
        'Matching structure: slow extraction, slow dusk.',
        "Mapping 'blue hour' onto the product ritual.",
      ],
      insight: "Cold brew takes twelve hours to make and ten minutes to drink. Dusk works the same way: the Gulf's best hour is its slowest.",
    },
    random: {
      name: 'Random Stimulus',
      q: 'What happens when something unrelated walks into the room?',
      how: 'FX draws an unrelated word, image or object and forces a connection back to the brief.',
      applied: "Stimulus: a lighthouse. A light that doesn't wake people up; it tells them where they are.",
      trace: [
        "Drawing a stimulus: 'lighthouse'.",
        'Forcing links: guidance, night, solitary work.',
        'Keeping only the connection that survives.',
      ],
      insight: "Late-night work isn't lonely when you have a light to steer by. Dar can be the lighthouse of the city's night shift.",
    },
    opposite: {
      name: 'Opposite Thinking',
      q: 'What if we argued the reverse?',
      how: 'FX inverts every assumption in the brief and tests which inversions are still true for real people.',
      applied: "Not 'wake up', but 'stay in'. Not a morning ritual, but the city's second morning.",
      trace: [
        'Listing assumptions: morning, energy, productivity.',
        'Inverting each one: evening, presence, slowness.',
        'Testing which inversions stay true to customers.',
      ],
      insight: "The Gulf day doesn't end at sunset; it begins again. Evening is the city's second morning, and it deserves its own drink.",
    },
    reversal: {
      name: 'Constraint Reversal',
      q: 'What if the limitation were the idea?',
      how: 'FX takes your hardest constraint and turns it into the creative engine of the work.',
      applied: 'No bottle for forty seconds? Then the film is about everything that happens before anyone reaches for a drink.',
      trace: [
        'Isolating the constraint: no product in the first forty seconds.',
        'Reversing it: absence becomes anticipation.',
        'Designing the reveal around the delay.',
      ],
      insight: 'The thing people want most is the thing they are made to wait for. The best nights are built on anticipation, not consumption.',
    },
  },
  shared: [
    "Dar's real competitor isn't another coffee; it's sleep, and the guilt of not wanting it.",
    'In Riyadh the temperature drops and the city exhales. Evening is when people finally belong to themselves.',
    'Cold brew gives permission: permission to keep going, to stay curious, to stay out.',
    'Caffeine sells energy. Dar can sell the feeling of time that belongs to you.',
    'The most original work happens in the hour no one else is awake to judge it.',
  ],
  scaffold: [
    { label: 'Surface behaviour', text: 'People order coffee after 8 p.m. and describe it as a guilty habit.' },
    { label: 'Hidden tension', text: "They want the evening to count, but the culture of productivity says it's over." },
    { label: 'Opportunity', text: 'Make the evening feel like a beginning, with Dar as the ritual that opens it.' },
  ],
  routes: [
    {
      name: 'Route A',
      title: 'The Second Sunset',
      lines: ["The day doesn't end. It changes light.", 'Dar. For the hour after sunset.'],
      manifesto:
        'When the sun goes down over Riyadh, nobody goes home. The towers switch on, the streets fill, and the real work of the day (thinking, making, meeting) begins again. The Second Sunset is a film about that second light, and the cold brew that belongs to it.',
    },
    {
      name: 'Route B',
      title: 'Last Call for Tomorrow',
      lines: ['Tomorrow starts tonight.', 'Dar. Brewed slow for the long night.'],
      manifesto:
        'A film in which tomorrow\'s ideas are born tonight. We follow five strangers, each one cup away from finishing something they were told could wait until morning.',
    },
    {
      name: 'Route C',
      title: 'The Waiting Hour',
      lines: ['Good things are worth the wait.', 'Dar. Twelve hours to brew. Ten minutes to love.'],
      manifesto:
        'Constraint becomes cinema: for forty seconds the bottle never appears. We only see the city leaning toward a drink it has not yet reached, and the pour, when it comes, feels like release.',
    },
  ],
  pillars: [
    ['Nocturnal warmth', 'Amber light, never neon.'],
    ['Slow craft', 'Twelve hours, visible in every frame.'],
    ['Quiet confidence', 'No shouting. The city speaks first.'],
  ],
  scenes: [
    {
      slug: 'EXT. RIYADH SKYLINE, DUSK',
      action: 'The sun drops behind the towers. Traffic softens. The whole city seems to exhale.',
      who: '',
      line: '',
      vo: 'Every day ends once.',
      vo2: 'They say the day is over.',
      shot: 'Wide anamorphic, slow push-in',
      mood: 'Held breath',
      sound: 'A distant call to prayer fading into traffic hum',
      dur: 10,
    },
    {
      slug: "INT. ARCHITECT'S STUDIO, 7:42 PM",
      action: 'NOUR (28) closes her laptop. Looks at the window. Reopens it, smiling.',
      who: 'NOUR',
      line: 'Not yet.',
      vo: 'Not here.',
      vo2: 'Not tonight.',
      shot: 'Medium, handheld, warm practicals',
      mood: 'Mischief',
      sound: 'Keyboard clicks, room tone',
      dur: 12,
    },
    {
      slug: 'EXT. ROOFTOP, NIGHT',
      action: 'Cold brew pours over a single sphere of ice. A macro crack. City lights bloom in the amber.',
      who: '',
      line: '',
      vo: 'Dar Cold Brew. Twelve hours slow. For the hour after sunset.',
      vo2: 'Made slowly. Poured for the night.',
      shot: 'Macro, 120 fps, shallow focus',
      mood: 'Release',
      sound: 'Ice crack, low cello swell',
      dur: 14,
    },
    {
      slug: 'EXT. CORNICHE, NIGHT (MONTAGE)',
      action:
        'A violinist rehearses. Skaters trace the promenade. A father hands his daughter the car keys. Everyone is awake on purpose.',
      who: '',
      line: '',
      vo: "The city doesn't sleep. It changes shift.",
      vo2: 'Some of us begin at night.',
      shot: 'Montage, lens flares, long lens',
      mood: 'Joy',
      sound: 'Live violin over a slow beat',
      dur: 14,
    },
    {
      slug: 'TITLE CARD',
      action: 'Black. A single amber line draws across the frame and becomes a horizon. The title resolves.',
      who: '',
      line: '',
      vo: 'Dar. The second sunset.',
      vo2: 'Dar. Brewed for tonight.',
      shot: 'Graphic, typographic',
      mood: 'Resolve',
      sound: 'One sustained note, then silence',
      dur: 10,
    },
  ],
}

const ar: Copy = {
  dir: 'rtl',
  ui: {
    brandSub: 'مختبر الإبداع',
    directions: 'الاتجاهات',
    trace_title: 'ما يفكر فيه FX',
    here: 'أنت هنا',
    stage: 'المرحلة',
    l_edit: 'قابل للتحرير',
    l_regen: 'إعادة التوليد',
    l_next: 'الخطوة التالية',
    back: 'رجوع',
    regen: 'إعادة التوليد',
    lens: 'العدسة',
    home_h1a: 'يدخل الموجز.',
    home_h1b: 'ويخرج فيلم.',
    home_p: 'FX مختبر إبداعي. أعطه موجزاً، فيفكر جانبياً، ويكشف الحقيقة الإنسانية، ويصوغ الفكرة، ويكتب الفيلم.',
    home_new: 'افتح الموجز',
    home_cont: 'تابع «دار كولد برو»',
    home_now: 'يُعرض الآن في المختبر',
    home_resume: 'تابع السيناريو',
    home_pipe: 'مسار العمل',
    home_lens: 'بين الموجز والرؤية: خمس عدسات للتفكير الجانبي',
    home_recent: 'في المختبر',
    bf_text: 'الموجز',
    bf_ph: 'صف المشكلة ببساطة. FX يقرأ ما بين السطور.',
    bf_client: 'العميل',
    bf_obj: 'الهدف',
    bf_aud: 'الجمهور',
    bf_tone: 'النبرة',
    bf_con: 'القيد',
    strength: 'قوة الموجز',
    en_apply: 'مطبّقة على موجزك',
    en_how: 'كيف تفكر',
    en_selected: 'العدسة المختارة',
    en_pick: 'اختر هذه العدسة',
    en_out: 'تُعيد ثلاث رؤى استراتيجية.',
    in_thinking: 'FX يفكر',
    in_via: 'عبر',
    in_anatomy: 'تشريح الرؤية المختارة',
    in_hint: 'اختر واحدة. اضغط على أي جملة لإعادة كتابتها.',
    co_route: 'المسار',
    co_title: 'العنوان',
    co_line: 'الشعار',
    co_manifesto: 'البيان',
    co_from: 'مبنية على الرؤية',
    co_principles: 'المبادئ الإبداعية',
    sc_scenes: 'المشاهد',
    sc_runtime: 'المدة',
    sc_target: 'المستهدف',
    sc_shot: 'اللقطة',
    sc_mood: 'الإحساس',
    sc_sound: 'الصوت',
    sc_dur: 'المدة',
    sc_regen: 'أعد توليد هذا المشهد',
    sc_vo: 'التعليق الصوتي',
    sc_super: 'نص على الشاشة',
    sc_fade: 'تلاشٍ إلى الصورة:',
    sc_film: 'فيلم مدته ٦٠ ثانية لصالح',
    sc_sec: 'ث',
    ou_pdf: 'تصدير PDF',
    ou_copy: 'انسخ المعالجة',
    ou_share: 'شارك اللوحة',
    ou_next: 'الخطوات الإبداعية التالية',
    ou_a1: 'شغّل عدسة ثانية على الموجز نفسه',
    ou_a2: 'طوّر مساراً آخر إلى سيناريو',
    ou_a3: 'أنتج نسخة اجتماعية مدتها ١٥ ثانية',
    ou_edit: 'تحرير',
    ou_chain: 'سلسلة التفكير',
    ou_treatment: 'المعالجة',
    ou_toast: 'نموذج أولي فقط: لا يتم تصدير أو إرسال أي شيء.',
    ou_new: 'ابدأ موجزاً جديداً',
    ou_reset: 'أُعيدت الجلسة إلى الموجز التجريبي.',
  },
  steps: ['الموجز', 'العدسة', 'الرؤية', 'الفكرة', 'السيناريو', 'النتيجة'],
  pipe: [
    { name: 'الموجز', verb: 'تحضر المشكلة.', desc: 'موجز بلغة بسيطة، ينظّمه FX إلى جمهور وتوتر وقيد.' },
    { name: 'الرؤية', verb: 'يكتشف FX الحقيقة الإنسانية.', desc: 'عدسة من التفكير الجانبي تحوّل الموجز إلى ثلاث رؤى استراتيجية.' },
    { name: 'الفكرة', verb: 'تتخذ الأفكار شكلاً.', desc: 'ثلاثة مسارات إبداعية، لكل منها عنوان وشعار وبيان.' },
    { name: 'السيناريو', verb: 'تتحول الفكرة إلى فيلم.', desc: 'سيناريو سينمائي مشهداً بمشهد، موقوت بالثانية وقابل للتحرير على الصفحة.' },
  ],
  recent: [
    { name: 'دار كولد برو: الغروب الثاني', step: 4, pct: 80 },
    { name: 'حياة للاتصالات: العودة إلى الديار', step: 3, pct: 55 },
    { name: 'مساء للعطور: رائحة الغد', step: 2, pct: 35 },
    { name: 'بنك النور: السحب المكشوف الصادق', step: 1, pct: 20 },
  ],
  stages: {
    brief: {
      title: 'الموجز',
      desc: 'كل شيء يبدأ بمشكلة تستحق الحل. اكتبها ببساطة، وسيقرأ FX ما بين السطور.',
      editable: 'كل الحقول',
      regen: 'غير مطلوب هنا',
      next: 'اختر عدسة التفكير',
    },
    engines: {
      title: 'اختر عدسة',
      desc: 'خمسة محركات للتفكير الجانبي. كل واحد ينظر إلى موجزك من زاوية مختلفة ويعيد نوعاً مختلفاً من الرؤى.',
      editable: 'اختيار العدسة',
      regen: 'أعد تشغيل أي عدسة',
      next: 'شغّل العدسة واقرأ الرؤى',
    },
    insight: {
      title: 'الرؤية الاستراتيجية',
      desc: 'الرؤية الجيدة حقيقة إنسانية فيها توتر. اختر ما يستحق البناء عليه، ثم أعد كتابته بكلماتك.',
      editable: 'اضغط على أي جملة',
      regen: 'ثلاث رؤى جديدة',
      next: 'طوّر الفكرة',
    },
    concept: {
      title: 'الفكرة الإبداعية',
      desc: 'تصبح الرؤية فكرة. قارن بين ثلاثة مسارات، ثم صُغ العنوان والشعار والبيان.',
      editable: 'العنوان والشعار والبيان',
      regen: 'أعد كتابة الشعار',
      next: 'اكتب السيناريو',
    },
    script: {
      title: 'السيناريو السينمائي',
      desc: 'خمسة مشاهد في ستين ثانية. عدّل أي سطر على الصفحة، وأعد توليد مشهد واحد دون خسارة البقية.',
      editable: 'كل سطر على الصفحة',
      regen: 'المشهد المحدد',
      next: 'شاهد النتيجة النهائية',
    },
    output: {
      title: 'النتيجة النهائية',
      desc: 'كل ما أوصل إلى هنا في مكان واحد. عدّل أي حلقة في السلسلة وسيتبعها الباقي.',
      editable: 'انتقل إلى أي مرحلة',
      regen: 'شغّل عدسة أخرى',
      next: 'ابدأ موجزاً جديداً',
    },
  },
  brief: {
    text: 'دار محمصة قهوة مختصة في الرياض تطلق أول كولد برو جاهز للشرب. تتحدث الفئة عن الطاقة والصباحات، لكن أفضل عملاء دار يشربونه بعد الغروب. نحتاج فيلماً مدته ٦٠ ثانية يجعل الكولد برو يبدو كبداية المدينة الحقيقية، لا كجرعة كافيين.',
    client: 'دار لمحامص القهوة',
    objective: 'إطلاق الوعي بين المهنيين الحضريين بعمر ٢٢ إلى ٣٤ في الرياض وجدة',
    audience: 'مبدعون ومهندسون وصنّاع من أهل الليل',
    tone: 'دافئة، ليلية، واثقة بهدوء',
    constraint: 'ستون ثانية. لا قارورة في أول أربعين.',
  },
  briefTrace: [
    'الفئة: قهوة مختصة، مزدحمة بوعود الطاقة.',
    'إشارة الجمهور: مهنيون حضريون يفضلون الليل.',
    'التوتر المكتشف: تُباع للصباح، وتُحَب في الليل.',
  ],
  engines: {
    provocation: {
      name: 'الاستفزاز',
      q: 'أي جملة صادمة قد تفتح طريقاً جديداً؟',
      how: 'يطلق FX عبارة غير معقولة عن علامتك عمداً، ثم يستخرج منها الحقيقة القابلة للاستخدام.',
      applied: 'القهوة ليست للاستيقاظ. القهوة لرفض النوم.',
      trace: ['قراءة أعراف الفئة: الطاقة، الصباح، الإنتاجية.', 'طرح ما لا يُقبل: «القهوة تُباع في الليل».', 'استخراج الحقيقة المفيدة من تحت الاستفزاز.'],
      insight: 'لا أحد يشرب الكولد برو في التاسعة مساءً ليبقى مستيقظاً. إنهم يشربونه ليرفضوا نهاية اليوم.',
    },
    analogies: {
      name: 'التشبيهات',
      q: 'ما الذي في العالم يتصرف بالطريقة نفسها؟',
      how: 'يستعير FX بنى من مجالات بعيدة، كالعمارة والمدّ والمسرح، ويسقطها على علامتك.',
      applied: 'الكولد برو للقهوة كالساعة الزرقاء لليوم: أبطأ وأعمق، وتنتهي قبل أن تنتبه.',
      trace: ['مسح مجالات بعيدة: المدّ والجزر، المسرح، التصوير.', 'مطابقة البنية: استخلاص بطيء، غروب بطيء.', 'إسقاط «الساعة الزرقاء» على طقس المنتج.'],
      insight: 'يحتاج الكولد برو اثنتي عشرة ساعة ليُحضَّر وعشر دقائق ليُشرب. والغروب كذلك: أجمل ساعات الخليج أبطؤها.',
    },
    random: {
      name: 'المحفّز العشوائي',
      q: 'ماذا يحدث حين يدخل شيء لا علاقة له إلى الغرفة؟',
      how: 'يسحب FX كلمة أو صورة أو شيئاً لا صلة له بالموجز ويجبرك على ربطه به.',
      applied: 'المحفّز: منارة. ضوء لا يوقظ الناس، بل يخبرهم أين هم.',
      trace: ['سحب محفّز: «منارة».', 'فرض الروابط: الإرشاد، الليل، العمل الفردي.', 'الإبقاء على الرابط الذي يصمد فقط.'],
      insight: 'العمل الليلي لا يكون وحيداً حين يكون لك ضوء تهتدي به. يمكن لدار أن تكون منارة نوبة الليل في المدينة.',
    },
    opposite: {
      name: 'التفكير المعاكس',
      q: 'ماذا لو حاججنا بالعكس؟',
      how: 'يقلب FX كل افتراض في الموجز ويختبر أي انقلاب ما زال صحيحاً مع الناس الحقيقيين.',
      applied: 'ليس «استيقظ» بل «ابقَ». ليس طقس صباح، بل صباح المدينة الثاني.',
      trace: ['حصر الافتراضات: الصباح، الطاقة، الإنتاجية.', 'قلب كل واحد: المساء، الحضور، البطء.', 'اختبار أي انقلاب يبقى صادقاً مع العملاء.'],
      insight: 'يوم الخليج لا ينتهي عند الغروب، بل يبدأ من جديد. المساء هو صباح المدينة الثاني، ويستحق مشروبه الخاص.',
    },
    reversal: {
      name: 'عكس القيد',
      q: 'ماذا لو كان القيد هو الفكرة؟',
      how: 'يأخذ FX أصعب قيودك ويحوّله إلى محرّك الإبداع في العمل.',
      applied: 'لا قارورة لأربعين ثانية؟ إذن الفيلم عن كل ما يحدث قبل أن يمدّ أحد يده إلى المشروب.',
      trace: ['عزل القيد: لا منتج في أول أربعين ثانية.', 'عكسه: الغياب يصبح ترقباً.', 'بناء الكشف حول التأخير.'],
      insight: 'أكثر ما يريده الناس هو ما يُجبَرون على انتظاره. أجمل الليالي تُبنى على الترقب لا على الاستهلاك.',
    },
  },
  shared: [
    'منافس دار الحقيقي ليس قهوة أخرى، بل النوم، وذنب ألّا نرغب فيه.',
    'في الرياض تنخفض الحرارة وتتنفس المدينة. المساء هو الوقت الذي ينتمي فيه الناس لأنفسهم أخيراً.',
    'الكولد برو يمنح إذناً: إذناً بالاستمرار، وبالفضول، وبالبقاء في الخارج.',
    'الكافيين يبيع الطاقة. ودار تستطيع أن تبيع شعور الوقت الذي يخصّك.',
    'أكثر الأعمال أصالة تولد في الساعة التي لا يستيقظ فيها أحد ليحكم عليها.',
  ],
  scaffold: [
    { label: 'السلوك الظاهر', text: 'يطلب الناس القهوة بعد الثامنة مساءً ويصفونها بعادة مُذنِبة.' },
    { label: 'التوتر الخفي', text: 'يريدون للمساء أن يُحسب، لكن ثقافة الإنتاجية تقول إنه انتهى.' },
    { label: 'الفرصة', text: 'اجعل المساء يبدو بداية، واجعل دار الطقس الذي يفتحه.' },
  ],
  routes: [
    {
      name: 'المسار أ',
      title: 'الغروب الثاني',
      lines: ['اليوم لا ينتهي. إنه يغيّر ضوءه.', 'دار. لساعة ما بعد الغروب.'],
      manifesto:
        'حين تغيب الشمس فوق الرياض لا يعود أحد إلى بيته. تضيء الأبراج وتمتلئ الشوارع، ويبدأ العمل الحقيقي لليوم من جديد: التفكير والصنع واللقاء. «الغروب الثاني» فيلم عن ذلك الضوء الثاني، وعن الكولد برو الذي ينتمي إليه.',
    },
    {
      name: 'المسار ب',
      title: 'نداء أخير للغد',
      lines: ['الغد يبدأ الليلة.', 'دار. محضّرة ببطء لليل الطويل.'],
      manifesto:
        'فيلم تولد فيه أفكار الغد الليلة. نتابع خمسة غرباء، كل منهم على بُعد فنجان من إنهاء شيء قيل له إنه يحتمل الانتظار حتى الصباح.',
    },
    {
      name: 'المسار ج',
      title: 'ساعة الانتظار',
      lines: ['الأشياء الجميلة تستحق الانتظار.', 'دار. اثنتا عشرة ساعة تحضير. عشر دقائق حب.'],
      manifesto:
        'يتحول القيد إلى سينما: لأربعين ثانية لا تظهر القارورة أبداً. لا نرى إلا المدينة وهي تميل نحو مشروب لم تبلغه بعد، وحين يأتي السكب يبدو كأنه انفراج.',
    },
  ],
  pillars: [
    ['دفء ليلي', 'ضوء كهرماني، لا نيون.'],
    ['صنعة بطيئة', 'اثنتا عشرة ساعة، ظاهرة في كل لقطة.'],
    ['ثقة هادئة', 'بلا صراخ. المدينة تتكلم أولاً.'],
  ],
  scenes: [
    {
      slug: 'خارجي. أفق الرياض، الغروب',
      action: 'تسقط الشمس خلف الأبراج. تلين حركة السير. وكأن المدينة كلها تزفر.',
      who: '',
      line: '',
      vo: 'كل يوم ينتهي مرة واحدة.',
      vo2: 'يقولون إن اليوم قد انتهى.',
      shot: 'لقطة واسعة أنامورفيك، دفع بطيء للأمام',
      mood: 'نَفَس محبوس',
      sound: 'أذان بعيد يتلاشى في همهمة السير',
      dur: 10,
    },
    {
      slug: 'داخلي. مكتب المهندسة، ٧:٤٢ مساءً',
      action: 'تغلق نور (٢٨) حاسوبها. تنظر إلى النافذة. ثم تفتحه من جديد مبتسمة.',
      who: 'نور',
      line: 'ليس بعد.',
      vo: 'ليس هنا.',
      vo2: 'ليس الليلة.',
      shot: 'لقطة متوسطة محمولة، إضاءة دافئة',
      mood: 'مشاكسة',
      sound: 'نقرات لوحة المفاتيح، صوت الغرفة',
      dur: 12,
    },
    {
      slug: 'خارجي. سطح مبنى، ليلاً',
      action: 'يُسكب الكولد برو على كرة جليد واحدة. تشقّق ماكرو. أضواء المدينة تتفتح في الكهرمان.',
      who: '',
      line: '',
      vo: 'دار كولد برو. اثنتا عشرة ساعة من البطء. لساعة ما بعد الغروب.',
      vo2: 'صُنع ببطء. يُسكب لليل.',
      shot: 'ماكرو، ١٢٠ إطاراً، عمق ضيق',
      mood: 'انفراج',
      sound: 'تشقق الجليد، تصاعد تشيلّو منخفض',
      dur: 14,
    },
    {
      slug: 'خارجي. الكورنيش، ليلاً (مونتاج)',
      action: 'عازف كمان يتدرب. متزلجون يرسمون خطوطهم على الممشى. أب يسلّم ابنته مفاتيح السيارة. الجميع مستيقظ عن قصد.',
      who: '',
      line: '',
      vo: 'المدينة لا تنام. إنها تبدّل المناوبة.',
      vo2: 'بعضنا يبدأ في الليل.',
      shot: 'مونتاج، توهجات عدسة، عدسة طويلة',
      mood: 'فرح',
      sound: 'كمان حي فوق إيقاع بطيء',
      dur: 14,
    },
    {
      slug: 'بطاقة العنوان',
      action: 'سواد. يمتد خط كهرماني واحد عبر الكادر ويصير أفقاً. يتشكل العنوان.',
      who: '',
      line: '',
      vo: 'دار. الغروب الثاني.',
      vo2: 'دار. محضّرة لهذه الليلة.',
      shot: 'رسومي، طباعي',
      mood: 'حزم',
      sound: 'نغمة ممتدة واحدة ثم صمت',
      dur: 10,
    },
  ],
}

export const COPY: Record<Lang, Copy> = { en, ar }
