import type { EngineId, Lang, StageId } from "./types";

const en = {
  lab: "Creative Lab", newBrief: "New brief", recent: "Recent sessions", workflow: "The four-stage method",
  heroA: "From brief to", heroB: "cinematic idea.", heroSub: "An AI creative director that thinks laterally, argues with your assumptions and writes the film.",
  continue: "Continue", open: "Open", delete: "Delete", emptyTitle: "No sessions yet", emptySub: "Start a brief — FX will take it from there.",
  brief: "Brief", engine: "Thinking Engine", insight: "Strategic Insight", concept: "Creative Concept", script: "Cinematic Script", output: "Final Output", home: "Home",
  projectName: "Project name", brand: "Brand", audience: "Target audience", challenge: "Business challenge", objective: "Objective", tension: "Tension", keyMessage: "Key message", tone: "Tone", constraints: "Constraints", language: "Output language",
  suggestions: "Director's notes", loadExample: "Load example", next: "Next", back: "Back",
  chooseEngine: "Choose how FX should break your assumptions.", generateInsights: "Generate insights", regenerate: "Regenerate", select: "Select", selected: "Selected", edit: "Edit", done: "Done",
  contradiction: "Contradiction", opportunity: "Opportunity", developConcept: "Develop concepts", coreIdea: "Core idea", theme: "Campaign theme", mechanism: "Creative mechanism", emotion: "Emotional direction",
  originality: "Originality", relevance: "Relevance", impact: "Impact", compare: "Compare", mood: "Mood", writeScript: "Write the script",
  scene: "Scene", duration: "Duration", visual: "Visual", camera: "Camera", dialogue: "Dialogue / VO", music: "Music", sound: "Sound design", transition: "Transition",
  addScene: "Add scene", expand: "Expand", rewrite: "Rewrite", total: "Total", presentation: "View presentation", print: "Print / PDF", exportMd: "Export Markdown", exportJson: "Export JSON", rationale: "Creative rationale",
  saved: "Saved", tokens: "Tokens", remaining: "remaining", credits: "credits", command: "Search actions…", notifications: "Notifications",
  status_idle: "Ready", status_analyzing: "Analyzing brief", status_tensions: "Exploring tensions", status_concept: "Developing concept", status_script: "Structuring script", status_done: "Completed",
  needInsight: "Select an insight first.", needConcept: "Select a concept first.", translate: "Translate output", untitled: "Untitled project",
  tips: ["Name the tension as a contradiction, not a problem.", "A good audience is a mindset, not a demographic.", "Constraints are fuel — be specific.", "One key message. If it has 'and', it's two."],
};
type Dict = typeof en;
const ar: Dict = {
  lab: "المختبر الإبداعي", newBrief: "موجز جديد", recent: "الجلسات الأخيرة", workflow: "المنهج في أربع مراحل",
  heroA: "من الموجز إلى", heroB: "فكرة سينمائية.", heroSub: "مدير إبداعي بالذكاء الاصطناعي يفكر جانبياً، ويجادل افتراضاتك، ويكتب الفيلم.",
  continue: "متابعة", open: "فتح", delete: "حذف", emptyTitle: "لا توجد جلسات بعد", emptySub: "ابدأ موجزاً — وFX سيتولى الباقي.",
  brief: "الموجز", engine: "محرّك التفكير", insight: "الرؤية الاستراتيجية", concept: "الفكرة الإبداعية", script: "السيناريو السينمائي", output: "المخرج النهائي", home: "الرئيسية",
  projectName: "اسم المشروع", brand: "العلامة", audience: "الجمهور المستهدف", challenge: "التحدي التجاري", objective: "الهدف", tension: "التوتر", keyMessage: "الرسالة الرئيسية", tone: "النبرة", constraints: "القيود", language: "لغة المخرجات",
  suggestions: "ملاحظات المخرج", loadExample: "تحميل مثال", next: "التالي", back: "رجوع",
  chooseEngine: "اختر كيف يكسر FX افتراضاتك.", generateInsights: "توليد الرؤى", regenerate: "إعادة التوليد", select: "اختيار", selected: "مختار", edit: "تعديل", done: "تم",
  contradiction: "التناقض", opportunity: "الفرصة", developConcept: "تطوير الأفكار", coreIdea: "الفكرة الجوهرية", theme: "شعار الحملة", mechanism: "الآلية الإبداعية", emotion: "الاتجاه العاطفي",
  originality: "الأصالة", relevance: "الملاءمة", impact: "التأثير", compare: "مقارنة", mood: "المزاج", writeScript: "كتابة السيناريو",
  scene: "مشهد", duration: "المدة", visual: "الوصف البصري", camera: "حركة الكاميرا", dialogue: "الحوار / التعليق", music: "الموسيقى", sound: "تصميم الصوت", transition: "الانتقال",
  addScene: "إضافة مشهد", expand: "توسيع", rewrite: "إعادة كتابة", total: "المجموع", presentation: "عرض التقديم", print: "طباعة / PDF", exportMd: "تصدير Markdown", exportJson: "تصدير JSON", rationale: "المنطق الإبداعي",
  saved: "محفوظ", tokens: "الرموز", remaining: "متبقٍ", credits: "رصيد", command: "ابحث عن إجراء…", notifications: "الإشعارات",
  status_idle: "جاهز", status_analyzing: "تحليل الموجز", status_tensions: "استكشاف التوترات", status_concept: "تطوير الفكرة", status_script: "بناء السيناريو", status_done: "اكتمل",
  needInsight: "اختر رؤية أولاً.", needConcept: "اختر فكرة أولاً.", translate: "ترجمة المخرجات", untitled: "مشروع بلا عنوان",
  tips: ["صُغ التوتر كتناقض لا كمشكلة.", "الجمهور الجيد عقلية لا فئة عمرية.", "القيود وقود — كن محدداً.", "رسالة واحدة. إن احتوت «و» فهي اثنتان."],
};
export const DICT: Record<Lang, Dict> = { en, ar };
export type TKey = Exclude<keyof Dict, "tips">;

export const STAGES: StageId[] = ["brief", "engine", "insight", "concept", "script", "output"];

export const ENGINES: Record<EngineId, { glyph: string; en: [string, string]; ar: [string, string] }> = {
  provocation: { glyph: "Po", en: ["Provocation", "States the absurd on purpose to jolt thinking out of its groove."], ar: ["الاستفزاز", "يطرح الغريب عمداً ليُخرج التفكير من مساره المعتاد."] },
  analogies: { glyph: "≈", en: ["Analogies", "Borrows the logic of another world and maps it onto yours."], ar: ["التشبيهات", "يستعير منطق عالم آخر ويُسقطه على عالمك."] },
  random: { glyph: "✱", en: ["Random Stimulus", "Collides the brief with an unrelated object to force new links."], ar: ["المحفّز العشوائي", "يصدم الموجز بشيء لا علاقة له ليفرض روابط جديدة."] },
  opposite: { glyph: "⇄", en: ["Opposite Thinking", "Inverts the category's default promise and follows the consequence."], ar: ["التفكير العكسي", "يقلب وعد الفئة المعتاد ويتتبع النتيجة."] },
  constraint: { glyph: "⊘", en: ["Constraint Reversal", "Removes what you rely on — logo, budget, words — to find what's left."], ar: ["عكس القيود", "يزيل ما تعتمد عليه — الشعار، الميزانية، الكلمات — ليجد ما يبقى."] },
};
