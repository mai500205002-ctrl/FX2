# REPORT — INCREMENT22
## Browser Agent Hardening & Claims Gate (منفَّذ فوق المستودع الحقيقي)

**التاريخ:** 2026-10-25 · **البيئة:** Node v22.23.4 · npm 10.9.9 · Linux sandbox
**خط الأساس المستخدم:** `TextFX-Increment20-CoreContracts.zip` (md5 `0def539d76d8acb099a194a52a537a8b`، 411,109 بايت، 143 ملفًا)
**الحالة النهائية:** `tsc` exit **0** · `node --test` **121/121 ناجحًا، fail 0، exit 0**

---

## 0. ملاحظتان حاكمتان قبل أي رقم

**الأولى — Increment21 غير موجود في المستودع المرفق.** عدد ملفات Increment21 = **0**. لذلك:
- «اختبارات Increment21 التسعون» = **NOT RUN**، ولا يوجد أي أساس لادعاء 90/90.
- المقارنة مع Increment21 (§8) تقتصر على **غيابه**، لا على فروق سلوكية.

**الثانية — هذا الأرشيف هو Increment20 وليس Increment21.** مجلد الجذر اسمه `TextFX-Creative-Core-Increment19`، و`package.json` بإصدار `5.0.0`، ويحتوي `REPORT-INCREMENT19-1.md` و`REPORT-INCREMENT20.md`. أي زيادة نُفِّذت هنا هي **Increment22 فوق خط أساس Increment20**، وليست فوق 21.

**لا `.git` في الأرشيف** ⇒ `git status` و`git diff` و`git diff --check` (المرحلة 6، البند 4) = **NOT RUN**، وكل ادعاء عنها في هذا التقرير غائب عن قصد. الجرد البديل: md5 لكل ملف (جدول §2).

---

## 1. خط الأساس — ما جرى فعليًا وبأي رموز خروج

| الخطوة | الأمر | النتيجة الفعلية |
|---|---|---|
| 1 | `npm install --ignore-scripts --no-audit --no-fund` | exit **0** — «added 313 packages in 3s» |
| 2 | `./node_modules/.bin/tsc -p tsconfig.json` | exit **127** — `No such file or directory` · **`typescript` لم يُثبَّت** |
| 3 | `npm install --no-save typescript@5.4.5 @types/node@18.19.0` | exit **0** — «added 2 packages in 2s» |
| 4 | `./node_modules/.bin/tsc -p tsconfig.json` | exit **0** — بلا أي مخرج (strict) |
| 5 | `node --test tests/*.test.cjs` (قبل البناء) | exit **1** — 34 اختبارًا، 28 ناجح، **6 فاشل** |
| 6 | `node --test tests/*.test.cjs` (بعد البناء) | exit **0** — **81/81 ناجحًا** |

**العائق البيئي الحقيقي (لم يكن في التقرير السابق):** `npm install` خرج بـ 0 لكنه **لم يثبّت `devDependencies`**، فسقط `tsc`. السبب العملي أن الجذر مُعرَّف كـ `workspaces` (`app`، `backend`، `electron-src`) بينما التثبيت جرى داخل `backend/`، و`npm config` نفسه يرفض العمل في هذا السياق:
`npm error code ENOWORKSPACES — This command does not support workspaces`.
الحل المطبَّق: تثبيت `typescript` صراحةً بـ`--no-save` (لم يُعدَّل `package.json` ولا الـlockfile).

**الخطوة 5 مهمة:** 6 ملفات اختبار تفشل قبل البناء لأنها تستورد `../dist/...`. هذا **ليس فشلًا في الكود**، بل دليل أن `npm test` في هذا المستودع يشترط `npm run build` قبله (وهو ما يفعله السكربت `"test": "npm run build && node --test tests/*.test.cjs"`). لا أُخفي الرقم: **34/28/6** قبل البناء، **81/81** بعده.

نقطة تحقق مستقلة: `81` تطابق ما يعلنه `REPORT-INCREMENT20.md` لخط أساس Increment20 — تحقّقتُ منه بالعدّ من السجل، لا بالاقتباس.

---

## 2. الملفات المعدّلة والجديدة (md5 فعلي)

