# FX-2026 — جرد مشاريع الواجهة (الدفعة 1 من 2)

**المصدر:** `New_500.zip` (449,614 بايت، 194 مدخلًا)
**المرحلة:** الجرد فقط. لم يُعدَّل أو يُحذف أي ملف، ولا يوجد قرار اختيار.
**التصنيف:** **A** = حقيقة من الكود · **B** = اختبار نُفذ فعلًا · **C** = استنتاج/تقدير غير متحقق منه.

> **ملاحظة تحقق:** كل نتائج البناء والتشغيل في هذا التقرير من النوع **C**. لا توجد أي نتيجة من النوع **B**؛ بيئة الفحص بلا شبكة ولا `node_modules`، فلم يُنفَّذ `install` ولا `build` ولا `test`.

---

## 0. محتوى الأرشيف

| # | العنصر | النوع |
|---|---|---|
| P1 | `DesignFXAICreative-figma/` | Vite + React (من Figma Make) |
| P2 | `FX-Creative-vo/` | Next.js (من v0) |
| P3 | `fx-creative-lovable/` | TanStack Start (من Lovable) |
| P4 | `fx_ai_creative_lab.html` | شاشة Stitch واحدة (تأكد في الدفعة 2 أنها مطابقة بالـ hash لـ `fx_ai_creative_lab_3/code.html` داخل مشروع Stitch Workspace؛ انظر التقرير 02) |

- لا `node_modules` ولا `dist` ولا `.next` ولا `.git` في أي مشروع (A). لذلك لا Git remote ولا فرع ولا commit متاح.
- فحص أنماط الأسرار (`sk-`، `AIza`، مفاتيح خاصة، `api_key`) لم يجد شيئًا في المشاريع الثلاثة (A، فحص نصي بأنماط وليس تدقيقًا شاملًا: C).

---

## P1 — `DesignFXAICreative-figma`

| البند | النتيجة |
|---|---|
| التقنية (A) | React 19 + Vite 8 + Tailwind 4 + TypeScript 5.7؛ pnpm 10.34.3، Node 22 (`.mise.toml`). اعتماديات التشغيل: react و react-dom فقط |
| الحجم (A) | ~2,867 سطرًا؛ `content.ts` وحده 706 أسطر (نصوص EN/AR وبيانات ثابتة) |
| نقطة البدء والتنقل (A) | `main.tsx` ← `App.tsx`؛ التنقل بحالة `view` عبر `useState` بلا Router. صفحات: directions (461 سطرًا)، home، brief، engines، insight، concept، script، output |
| الحالة (A) | `useState` محلي؛ كائن `Work` منفصل لكل لغة؛ لا تخزين، يضيع عند إعادة التحميل |
| العربية/RTL (A) | ضبط `document.documentElement.dir`، متغيرات `rtl:`، خصائص منطقية (~11 مقابل ~3 فيزيائية)، عكس الأسهم، خطوط Amiri وIBM Plex Sans Arabic. الاستجابة: breakpoints موجودة، لم تُفحص بصريًا (C) |
| الاتصال بالخدمات (A) | لا يوجد `fetch`. التوليد محاكى بـ `setTimeout` (2300ms) ونصوص جاهزة من `content.ts` |
| وظائف ظاهرة غير مُنفذة (A) | أزرار PDF وCopy وShare في Output تستدعي `toast` فقط |
| الاختبارات (A) | لا توجد |
| المخاطر (A) | خطوط عبر `@import` من Google Fonts؛ `vite.config.ts` (~12.7KB) معظمه إضافات خاصة بـFigma Make؛ `index.html` فيه placeholders (`<!-- figma:lang -->`) تُستبدل داخل المنصة، وسلوكها خارجها غير متحقق (C) |

**المحركات الخمسة:** `provocation, analogies, random, opposite, reversal`.

---

## P2 — `FX-Creative-vo`

| البند | النتيجة |
|---|---|
| التقنية (A) | Next.js 16.4.0 (App Router) + React 19 + Tailwind 4 + shadcn (`base-nova`) + `@base-ui/react` + lucide؛ `packageManager: pnpm@12.3.4`. وجود هذه الإصدارات في السجل غير متحقق (C) |
| الحجم (A) | ~4,416 سطرًا (بدون `ui/`، وفيه ملف واحد `button.tsx`) |
| البنية (A) | `app/page.tsx` ← `WorkspaceProvider` + `AppShell`؛ مراحل `brief → strategy → idea → script`؛ `command-bar`، `command-palette`، `ai-panel`، `generation-progress`، `stage-nav`؛ `useReducer` + حفظ تلقائي بتأخير 900ms |
| طبقة الخدمة (A) | `contract.ts` يعرّف `FxService` (6 عمليات) + `AbortSignal` + `onProgress` + `FxServiceError`؛ `index.ts` يختار HTTP عند ضبط `NEXT_PUBLIC_FX_API_URL` وإلا Mock |
| مسارات HTTP المفترضة (A كنص كود، C كوجود فعلي) | `POST /strategy` · `/ideas` · `/ideas/regenerate` · `/ideas/refine` · `/script` · `/projects/{id}`؛ `credentials: 'include'`؛ استجابة متوقعة `{ data, usage: { tokens } }` — **مسارات اختارها المشروع وليست مثبتة على Backend حقيقي** |
| الإلغاء والتقدم (A) | `AbortController` موجود؛ التقدم في وضع HTTP **مؤقّت** كل 1400ms لأن الـBackend لا يبث الخطوات (تعليق الكود) |
| الحفظ (A) | في Mock: `saveProject` ينتظر 450ms ويُرجع تاريخًا؛ لا `localStorage`؛ العمل يضيع عند التحميل بينما الواجهة تعرض "تم الحفظ" |
| العربية/RTL (A) | `<html lang="ar" dir="rtl">` افتراضيًا + ضبط `dir` ديناميكيًا + أرقام وأكواد `dir="ltr"` + تبديل الأسهم + IBM Plex Sans Arabic + dark/light. الخصائص المنطقية ~4 مقابل ~8 مطابقات فيزيائية (تقريبي) |
| الاختبارات (A) | لا توجد |
| المخاطر (A) | `typescript.ignoreBuildErrors: true`؛ `@vercel/analytics` (production فقط)؛ وسم `generator: v0.app` |

