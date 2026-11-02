# FX-2026 — جرد مشاريع الواجهة (الدفعة 2 من 2) + السجل الموحد للثمانية

**المصدر:** `New_501.zip` (12,522,399 بايت، 187 مدخلًا)
**المرحلة:** الجرد والمقارنة الوصفية فقط. لم يُعدَّل أو يُحذف أي ملف، ولا يوجد قرار اختيار قبل استلام الـBackend الحقيقي.
**التصنيف:** **A** = حقيقة من الكود/الملفات · **B** = اختبار نُفذ فعلًا · **C** = استنتاج/تقدير غير متحقق منه.

> **ملاحظة تحقق:** لا توجد أي نتيجة من النوع **B** في الدفعتين. بيئة الفحص بلا شبكة ولا `node_modules`، فلم يُنفَّذ `install` ولا `build` ولا `test` لأي مشروع.

---

## 0. محتوى الأرشيف وتعيين المشاريع

يحتوي الأرشيف على ستة عناصر علوية:

| العنصر | الوصف |
|---|---|
| `TextFX-V5AI-powered creative/` | مشروع كامل: واجهة React + Backend Express + Electron/Capacitor + وثائق |
| `atelier-fx/` | تطبيق Vite من Google AI Studio |
| `atelier-fx-—-cinematic-simulation/` | تطبيق Vite آخر من AI Studio (محتوى مختلف) |
| `stitch_fx_ai_creative_studio/` | تصدير Stitch: 6 شاشات + وثائق + DESIGN.md |
| `stitch_fx_creative_intelligence_workspace/` | تصدير Stitch: 4 شاشات + DESIGN.md |
| `Stitch - Projects.mht` | لقطة صفحة قائمة مشاريع Stitch (4.3MB) |

**نتيجة مهمة (A):** ملف `fx_ai_creative_lab.html` من الدفعة 1 (P4) **مطابق بالـ SHA-256** لـ `stitch_fx_creative_intelligence_workspace/fx_ai_creative_lab_3/code.html`. إذن P4 هو مشروع Stitch Workspace، والملف المُرسل سابقًا هو إحدى شاشاته الأربع.

**تعيين الثمانية (افتراض يحتاج تأكيدك):**