| الملف | الحالة | الأسطر | md5 بعد التعديل | md5 الأصلي (Increment20) |
|---|---|---|---|---|
| `src/browser/address-policy.ts` | **جديد** | 117 | `38472ad020ea68abd61349131bb5f83c` | — |
| `src/browser/redact.ts` | **جديد** | 89 | `7ba186b5f9c3869cf76907d452c7c824` | — |
| `src/browser/claims-gate.ts` | **جديد** | 308 | `5b4c252fba4bd66a2edc99961e612a65` | — |
| `src/browser/browser-policy.ts` | **معدَّل** | 148 | `0a3ca88245b392b0e045911c681ad424` | `1f07dcb3b900c91b82924a94f0ec3411` |
| `src/browser/browser-service.ts` | **معدَّل** | 450 | `221a12b870a495481b8bec3e93711e0f` | `e4ec6f2e29b73fa50cfdbfd535cb7ede` |
| `src/browser/browser-route.ts` | **لم يُلمس** | 28 | `88b1989b05c4f1ba7d249fa9b63f6239` | `88b1989b05c4f1ba7d249fa9b63f6239` |
| `tests/increment22-browser-hardening.test.cjs` | **جديد** | 551 | `df84cc9830fc4acd8625929d21cc443d` | — |
| `tests/fixtures/{key,cert}.pem` | **جديد** | — | شهادة loopback ذاتية التوقيع، 3 أيام | — |
| `tests/browser-agent.test.cjs` | **لم يُلمس** | 162 | `d0b0b8e5062de4fe3ce3e3d6bc93ecfb` | مطابق |
| كل الاختبارات العشرة الأخرى | **لم تُلمس** | — | — | مطابق |

`browser-route.ts` وكل الاختبارات القديمة بصماتها مطابقة للأصل: **لا اختبار سابق عُدِّل أو أُضعف**.

---

## 3. التصميم الأمني وحدود الثقة

### 3.1 ما كان موجودًا فعليًا في Increment20 (من الفحص لا من الافتراض)

الوكيل `read-only` تمامًا: مدخل واحد `POST /api/browser/research` يقبل `{goal, urls}` فقط ويرفض أي مفتاح آخر (لا `click`، لا `form`). الحماية كانت قوية أصلًا:
`https` فقط · بلا credentials · بلا query · منفذ 443 · مضيف واحد بالضبط من `TEXTFX_BROWSER_ALLOWED_HOSTS` · رفض literals · `resolvePublicHost` يرفض أي إجابة DNS غير عامة · اتصال **مثبَّت** على IP مُتحقَّق منه (`lookup` مخصَّص) فلا استشارة DNS ثانية ⇒ DNS rebinding مسدود · `page.route` يخدم الصفحة من الـsocket المثبَّت مع CSP صارم · JS معطَّل · service workers محظورة · ميزانية بايت · مهلة لكل طلب ومهلة تشغيل · slot واحد متزامن · snapshot بـ`wx` + hash.

### 3.2 ما أضافه Increment22 (سبعة تغييرات، كل واحد مرتبط باختبار)

| # | التغيير | لماذا ثبتت ضرورته | الاختبار |
|---|---|---|---|
| 1 | `address-policy.ts`: تصنيف دقيق يفكّ تغليف IPv4 داخل IPv6 | `ipaddr.range()` يردّ كل الأشكال المغلَّفة كـ«محجوب» **بلا تسمية**؛ التصنيف الجديد يسمّي `nat64` / `six-to-four` / `teredo` / `metadata` | 26، 27 |
| 2 | رفض IPv4 غير القانوني (`2130706433`, `0x7f000001`, `0177.0.0.1`, `127.000.000.001`) | صيغ يتجاوز بها المهاجم مطابقة الأسماء | 28 |
| 3 | رموز رفض مُسمّاة: `CREDENTIALS_IN_URL`، `PORT_BLOCKED`، `NON_CANONICAL_IP` | كان كل شيء `URL_BLOCKED`، فلا يُعرف أي شرط انتُهك ⇒ فشل غير قابل للتدقيق | 25، 28 |
| 4 | رسالة رفض إعادة التوجيه تسمّي الحالة (`Redirect (302) refused`) مع إبقاء الرمز `HTTP_REJECTED` | الحفاظ على عقد Increment20 مع جعل الرفض مقروءًا | 32، 33، 58 |
| 5 | `redact.ts`: تنقية الأسرار في كل رسالة خطأ/Trace/Snapshot | `BrowserError` يمرّر النص إلى HTTP وسجل وsnapshot؛ رمز Bearer داخل رسالة خطأ = تسريب | 49، 50، 51 |
| 6 | `claims-gate.ts` + ربطه بدورة التشغيل | «نجاح النقل» كان يُترجم `status: completed` بلا أي سلسلة أدلة | 41–48، 62 |
| 7 | `verifyEvidenceIntegrity` + `tlsOptions` اختياري | تحقق مستقل من الأصل المخزَّن؛ و`tlsOptions` يسمح باختبار TLS حقيقي على loopback دون إضعاف التثبيت (يُبثّ **قبل** حقول التثبيت فلا يتجاوزها) | 52، 57–60 |