**المحركات:** `provocation, analogies, random, opposite, constraint`.

---

## P3 — `fx-creative-lovable`

| البند | النتيجة |
|---|---|
| التقنية (A) | TanStack Start 1.168 + TanStack Router + React Query + React 19 + Vite 8.1.5 + Tailwind 4 + shadcn/Radix؛ `bun.lock`؛ nitro (beta) |
| الحجم (A) | ~1,777 سطرًا خارج `ui/`، مع 46 ملف shadcn (كثير منها غالبًا غير مستخدم: C) |
| البنية (A) | مسار واحد `/`؛ صفحات داخلية بحالة (`home, brief, engine, insight, concept, script, output`)؛ `Screens.tsx` (31KB) و`Shell.tsx`؛ Context في `store.tsx` |
| التخزين (A) | `localStorage` بمفتاح `fx-creative-lab-v1` — الوحيد بين الثلاثة الذي يستبقي العمل بعد التحميل |
| التوليد (A) | `generators.ts` مولّد محلي (`Math.random` + `seed`) و`setTimeout`؛ لا `fetch` ولا `createServerFn` ولا استخدام فعلي لـ`useQuery` |
| عدّاد التوكنز (A) | قيمة ابتدائية 18,420 وحد 200,000 تزداد محليًا بتكلفة ثابتة — **عدّاد مُختلق** |
| التصدير (A) | JSON وMarkdown يعملان فعليًا (تنزيل Blob)؛ `print-area` للطباعة (لم تُجرَّب: C) |
| العربية/RTL (A) | ضبط `dir/lang` ديناميكيًا بعد التحميل، خصائص منطقية (~10 مقابل 0)، IBM Plex Sans Arabic. `<html lang="en">` ثابت في الـshell؛ سلوك SSR/الوميض غير متحقق (C) |
| الاختبارات (A) | اختبار توجيه واحد + إعداد vitest/jsdom + eslint + prettier، **لم يُنفَّذ** |
| المخاطر (A) | README: "Implement exactly the screenshot and nothing else" (توجيه Lovable لا متطلب FX)؛ أدوات Lovable (`lovable-error-reporting`، `@lovable.dev/vite-tanstack-config`)؛ إصدارات beta (`nitro 3.0.260603-beta`)؛ مدير حزم مختلف (bun) |

**المحركات:** `provocation, analogies, random, opposite, constraint`.

---

## P4 — `fx_ai_creative_lab.html` (شاشة Stitch)

| البند | النتيجة |
|---|---|
| النوع (A) | ملف واحد 53KB، 577 سطرًا، `dir="rtl" lang="ar"`، عربي فقط؛ Tailwind عبر CDN (`cdn.tailwindcss.com`)، خطوط Google وMaterial Symbols |
| المحتوى (A) | هيكل لوحة تحكم (aside + header + main) بأربعة أقسام سيناريو؛ 6 صور، منها خارجية من `lh3.googleusercontent.com/aida-public` |
| الوظائف (A) | ثلاثة أزرار لها سلوك، كلها **محاكاة بنصوص ومؤقتات**: تبديل Grid/Timeline (يعمل فعلًا)، "محرك النقيض" (تغيير نص الزر فقط)، "تصدير PDF" (يعرض "تم التصدير 32MB" دون تصدير) |
| الاستخدام المرجعي (A) | لا حقول إدخال ولا حالة ولا تنقل؛ مرجع بصري/فكري فقط. **يُجرد كاملًا مع بقية شاشات مشروعه في التقرير 02** |

---

## ملخص الدفعة 1

| البند | P1 Figma | P2 v0 | P3 Lovable | P4 Stitch (شاشة) |
|---|---|---|---|---|
| إطار العمل | Vite + React | Next.js | TanStack Start | HTML + CDN |
| الأسطر (تقريبًا) | 2,867 | 4,416 | 1,777 | 577 |
| لغات الواجهة | EN + AR | AR + EN | EN + AR | AR فقط |
| RTL ديناميكي | نعم | نعم (الافتراضي) | نعم | ثابت |
| اتصال Backend | لا | عقد + HTTP adapter (مفترض) | لا | لا |
| بقاء العمل بعد التحميل | لا | لا (Mock) | نعم (localStorage) | لا |
| تصدير فعلي | لا (toast) | غير متحقق (C) | JSON وMarkdown | لا (محاكاة) |
| اختبارات | 0 | 0 | 1 (لم يُشغَّل) | 0 |

## ملاحظات مشتركة (A)

1. لا واحد من الأربعة متصل بـBackend حقيقي. P2 الوحيد المصمم لذلك (عقد خدمة + عنوان بيئي).
2. التوليد كله مُحاكى (نصوص مكتوبة سلفًا أو دوال محلية).
3. معرّف المحرك الخامس يختلف: `reversal` في P1 مقابل `constraint` في P2 وP3.
4. نموذج البيانات يختلف بين المشاريع (Brief/Strategy/Idea في P2؛ Insight/Concept في P1 وP3).
5. لا اعتماد على OpenAI أو مزود سحابي في أي منها (متوافق مع القاعدة 9)، ولا ربط بنماذج محلية أيضًا.
6. لا اختبارات فعلية قابلة للاعتماد في أي منها.