| # | المشروع | الدفعة |
|---|---|---|
| P1 | `DesignFXAICreative-figma` | 1 |
| P2 | `FX-Creative-vo` | 1 |
| P3 | `fx-creative-lovable` | 1 |
| P4 | `stitch_fx_creative_intelligence_workspace` (Atelier Cinématique، يضم ملف HTML السابق) | 1 + 2 |
| P5 | `TextFX-V5AI-powered creative` | 2 |
| P6 | `atelier-fx` | 2 |
| P7 | `atelier-fx-—-cinematic-simulation` | 2 |
| P8 | `stitch_fx_ai_creative_studio` (The Director's Suite) | 2 |

- فحص الأسرار: لا نتائج لأنماط `sk-` و`AIza` والمفاتيح الخاصة في أي ملف (بما فيها `.mht`). ملفات `.env.example` الأربعة تحوي قيمًا بديلة فقط، ولا توجد ملفات `.env` فعلية (A؛ فحص نصي بأنماط: C كتغطية شاملة).
- لا `node_modules` ولا `.git` في أي مشروع (A). لا Git remote ولا commit متاح.

---

## P5 — `TextFX-V5AI-powered creative` (واجهة + Backend)

**الهيكل (A):** `fx-build/{app, backend, electron, electron-src, docs, scripts, local_models}` + إعداد Replit (`.replit`, `replit.md`) + `OPENROUTER_INTEGRATION.md` + مطلبان نصيان متطابقان (`attached_assets`) بصيغة "Principal Software Architect" لتحويل المستودع إلى SaaS على مراحل.

### الواجهة (`fx-build/app`)
| البند | النتيجة |
|---|---|
| التقنية (A) | React 18.3 + Vite 5 + TypeScript؛ `jspdf` + Capacitor 6 (Android)؛ بلا Tailwind ولا مكتبة مكونات (CSS خاص 205 سطرًا) |
| الحجم (A) | ~1,400 سطر: `App.tsx` 681 + `AgentSaaSPanel.tsx` 333 + `ApiKeySetup.tsx` 188 + `styles.css` 205 |
| المراحل (A) | brief ← `/api/insight` ← `/api/concept` ← `/api/script`، مع `archetype` (افتراضي `The Sage`) و`brandVoice` (`formalLevel`, `metaphorLevel`, `intensity`) و`language` |
| تعامل HTTP (A) | `apiFetch`: مهلة 60 ثانية + `AbortController` + محاولة إعادة واحدة؛ رسالة `TIMEOUT` مخصصة؛ إعادة المحاولة عبر `lastAction` |
| التخزين (A) | `localStorage`: `textfx_dark`، `textfx_lang`، `textfx_iterations` (آخر 10 تكرارات) |
| العربية/RTL (A) | ضبط `dir/lang` ديناميكيًا + `dir="auto"` على النصوص المولدة + تبديل المظهر |
| لوحة الوكلاء/SaaS (A) | `AgentSaaSPanel` تستدعي `/api/saas/status` و`/api/agent/status` و`/api/saas/register` و`/api/agent/run` |
| مفتاح API (A) | `ApiKeySetup` ترسل المفتاح إلى الـBackend المحلي (`/api/set-key`) فيخزنه عبر `keytar`؛ لا تستخدم `localStorage` للمفتاح (حسب التعليق والكود) |
| الاختبارات (A) | لا توجد |

### الـBackend داخل الأرشيف (`fx-build/backend`)
> هذا فحص جرد فقط. **لا يثبت أن هذا هو Backend مشروع FX-2026**؛ هوية الـBackend الحقيقي تُثبت من الحزمة التي سترسلها (C).

**المسارات الفعلية (A):**

| الطريقة | المسار |
|---|---|
| GET | `/healthz` · `/health` · `/api/system-prompt` · `/api/metrics` · `/api/key-status` |
| POST | `/agent/run` · `/llm` · `/api/insight` · `/api/concept` · `/api/script` · `/api/full-pipeline` · `/api/set-key` |
| DELETE | `/api/set-key` |
| `/api/agent` | GET `/status` · `/runs` · `/runs/:runId` · `/audit` · POST `/run` |
| `/api/saas` | GET `/status` · `/plans` · `/usage/:tenantId` · POST `/register` |

**مخططات الطلب (A، من الكود):**
- `/api/insight` ← `{ brief, archetype, brandVoice, language }`
- `/api/concept` ← `{ insight, archetype, brandVoice, language }`
- `/api/script` ← `{ concept, archetype, brandVoice, language }`
- `/api/full-pipeline` ← `{ brief, ... }` ويعيد `{ brief, insight, concept, script, pipelineStatus: 'complete' }`
- الأخطاء: 400 عند نقص الحقل أو فشل `sanitize`، 403 عند `policyCheck`، 500 عند الفشل أو المهلة (30 ثانية لكل مرحلة).

**الحماية (A):** حد جسم 512KB؛ محدد معدل 120/دقيقة عامًا و60/دقيقة لـ`/llm`؛ ترويسات أمان؛ CORS لأصل واحد (`CORS_ORIGIN` الافتراضي `http://localhost:5000`)؛ معرّف طلب وسجل ومقاييس؛ `sanitize` بأنماط رفض وطول أقصى 8,000؛ `policyCheck` بحظر كلمات (`bomb, weapon, malware, exploit, ransomware, ddos`) كـ**substring**، مما يوحي باحتمال حظر خاطئ لموجزات إبداعية (استنتاج C).
لم أجد middleware مصادقة على المسارات في الأجزاء التي فحصتها من `index.ts` (C: لم تُقرأ كل الملفات سطرًا بسطر).

**مزودو النماذج (A):** `llm-gateway.ts` فيه عملاء Gemini وOpenRouter؛ و`providers/` فيه OpenAI وVertex. ملف `.env.example` يذكر ترتيب الأولوية: Gemini ← OpenRouter ← OpenAI ← Vertex ← Mock. بينما `replit.md` يذكر OpenAI وVertex فقط (انجراف توثيق). الوضع الافتراضي بلا مفتاح: قوالب/Mock (حسب `replit.md`؛ غير مُشغَّل: C). مجلد `local_models/` فيه README صغير (366 بايت) لم أقرأ مضمونه، فلا أحكم على آلية النماذج المحلية.

**الوحدات (A):** `lateral-thinking-agent` (488 سطرًا)، `insight-generator`، `concept-mapper`، `script-writer`، `trend-service` (525)، `visual-prompt-generator` (278)، `knowledge-base`، `agent-service` (499)، `saas-state` (160). حجم الـBackend ~4,000 سطر.

### تناقضات داخل المشروع (A)
1. `.env.example` يذكر `PORT=4002` و`ALLOWED_ORIGINS` و`AUDIT_THRESHOLD` و`MAX_RETRIES`، بينما الكود لا يقرأ `PORT` ولا `ALLOWED_ORIGINS` (يقرأ `CORS_ORIGIN` ومعامل `--port`)، ولم أجد قراءة للمتغيرين الآخرين؛ وبروكسي Vite وملف `start.sh` يستخدمان 3001.
2. `/api/set-key` يقبل فقط `service=fx-openai` و`account=default` وقيمة تبدأ بـ`sk-`، رغم أن الأولوية الأولى في `.env.example` لمفتاح Gemini.
3. `App.tsx` يستدعي `/api/key-status` بـ`mode: 'no-cors'` ثم `r.json()`؛ استجابة no-cors معتمة، فالتحقق لن يعمل غالبًا (سطر الكود A، السلوك الفعلي C).
4. `start.sh` يثبّت المسار `/home/runner/workspace` (خاص ببيئة Replit).
5. مسار التشغيل ثلاثي: Replit (HTTP)، Electron (HTTPS على 127.0.0.1 بتثبيت شهادة)، Android عبر Capacitor؛ لا دليل على أن أيًّا منها شُغّل (C).

### المخاطر (A/C)
- حزمة ثقيلة التقنيات (Electron + pkg + keytar + Capacitor) خارج نطاق واجهة ويب موحّدة.
- لا اختبارات. تضارب موجّه المراحل مع بقية المشاريع (3 مراحل بدل 4–6).

**المحركات:** الوثائق والكود تذكر `provocation, analogies, random, opposite, constraint (reversal)`؛ معرّف `constraint` يوافق P2 وP3.

---

## P6 — `atelier-fx`

| البند | النتيجة |
|---|---|
| التقنية (A) | React 19 + Vite 8.3 + Tailwind 4 + `motion` + lucide + TypeScript ^7.0.2؛ قالب Google AI Studio (`metadata.json`: "Cinematic editorial AI film staging and latent parameter grading studio") |
| الحجم (A) | ~2,900 سطرًا؛ 4 صور JPG محلية ثقيلة (~3.4MB) |
| الواجهات (A) | `ViewMode`: `staging`, `sequencer`, `contact`, `grading` — مكونات: StagingDirector (25KB)، SceneSequencer (21KB)، ContactSheet، GradingSuite، RenderModal، DirectorModal |
| النطاق | أداة **إنتاج ما بعد السيناريو**: عدسات، مخزونات فيلم، seed وCFG وsteps، تدريج لوني (`ColorGradeSettings`)، Timeline بثلاثة مسارات. لا مراحل Brief/Strategy/Concept |
| البيانات (A) | `mockProduction.ts` فقط (بيانات ثابتة) |
| وظائف فعلية (A) | تنزيل Blob من GradingSuite وRenderModal؛ نسخ للحافظة من ContactSheet |
| محاكاة (A) | RenderModal يحاكي التقدم بـ`setInterval`؛ StagingDirector يستخدم `Math.random` |
| الاتصال بالخدمات (A) | لا `fetch`. `@google/genai` و`express` و`dotenv` مُعلنة في `package.json` لكن لا استخدام لـ`GoogleGenAI` في `src` ولا ملف خادم (`server.ts/js` غير موجود) |
| العربية/RTL (A) | `lang="en"`، لا ذكر لـ`rtl` في `src`، إنجليزي فقط |
| الاختبارات (A) | لا توجد |
| المخاطر | اعتماد على إصدارات حديثة جدًا غير متحقق منها (C)؛ ادّعاء `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` بلا كود يستخدمه (A) |

---

## P7 — `atelier-fx-—-cinematic-simulation`

| البند | النتيجة |
|---|---|
| التقنية (A) | نفس قالب P6 (نفس `package.json` تقريبًا) لكن تطبيق مختلف المحتوى |
| الحجم (A) | ~2,767 سطرًا |
| المراحل (A) | `StageId` 1–5: Brief، Vision، Concept، Script، **Simulation** (`Stage5Simulation` 45KB، الافتراضي مرحلة 5) + نوافذ: CallSheet، AlternateCoverage، CommandPalette |
| المحتوى | حملة محددة ("Chrono Al-Ula"): عدسات وإضاءة وصوتيات ومشاهد بإحداثيات GPS (`types.ts`) |
| ثنائية اللغة (A) | حقول `Ar/En` في أنواع البيانات؛ `isRtl` افتراضيًا `true` مع ضبط `document.documentElement.dir` |
| وظائف فعلية (A) | `audioEngine.ts` محرك صوت Web Audio (`AudioContext`)؛ CallSheet: نسخ للحافظة + `window.print` |
| محاكاة (A) | مؤقتات في Stage5 وAlternateCoverage؛ بيانات ثابتة في `data.ts` |
| الصور (A) | روابط خارجية (`images.unsplash.com`، `lh3.googleusercontent.com`) — تعتمد على الشبكة وقد تتعطل |
| الاتصال بالخدمات (A) | لا `fetch`، ولا استخدام لـ`@google/genai` |
| الاختبارات (A) | لا توجد |

---

## P4 — `stitch_fx_creative_intelligence_workspace` (Atelier Cinématique)

| البند | النتيجة |
|---|---|
| المحتوى (A) | 4 شاشات HTML + لقطات PNG + `DESIGN.md` ("FX — Atelier Cinématique") |
| نظام التصميم (A) | خلفية `#121315`، أساسي ذهبي `#f2ca50`/`#d4af37`، ثانوي `#e9bf90`، عناوين Playfair Display، سمة داكنة |
| الشاشات (A) | `lab_1` موجز المشروع (3 حقول) · `lab_2` الرؤية الاستراتيجية والتوتر الثقافي · `lab_3` السيناريو التفاعلي ولوحة المشاهد (= HTML السابق) · `lab_4` تطوير الفكرة الكبرى ومحركات التفكير الأربعة (الاستفزاز الحسي، الاستعارات المادية، المحفز العشوائي، التفكير العكسي) |
| التنقل (A) | شريط جانبي: الرؤية الاستراتيجية، الفكرة الإبداعية، السيناريو السينمائي، محركات التفكير، لوحات الإخراج، مع "مشروع نشط" |
| RTL (A) | `dir="rtl" lang="ar"` في كل الشاشات، عربي فقط |
| الاتصال بالخدمات (A) | صفر `fetch/XHR/WebSocket` في الشاشات الأربع |
| المقاييس (A) | أزرار 3–10 لكل شاشة؛ سلوك JS محدود (محاكاة نصية) |
| الحدود | شاشات ثابتة بلا كود تطبيق ولا حالة؛ مرجع تصميمي وفكري فقط |

### `Stitch - Projects.mht` (A)
لقطة Blink لصفحة `stitch.withgoogle.com/projects/…` بتاريخ 8 أكتوبر 2026؛ 30 جزءًا (22 CSS، 4 PNG، 1 JPEG، جزءان HTML). النص المستخرج لا يتجاوز عنوان الصفحة (تطبيق SPA لم يُنقش محتواه). **غير صالح كمصدر محتوى**، ومفيد فقط كدليل مصدر المشروع. الصور المضمنة لم أفحصها (C).

---

## P8 — `stitch_fx_ai_creative_studio` (The Director's Suite)

| البند | النتيجة |
|---|---|
| المحتوى (A) | 6 شاشات HTML + لقطات PNG + `DESIGN.md` + وثائق: تقرير تدقيق استراتيجي، وثيقة اتجاهات بصرية، `readme_updated2.md` |
| نظام التصميم (A) | "The Director's Suite": خلفية `#101319`، ذهبي `#f2ca50`، ثانوي أزرق `#7bd0ff`، خط IBM Plex Sans (عناوين)، سمة داكنة |
| الشاشات (A) | `fx_ai_creative_lab` (صفحة طويلة تجمع المراحل الأربع + Timeline + جدول تفريغ سيناريو) · `fx_radical_thinking_state` (نسخة متغيّرة من نفس الصفحة بمحرك "راديكالي") · `fx_strategic_audit_governance_loop` (5 أركان تحكيم، دورات تعديل، مصفوفة مطابقة المشاهد) · `fx_neural_render_queue_multi_model_node_farm` (طابور معالجة بعدة نماذج) · `fx_vfx_prompt_lab_on_set_storyboard_dispatch` (Prompt Lab وتفريغ ستوريبورد ميداني) · `fx_export_production_dispatch` (إعدادات التصدير ومزامنة الطاقم) |
| التنقل (A) | شريط جانبي أيمن مشترك: الموجز، الرؤية الاستراتيجية، مختبر الأفكار، السيناريو، طابور المعالجة العصبية |
| الاتجاهات (A) | الوثيقة تصف "The Director's Suite" (شريط مسار خطي بأربع محطات) و"The Obsidian Canvas" (مساحة عقد غير خطية) |
| التدقيق (A) | التقرير يقارن أوزان أركان التحكيم الخمسة (متوازن 20% لكل ركن مقابل راديكالي: 15/40/10/25/10) بنتيجة مرجحة 94.60% مقابل 95.25% — أرقام توضيحية داخل الوثيقة وليست ناتج نظام مُشغَّل (C) |
| RTL (A) | `dir="rtl" lang="ar"` في كل الشاشات |
| الاتصال بالخدمات (A) | صفر `fetch/XHR/WebSocket` |
| فحص بصري (جزئي) | عاينت لقطة الشاشة الرئيسية: صفحة طويلة كثيفة، شريط جانبي RTL، ذهبي على داكن. باقي اللقطات لم تُعاين (C) |
| الصلة بـTextFX (A) | `readme_updated2.md` هو README لمنصة TextFX (فحص ملفات `/FX/...`)، مما يربط هذا التصميم بسلالة TextFX/FX؛ الحكم على أنه الواجهة المقصودة للـBackend غير مُثبت (C) |

---

## 1. السجل الموحد للمشاريع الثمانية

| # | المشروع | النوع | اللغة | إطار العمل | الأسطر ≈ | Backend | RTL | تخزين | اختبارات |
|---|---|---|---|---|---|---|---|---|---|
| P1 | Figma | تطبيق | EN/AR | Vite + React | 2,867 | لا | ديناميكي | لا | 0 |
| P2 | v0 | تطبيق | AR/EN | Next.js | 4,416 | عقد HTTP مفترض | ديناميكي (AR افتراضي) | لا (Mock) | 0 |
| P3 | Lovable | تطبيق | EN/AR | TanStack Start | 1,777 | لا | ديناميكي | localStorage | 1 (لم يُشغَّل) |
| P4 | Stitch Workspace | شاشات ثابتة | AR | HTML | — | لا | ثابت | — | — |
| P5 | TextFX-V5 | واجهة + Backend | EN/AR | Vite + Express (+ Electron) | ~1,400 + ~4,000 | **نعم** (مسارات فعلية) | ديناميكي | localStorage | 0 |
| P6 | atelier-fx | تطبيق | EN | Vite + React | 2,900 | لا | لا | لا | 0 |
| P7 | atelier cinematic | تطبيق | AR/EN | Vite + React | 2,767 | لا | ديناميكي (AR افتراضي) | لا | 0 |
| P8 | Stitch Director's Suite | شاشات ثابتة + وثائق | AR | HTML | — | لا | ثابت | — | — |

**الاتصال الفعلي بخدمة:** P5 فقط (واجهة تستدعي Backend موجود). P2 مصمم للاتصال بعقد مفترض. الستة الباقية بلا اتصال.

### نظام المراحل في كل مشروع (A)

| # | المراحل |
|---|---|
| P1 | brief ← engines ← insight ← concept ← script ← output |
| P2 | brief ← strategy ← idea ← script |
| P3 | brief ← engine ← insight ← concept ← script ← output |
| P4 | موجز ← رؤية استراتيجية ← فكرة (محركات) ← سيناريو، مع لوحات إخراج |
| P5 | brief ← insight ← concept ← script (+ لوحة وكلاء/SaaS) |
| P6 | staging ← sequencer ← contact sheet ← grading (إنتاج) |
| P7 | Brief ← Vision ← Concept ← Script ← Simulation |
| P8 | Genesis Brief ← Strategic Mind ← Concept Lab ← Cinematic Slate + تدقيق/طابور/VFX/تصدير |

## 2. أوجه التشابه

1. **الخط الأساسي مشترك في الثمانية:** Brief ← رؤية/Insight ← فكرة/Concept ← سيناريو.
2. **محركات التفكير الجانبي الخمسة** تظهر في P1 وP2 وP3 وP4 وP5 وP8 (استفزاز، تشبيهات/استعارات، محفز عشوائي، تفكير عكسي، عكس القيود).
3. **الهوية البصرية الداكنة** (خلفية فحمية + لمسة ذهبية/كهرمانية) في P4 وP6 وP7 وP8، مع خطوط IBM Plex Sans Arabic في عدة مشاريع.
4. **ثنائية اللغة وRTL ديناميكي** في P1 وP2 وP3 وP5 وP7؛ ثابتة عربية في P4 وP8.
5. **كل مشاريع الواجهة تحاكي التوليد** بنصوص أو مؤقتات، عدا P5 الذي يستدعي Backend.
6. **غياب الاختبارات** في الجميع (اختبار توجيه وحيد في P3).

## 3. أوجه الاختلاف

| المحور | الاختلاف |
|---|---|
| النطاق | P1–P3 وP5: خط إبداعي حتى السيناريو. P6 وP7 وP8: امتداد إلى الإنتاج (عدسات، تدريج، محاكاة، طابور، تصدير). P8 يضيف حوكمة وتدقيقًا |
| الـBackend | P5 فقط له Backend وعقد API فعلي؛ P2 له عقد مفترض مختلف؛ الباقي بلا |
| مسارات API | P2 يفترض `/strategy` `/ideas` `/ideas/regenerate` `/ideas/refine` `/script` `/projects/{id}`؛ P5 يعرض `/api/insight` `/api/concept` `/api/script` `/api/full-pipeline`. **لا تطابق بين العقدين (A)** ولا يوجد في مسارات P5 ما يقابل regenerate أو refine أو حفظ المشروع |
| نموذج البيانات | P2: Brief/Strategy/Idea/Scene؛ P3 وP1: Insight/Concept؛ P5: `mainInsight` + `lateralThinkingBreakdown` وغيرها؛ لا مخطط مشترك |
| معرّف المحرك الخامس | `reversal` في P1 مقابل `constraint` في P2 وP3 وP5 |
| الحالة والتخزين | P3 وP5 فقط يخزنان محليًا؛ P2 يحفظ عبر خدمة (Mock لا يحفظ فعلًا) |
| نمط التنقل | حالة `view` بلا Router (P1)، صفحة واحدة بمراحل (P2)، Router (P3 لكن مسار واحد)، تمرير طويل (P5، P8) |
| المنصة | منتجات منصات مولِّدة (Figma Make، v0، Lovable، AI Studio، Stitch) مقابل مشروع Replit/Electron (P5) |
| الحجم والاعتماديات | P3 فيه 46 مكوّن shadcn؛ P1 وP7 وP6 خفيفة؛ P5 يضم Electron وCapacitor |

## 4. عناصر لافتة للتقييم لاحقًا (ليست قرارات)

- **P2:** فصل نقل البيانات خلف `FxService` مع Mock/HTTP، والإلغاء والتقدم وحالة الحفظ.
- **P3:** حفظ محلي للمشاريع، تصدير JSON/Markdown، لوحة أوامر، عدّاد استخدام (مُختلق حاليًا).
- **P1:** تتبّع أثر المحرك على الرؤية (`trace`) وتجربة الخطوات الستة بالعربية/الإنجليزية.
- **P5:** عقد API فعلي، مهلة وإعادة محاولة، لوحة وكلاء/SaaS، تتبّع التكرارات.
- **P6/P7:** أدوات الإنتاج (تدريج، ترتيب لقطات، محاكاة بصرية وصوتية، Call Sheet).
- **P4/P8:** هوية بصرية سينمائية، حلقة حوكمة بأركان وأوزان، طابور معالجة متعدد النماذج، تصدير وإرسال للطاقم.

> التقييم بالدرجات 0–5 على المحاور الاثني عشر وقرار الأساس يؤجلان إلى ما بعد فحص الـBackend الحقيقي، كما طلبت.

## 5. المخاطر الظاهرة حتى الآن

1. **لا Backend مثبت الهوية بعد:** P5 يحتوي Backend لكن لم يثبت أنه Backend FX-2026؛ وعقد P2 المفترض لا يطابقه.
2. **اعتماد على ملفات خارجية:** Google Fonts في أغلب المشاريع، وCDN لـTailwind في شاشات Stitch، وصور خارجية في P4 وP7 (تعمل فقط مع الشبكة).
3. **إصدارات حزم حديثة جدًا أو beta** (Next 16.4.0، TypeScript ^7.0.2، Vite 8.x، nitro beta، pnpm 12.3.4) غير متحقق من توفرها وتوافقها (C).
4. **خصوصية الأسرار في P5:** تخزين المفتاح عبر keytar في الـBackend المحلي؛ شكل المفتاح مقيّد بـ`sk-` فقط.
5. **حظر المحتوى بالكلمات الجزئية في P5** قد يعطل موجزات مشروعة (C).
6. **واجهات "شكلية":** أزرار وتقدم وعدّادات محاكاة تظهر كوظائف (قاعدة 3 من المهمة)، ويجب تتبعها وصفيًا قبل أي استخدام.

## 6. سجل غير المتحقق منه (تراكمي، الدفعتان)

| # | البند | الدليل المطلوب |
|---|---|---|
| 1 | هل تُبنى المشاريع الثمانية وتعمل؟ | بيئة بشبكة أو `node_modules` وتنفيذ install/build |
| 2 | وجود وتوافق الإصدارات الحديثة | install فعلي |
| 3 | هل `fx-build/backend` في P5 هو Backend FX-2026؟ | حزمة الـBackend الحقيقية وGit remote/commit |
| 4 | مطابقة مسارات P2 المفترضة لـBackend الحقيقي | الـBackend |
| 5 | مصادقة وصلاحيات مسارات P5 | قراءة كاملة لـ`index.ts` وملفات الوكلاء/SaaS |
| 6 | آلية النماذج المحلية (`local_models`) ومسارات اختيارية | قراءة README والكود المرتبط |
| 7 | عمل `key-status` و`set-key` في Electron/المتصفح | تشغيل فعلي |
| 8 | عرض الموبايل وRTL لكل الواجهات | تشغيل وفحص بصري |
| 9 | سلوك SSR/الوميض عند تبديل `dir` في P3 | تشغيل |
| 10 | أخطاء الأنواع المخفية بـ`ignoreBuildErrors` في P2 | `tsc --noEmit` |
| 11 | تصدير PDF في P5 (`jspdf` معلن) | تتبع الاستخدام وتشغيل |
| 12 | بقية لقطات PNG في P4 وP8 | معاينة بصرية |
| 13 | سلوك السكربتات الداخلية في شاشات Stitch (2–3 لكل شاشة) | قراءتها وتشغيلها |
| 14 | مفاتيح مدفونة بأشكال خارج الأنماط | تدقيق أعمق |
| 15 | هوية FX-2026 الفعلية (الاسم والمراحل والصفحات) | الـBackend ووثائق المنتج |

## 7. أسئلة معلّقة

1. هل تعيين P4 = Stitch Workspace وP8 = Director's Suite هو المقصود (الثمانية = 3 + 1 + 4)؟
2. أرسل الـBackend (الحزمة الثالثة) لإنشاء `FX_BACKEND_AUDIT.md` وبناء خريطة الربط. لم أنشئ هذا الملف الآن لأنه لا توجد أدلة عن الـBackend الحقيقي، وأي محتوى فيه سيكون تخمينًا.