### 3.3 تصحيح ذاتي مهم — ادعاء في تعليقي كان خاطئًا

كتبتُ في تعليق `address-policy.ts` أن Increment20 «يقبل» `64:ff9b::a00:1` و`2002:a00:1::` كـunicast (أي ثغرة). **القياس كذّب ذلك:**

```
64:ff9b::a00:1           INC20_accepted=false   INC22_class=nat64
2002:7f00:1::            INC20_accepted=false   INC22_class=six-to-four
2001:0:53aa:64c:0:0:0:1  INC20_accepted=false   INC22_class=teredo
::ffff:169.254.169.254   INC20_accepted=false   INC22_class=metadata
::ffff:127.0.0.1         INC20_accepted=false   INC22_class=loopback
93.184.216.34            INC20_accepted=true    INC22_class=public
```

`ipaddr` كان يردّها جميعًا (لأنها غير `unicast`). لذلك **صحّحتُ التعليق لا القياس**: التصنيف الجديد يضيف **دقة وتسمية**، لا سدّ ثغرة مُثبتة. لا أدّعي حماية من خطر لم يُثبَت وجوده.

---

## 4. Claims Gate — آلية الأدلة

الحالات الست كما وردت في تعليماتك، بأسماء العقود الحقيقية للوحدة (لم أعدّل عقدًا قائمًا):

| الحالة | متى تُسجَّل | القيمة المعرفية |
|---|---|---|
| `requested` | `register()` عند بدء كل URL | طُلب فقط، صفر دليل |
| `attempted` | `markAttempted()` قبل `page.goto` | بدأت المحاولة |
| `succeeded` | `recordExecution({ok:true})` — **سقف** نجاح النقل | النقل نجح، لا أكثر |
| `verified` | `verify({verificationRule})` بعد دليل `independent-verification` | الأصل المخزَّن طابق بصمته ووقته |
| `failed` | `recordExecution({ok:false})` أو `fail()` | فشل مُسجَّل برمزه |
| `unknown` | `markUnknown()` أو تعارض أدلة | لا حسم |

**القاعدة الصلبة:** `verify()` يرفض ما لم يوجد دليل مستقل **لاحق** للتنفيذ، ويختلف مصدره عن مصدر التنفيذ. لذلك «نجاح استدعاء أداة» لا يمكن أن يصبح «النتيجة تحققت» — وهو بالضبط ما طلبته في المرحلة 4. كل سجل يحمل: `runId`، `source`، `observedAt`، `support`، `reason`، وسلسلة `history` بالانتقالات.

**ربط الحالة بالتقرير:** `status: completed` لا يُعلن إلا إذا كانت **كل** المطالبات `verified`. أي فشل ⇒ `partial` أو `failed`. اختبار 62 يثبت الفرع المتشائم: بلا Chromium، التشغيل يعود `failed` بـ`errors` غير فارغة، ولا `completed` وهمي.

**التوافق:** `claims` حقل **إضافي اختياري**، و`schemaVersion` بقي `1.0.0`. اختبار 54 يحمّل snapshot قديمًا بلا `claims`؛ اختبار 55 يحمّل snapshot بـ`claims` ويعيده مطابقًا.

**ما لا يعنيه `verified`:** أن نص الصفحة **صحيح**. المعنى الحرفي المسجَّل: أصل النص المخزَّن لم يُغيَّر بعد الاسترجاع، وبصمته ووقته صالحان. `trust: untrusted-web-content` و`reviewStatus: unreviewed` باقيان على كل دليل.

---

## 5. الاختبارات والأوامر ونتائج الخروج

```bash
./node_modules/.bin/tsc -p tsconfig.json   # exit 0 (بلا مخرج)
node --test tests/*.test.cjs               # exit 0
```

| القياس | القيمة من السجل الخام |
|---|---|
| إجمالي | `# tests 121` |
| ناجح | `# pass 121` |
| فاشل | `# fail 0` |
| ملغى / متجاوز / todo | `0 / 0 / 0` |
| الجديدة (Increment22) | **40** (`23`–`62`) |
| توزيع الجديدة | `[UNIT]` **23** · `[INJECTED]` **11** · `[REAL-TCP]` **5** · `[NO-CHROME]` **1** |
| الانحدار القديم | **81/81** (كلها ملفات Increment19/20، بلا تعديل) |

**تغطية البنود العشرة المطلوبة:**

| بند التعليمات | الاختبارات |
|---|---|
| 1. وجهات مسموحة/مرفوضة | 23، 24، 25 |
| 2. localhost / private / metadata | 26، 27، 33 |
| 3. إعادة توجيه إلى وجهة محظورة | 32، 33، 58 (302 حقيقي على loopback) |
| 4. DNS والاتصال والمهلات والإلغاء | 29، 30، 37، 38، 59، 60، 61 |
| 5. فشل دون نجاح كاذب | 44، 45، 46، 62 |
| 6. الفرق attempted/succeeded/verified | 41، 42، 43، 47 |
| 7. غياب الدليل أو تعارضه | 42، 43، 45، 46 |
| 8. حماية السجلات من الأسرار | 49، 50، 51 |
| 9. التوافق مع العقود السابقة | 54، 55، 56 + الانحدار 81/81 |
| 10. الحافة والتزامن وإعادة المحاولة | 39، 40، 56، 37، 38 |

**تصنيف صادق للاختبارات:** `[UNIT]` دوال خالصة · `[INJECTED]` مسار حقيقي بحاقن resolver/transport **بلا شبكة** · `[REAL-TCP]` socket حقيقي إلى خادم TLS على loopback · `[NO-CHROME]` فرع الفشل عند غياب المتصفح. **لا يوجد اختبار متصفح واحد**، ولا اختبار شبكة عامة واحد — ولا أدّعي غير ذلك.

---

## 6. ما فشل أثناء التنفيذ وكيف أُصلح (بدون تخفيف)

| # | الفشل | التشخيص | الإصلاح |
|---|---|---|---|
| F-1 | `tsc` غير موجود (exit 127) | `devDependencies` لم تُثبَّت بسبب سياق `workspaces` | تثبيت `typescript` صريحًا بـ`--no-save` |
| F-2 | 6 ملفات تفشل قبل البناء (34/28/6) | تستورد `../dist` قبل توليده | `tsc` أولًا ⇒ 81/81 |
| F-3 | **انحدار حقيقي**: `22 - transport does not follow redirects` سقط بعد التحصين | أدخلتُ رمزًا جديدًا `REDIRECT_BLOCKED` بدل `HTTP_REJECTED` فكسرتُ عقد Increment20 | **أصلحت المصدر لا الاختبار**: أعدتُ `HTTP_REJECTED` وأضفت التفصيل في الرسالة |
| F-4 | اختباري 38 (إلغاء أثناء الطيران) فشل | الـmock لم يكن يحترم `signal`، فالاختبار كان يثبت «لا شيء يُحسم» لا «الإلغاء يعمل» | الـmock صار يستمع لـ`abort` ويستدعي `destroy`، والاختبار ينتظر إنشاء الطلب فعليًا |
| F-5 | اختباري 50 سقط على `x-client-secret` | فجوة **حقيقية** في `isSensitiveKey`: مطابقة كاملة فقط، فالمفاتيح ذات البادئة/اللاحقة تمرّ | المطابقة صارت على الحروف المطبَّعة + كلمات الاعتماد ⇒ `x-client-secret` و`proxy_authorization` محجوبان |
| F-6 | سطر برمجي شارد في اختباري 44 وسطر بلا معنى في 55 | خطأ كتابة منّي | حُذفا |
| F-7 | تعليق في `address-policy.ts` يدّعي ثغرة في Increment20 | القياس أثبت أن `ipaddr` يردّها | **صحّحت التعليق**، لا الادعاء |

### إفصاح مقصود
في اختباري **31** خفّفتُ تأكيدًا كتبتُه بنفسي: من `assert.equal(stats().lookups, 2)` إلى `assert.ok(stats().lookups >= 1)`. السبب أن Node قد يستدعي `lookup` مرة أو مرتين حسب الفرع، والتأكيد الصارم كان يثبّت تفصيلًا داخليًا لا سلوكًا أمنيًا. **هذا إضعاف تأكيد، وأذكره صراحةً** ولا أدّعي أن كل تأكيداتي بقيت كما كُتبت أول مرة. جوهر الاختبار (طلب واحد، صفر استشارة DNS ثانية) محفوظ عبر `requests === 1` والتثبيت المُتحقَّق منه.

---

## 7. التغطية الأمنية والقيود المتبقية

**مُغطّى ومُختبر:** منع literals وcredentials والمنافذ غير 443 وquery · تثبيت DNS على IP واحد مع رفض أي إجابة مختلطة · رفض كل أشكال IPv4 غير القانونية · رفض إعادة التوجيه قبل عبور أي hop، بما فيها 302 حقيقي على socket حقيقي · مهلة لكل hop ومهلة تشغيل وإلغاء فعلي · ميزانية بايت مُعلنة وفعلية · منع الأسرار في الرسائل واللقطات · سلسلة أدلة تمنع «completed» بلا تحقق · snapshot غير قابل للاستبدال ويفشل عند أي تحريف.

**غير مُغطّى — معلن لا مخفي:**

| القيد | الأثر |
|---|---|
| **Chromium غير مثبَّت** (`Executable doesn't exist … chrome-headless-shell`) | لا اختبار واحد يثبت سلوك `page.route` أو `innerText` أو CSP وقت التشغيل. اختبار 62 يثبت **فرع الفشل** فقط |
| **لا شبكة عامة** | كل `[REAL-TCP]` على loopback. سلوك TLS مع شهادة عامة حقيقية، وCDN، وHSTS = **غير مختبر** |
| **لا `HTTP_PROXY`** | أي وكيل يُضاف لاحقًا يجب أن يمرّ بنفس فحص العناوين، وإلا يصبح مسارًا يتجاوز السياسة |
| **TLS** | افتراضات Node الافتراضية، بلا تثبيت شهادة (pinning) وبلا فحص إضافي لـ`servername` |
| **لا `.git`** | لا `git diff` ولا كشف انحدار بالبصمات عبر الزمن |
| **Increment21 غائب** | لا تحقق من 90/90 ولا من عقود 21 |
| **لا اختبار تزامن حقيقي** | `reserveBrowserSlot` مختبر وحدةً (39)؛ سلوك slotين تحت حمل متوازٍ حقيقي غير مختبر |

---

## 8. المقارنة مع Increment21

**لا يمكن إجراؤها.** Increment21 غير موجود كملف واحد في المستودع المرفق: بحثت عن `*inc21*` و`*INCREMENT21*` فلم أجد شيئًا. ما وجدته هو `REPORT-INCREMENT19-1.md` و`REPORT-INCREMENT20.md` فقط.

| البند | Increment21 المعلن | المتاح فعليًا |
|---|---|---|
| مجموعة الاختبارات | 90/90 | **0 ملف** ⇒ NOT RUN |
| ملفات المصدر | 5 عدسات، أرشفة مرشحين، اعتراضات | **0 ملف** |
| العقود | `CreativeIR` وما يتبعها | موجودة من Increment19/20، لا نسخة 21 |

لذلك المقارنة الحقيقية في هذا التقرير هي: **Increment22 مقابل Increment20** — وهي في §3.2 و§5.

---

## 9. معايير القبول — الحالة الفعلية

| المعيار | الحالة | الدليل |
|---|---|---|
| خط الأساس مسجَّل قبل أي تعديل | ✅ | §1 بستة أوامر ورموز خروجها |
| 90/90 لـIncrement21 | ❌ **NOT RUN** | لا ملفات Increment21 |
| الانحدار الكامل ناجح | ✅ | 121/121، ومنها 81/81 القديمة |
| لا فقدان ميزة أو إضعاف اختبار | ✅ | `browser-route.ts` و10 ملفات اختبار ببصمات مطابقة؛ الاختبار الوحيد المخفَّض هو اختباري الجديد 31 (§6) |
| كل تغيير أمني مرتبط باختبار | ✅ | جدول §3.2، سبعة تغييرات ← اختبارات مرقّمة |
| لا أسرار في السجلات | ✅ | 49، 50، 51 على `redactText`/`redactUrl`/`redactHeaders` |
| لا نجاح معلن دون دليل | ✅ | 41، 42، 44، 62 |
| `git diff` و`git diff --check` | ❌ **NOT RUN** | لا `.git` |
| التقرير يعكس نتائج الأوامر | ✅ | كل رقم من `/home/user/work/*.log` في هذه الجلسة |
| أرشيف مستقل بلا Increment21 ممسوح | ✅ | `PRISTINE-INC20-BROWSER/` بالأصل، والأرشيف الأصلي لم يُعدَّل |
| الإعلان النهائي | **Increment22 زيادة مدمجة في مسار المشروع الحقيقي للـBrowser Agent**، لكن **المشروع ككل غير مكتمل**: Increment21 غائب، وChromium غير مختبر، والدمج الشامل (المرحلة النهائية) لم يبدأ | §7 |

---

## 10. ما يلزم للانتقال إلى Increment23

1. أرشيف **Increment21** (أو تأكيد أن Increment22 تُبنى فوق Increment20 مباشرة).
2. `npm run browser:install` أو صورة فيها Chromium، لتحويل اختبار المتصفح من «فرع فشل» إلى اختبار سلوك حقيقي.
3. `.git` في الأرشيف، ليصبح `git diff` ممكنًا.
4. نطاق Increment23 نصًّا — الإشارة الوحيدة المتاحة «cache counters hard-coded 0 → re-check in 23» لا تكفي نطاقًا.

---

## 11. Revalidation in the recovered working copy — 2026-10-25

The report above records an earlier Increment22 run. Revalidation was performed against the current working copy after extracting and testing the exact Increment20 archive separately. The current backend includes Increment21 changes; report totals below therefore supersede the earlier **121** total for the current copy without changing the historical result above.

| Check | Result |
|---|---|
| `npm test` in `backend/` | Exit **0**, **131/131**, 0 failed, 0 skipped |
| `npm run build` plus `node --test tests/increment22-browser-hardening.test.cjs` | Exit **0**, **40/40**, 0 failed, 0 skipped |
| `[REAL-TCP]` browser transport/security checks | **5 passed** on loopback TLS/socket fixtures |
| Chromium binary | Installed via `npm run browser:install` |
| Chromium launch / real page extraction | **NOT RUN**: launch failed before page creation because system libraries are absent: `libatk-1.0.so.0`, `libatk-bridge-2.0.so.0`, `libXcomposite.so.1`, `libXdamage.so.1`, `libXfixes.so.3`, `libXrandr.so.2`, `libgbm.so.1`, `libxkbcommon.so.0`, `libasound.so.2`, `libatspi.so.0`. Installing OS packages requires elevated privileges unavailable to this process. No sandbox bypass was attempted. |
| Runtime dependency audit | `npm audit --omit=dev --audit-level=high`: exit **0**, 0 vulnerabilities |

Raw logs: `increment22-backend.log`, `increment22-browser-hardening.log`. The browser-unavailable test only proves fail-closed behavior; it is not evidence that the Chromium extraction path works. The Increment20 archive remains unchanged and is available at `TextFX-Increment20-CoreContracts.zip`; the working directory also contains a separately verified Increment21 checkpoint.

**Current status:** SSRF controls, evidence integrity, claim-state boundaries, loopback transport, and regression suite pass. Real Chromium extraction remains explicitly unverified due missing system libraries. This environment limitation does not justify claiming that the full Browser Agent acceptance criterion ran.
