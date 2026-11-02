import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Check, ChevronDown, Copy, FileJson, FileText, Pencil, Plus, Printer, RefreshCw, Sparkles, Trash2, Wand2, Maximize2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/fx-hero.jpg";
import { useFx } from "@/lib/fx/store";
import { ENGINES, STAGES } from "@/lib/fx/i18n";
import { expandScene, rewriteScene, uid } from "@/lib/fx/generators";
import type { Brief, EngineId, StageId } from "@/lib/fx/types";
import { Btn, Section } from "./Shell";
import { exportJson, exportMarkdown } from "./export";

const Arrow = ({ back }: { back?: boolean }) => {
  const { lang } = useFx();
  const fwd = lang === "ar" ? back !== true : back === true;
  return fwd ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />;
};

function NavFooter({ prev, next, nextLabel, onNext, disabled }: { prev?: StageId; next?: StageId; nextLabel?: string; onNext?: () => void; disabled?: boolean }) {
  const fx = useFx();
  return (
    <div className="no-print mt-10 flex justify-between border-t border-border pt-6">
      {prev ? <Btn onClick={() => fx.go(prev)}><Arrow back />{fx.t("back")}</Btn> : <span />}
      {(next || onNext) && <Btn variant="primary" disabled={disabled} onClick={() => { onNext?.(); if (next) fx.go(next); }}>{nextLabel ?? fx.t("next")}<Arrow /></Btn>}
    </div>
  );
}

/* ---------------- HOME ---------------- */
export function Home() {
  const fx = useFx();
  const fmt = new Intl.DateTimeFormat(fx.lang === "ar" ? "ar" : "en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-40 md:px-6">
      <div className="relative grid gap-10 pt-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div className="animate-fx-rise">
          <div className="eyebrow mb-6">FX / {fx.t("lab")} — v1.0</div>
          <h1 className="font-display text-6xl leading-[0.95] md:text-8xl">
            {fx.t("heroA")}<br /><em className="text-gradient">{fx.t("heroB")}</em>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">{fx.t("heroSub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn variant="primary" className="px-5 py-3" onClick={() => fx.create(true)}><Plus className="size-4" />{fx.t("newBrief")}</Btn>
            {fx.project && <Btn variant="outline" className="px-5 py-3" onClick={() => fx.go("brief")}>{fx.t("continue")}<Arrow /></Btn>}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-border lg:-me-6 lg:translate-y-10">
          <img src={hero} alt="" width={1600} height={900} className="aspect-[16/10] w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-4 start-4 end-4 flex items-end justify-between font-mono text-[10px] text-muted-foreground">
            <span>SC.01 — EXT. ROOFTOP — DAWN</span><span>00:00:05</span>
          </div>
        </div>
      </div>

      <div className="mt-28">
        <div className="eyebrow mb-6">{fx.t("workflow")}</div>
        <div className="grid border-y border-border md:grid-cols-4">
          {(["brief", "insight", "concept", "script"] as StageId[]).map((s, i) => (
            <button key={s} onClick={() => fx.go(s)} className="group border-border p-6 text-start transition-colors hover:bg-surface md:border-e md:last:border-e-0">
              <div className="font-mono text-xs text-primary">0{i + 1}</div>
              <div className="mt-8 font-display text-3xl">{fx.t(s)}</div>
              <div className="mt-1 text-sm text-muted-foreground">{fx.lang === "en" ? ["الموجز", "الرؤية الاستراتيجية", "الفكرة الإبداعية", "السيناريو السينمائي"][i] : ["Brief", "Strategic Insight", "Creative Concept", "Cinematic Script"][i]}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-20">
        <div className="mb-6 flex items-end justify-between"><div className="eyebrow">{fx.t("recent")}</div></div>
        {fx.projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <Lightbulb className="mx-auto size-6 text-muted-foreground" />
            <div className="mt-4 font-display text-2xl">{fx.t("emptyTitle")}</div>
            <p className="mt-1 text-sm text-muted-foreground">{fx.t("emptySub")}</p>
            <Btn variant="primary" className="mt-6" onClick={() => fx.create(true)}><Plus className="size-4" />{fx.t("newBrief")}</Btn>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-2xl border border-border">
            {fx.projects.map((p) => {
              const progress = [true, p.insights.length > 0, !!p.selectedConcept, p.scenes.length > 0].filter(Boolean).length;
              return (
                <div key={p.id} className="group flex items-center gap-4 p-4 transition-colors hover:bg-surface">
                  <div className="font-display text-2xl italic text-muted-foreground">{p.brief.brand?.[0] || "·"}</div>
                  <button className="min-w-0 flex-1 text-start" onClick={() => fx.openProject(p.id)}>
                    <div className="truncate font-medium">{p.brief.projectName || fx.t("untitled")}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.brief.audience}</div>
                  </button>
                  <div className="hidden gap-1 sm:flex">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1 w-6 rounded-full ${i < progress ? "bg-primary" : "bg-border"}`} />)}</div>
                  <div className="hidden font-mono text-xs text-muted-foreground md:block">{fmt.format(p.updatedAt)}</div>
                  <Btn onClick={() => fx.openProject(p.id)}>{fx.t("open")}</Btn>
                  <Btn aria-label={fx.t("delete")} onClick={() => fx.removeProject(p.id)}><Trash2 className="size-4" /></Btn>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- BRIEF ---------------- */
const FIELDS: { k: keyof Brief; long?: boolean }[] = [
  { k: "projectName" }, { k: "brand" }, { k: "audience" }, { k: "challenge", long: true }, { k: "objective", long: true },
  { k: "tension", long: true }, { k: "keyMessage" }, { k: "tone" }, { k: "constraints", long: true },
];
export function BriefScreen() {
  const fx = useFx(); const b = fx.project!.brief;
  const filled = FIELDS.filter((f) => String(b[f.k]).trim()).length;
  return (
    <Section eyebrow={`01 — ${fx.t("brief")}`} title={fx.t("brief")} actions={<Btn variant="outline" onClick={fx.loadExample}><Sparkles className="size-4" />{fx.t("loadExample")}</Btn>}>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5 md:grid-cols-2">
          {FIELDS.map(({ k, long }) => (
            <label key={k} className={long ? "md:col-span-2" : ""}>
              <span className="eyebrow mb-2 block">{fx.t(k as never)}</span>
              {long
                ? <textarea rows={2} className="field resize-none" value={b[k] as string} onChange={(e) => fx.updateBrief({ [k]: e.target.value })} />
                : <input className="field" value={b[k] as string} onChange={(e) => fx.updateBrief({ [k]: e.target.value })} />}
            </label>
          ))}
          <div className="md:col-span-2">
            <span className="eyebrow mb-2 block">{fx.t("language")}</span>
            <div className="inline-flex rounded-lg border border-border p-1">
              {(["en", "ar"] as const).map((l) => (
                <button key={l} onClick={() => fx.updateBrief({ language: l })} className={`rounded-md px-4 py-1.5 text-sm ${b.language === l ? "bg-elevated text-foreground" : "text-muted-foreground"}`}>{l === "en" ? "English" : "العربية"}</button>
              ))}
            </div>
          </div>
        </div>
        <aside className="glass h-fit rounded-2xl p-5 lg:sticky lg:top-20">
          <div className="flex items-center gap-2 text-sm"><Wand2 className="size-4 text-cyan" />{fx.t("suggestions")}</div>
          <div className="mt-4 flex items-baseline gap-2"><span className="font-display text-5xl">{Math.round((filled / FIELDS.length) * 100)}</span><span className="text-muted-foreground">%</span></div>
          <div className="mt-2 h-1 rounded-full bg-border"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(filled / FIELDS.length) * 100}%` }} /></div>
          <ul className="mt-6 space-y-4">
            {fx.tips.map((tip, i) => <li key={i} className="flex gap-3 text-sm text-muted-foreground"><span className="font-mono text-xs text-primary">{i + 1}</span>{tip}</li>)}
          </ul>
          {!b.tension && <div className="mt-6 rounded-lg border border-cyan/30 bg-cyan/5 p-3 text-xs text-cyan">{fx.lang === "ar" ? "التوتر فارغ — إنه قلب الموجز." : "Tension is empty — it's the heart of the brief."}</div>}
        </aside>
      </div>
      <NavFooter next="engine" />
    </Section>
  );
}

/* ---------------- ENGINE ---------------- */
export function EngineScreen() {
  const fx = useFx(); const p = fx.project!;
  return (
    <Section eyebrow={`02 — ${fx.t("engine")}`} title={fx.t("engine")} sub={fx.t("chooseEngine")}>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-5">
        {(Object.keys(ENGINES) as EngineId[]).map((id, i) => {
          const e = ENGINES[id]; const [name, desc] = e[fx.lang]; const on = p.engine === id;
          return (
            <button key={id} onClick={() => fx.setEngine(id)} className={`relative flex min-h-[280px] flex-col p-6 text-start transition-colors ${on ? "bg-elevated" : "bg-background hover:bg-surface"}`}>
              {on && <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary to-cyan" />}
              <span className="font-mono text-[10px] text-muted-foreground">E.0{i + 1}</span>
              <span className={`mt-6 font-display text-6xl ${on ? "text-cyan" : "text-muted-foreground"}`}>{e.glyph}</span>
              <span className="mt-auto text-lg font-semibold">{name}</span>
              <span className="mt-2 text-sm text-muted-foreground">{desc}</span>
              {on && <Check className="absolute end-4 top-4 size-4 text-cyan" />}
            </button>
          );
        })}
      </div>
      <NavFooter prev="brief" next="insight" nextLabel={fx.t("generateInsights")} onNext={() => fx.genInsights()} />
    </Section>
  );
}

/* ---------------- INSIGHT ---------------- */
export function InsightScreen() {
  const fx = useFx(); const p = fx.project!;
  const [editing, setEditing] = useState<string>();
  const busy = fx.ai !== "idle" && fx.ai !== "done";
  return (
    <Section eyebrow={`03 — ${fx.t("insight")}`} title={fx.t("insight")}
      actions={<>
        <select value={p.engine} onChange={(e) => fx.genInsights(e.target.value as EngineId)} className="field w-auto py-2">
          {(Object.keys(ENGINES) as EngineId[]).map((id) => <option key={id} value={id} className="bg-surface">{ENGINES[id][fx.lang][0]}</option>)}
        </select>
        <Btn variant="outline" disabled={busy} onClick={() => fx.genInsights()}><RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />{fx.t("regenerate")}</Btn>
      </>}>
      {p.insights.length === 0 && !busy && (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">{fx.t("chooseEngine")}</p>
          <Btn variant="primary" className="mt-6" onClick={() => fx.genInsights()}><Sparkles className="size-4" />{fx.t("generateInsights")}</Btn>
        </div>
      )}
      {busy && p.insights.length === 0 && <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-surface" />)}</div>}
      <div className={`grid gap-4 lg:grid-cols-3 ${busy ? "opacity-50" : ""}`}>
        {p.insights.map((ins, i) => {
          const sel = p.selectedInsight === ins.id; const ed = editing === ins.id;
          return (
            <article key={ins.id} className={`animate-fx-rise relative flex flex-col rounded-2xl border p-6 transition ${sel ? "border-primary bg-elevated glow" : "border-border bg-surface/60"} ${i === 1 ? "lg:translate-y-6" : ""}`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">INS.0{i + 1} · {ENGINES[ins.engine][fx.lang][0]}</span>
                <div className="flex gap-1">
                  <Btn className="p-1.5" aria-label={fx.t("edit")} onClick={() => setEditing(ed ? undefined : ins.id)}>{ed ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}</Btn>
                  <Btn className="p-1.5" aria-label={fx.t("regenerate")} onClick={() => fx.regenInsight(ins.id)}><RefreshCw className="size-3.5" /></Btn>
                </div>
              </div>
              {ed ? (
                <div className="mt-4 space-y-3">
                  {(["title", "tension", "contradiction", "opportunity"] as const).map((k) => (
                    <textarea key={k} rows={k === "title" ? 2 : 3} className="field resize-none text-sm" value={ins[k]} onChange={(e) => fx.updateInsight(ins.id, { [k]: e.target.value })} />
                  ))}
                </div>
              ) : (
                <>
                  <h3 className="mt-5 font-display text-3xl leading-tight">{ins.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed">{ins.tension}</p>
                  <div className="mt-5 border-s-2 border-violet/60 ps-3"><div className="eyebrow mb-1">{fx.t("contradiction")}</div><p className="text-sm text-muted-foreground">{ins.contradiction}</p></div>
                  <div className="mt-4 border-s-2 border-cyan/60 ps-3"><div className="eyebrow mb-1">{fx.t("opportunity")}</div><p className="text-sm text-muted-foreground">{ins.opportunity}</p></div>
                </>
              )}
              <Btn variant={sel ? "primary" : "outline"} className="mt-6" onClick={() => fx.selectInsight(ins.id)}>{sel ? <><Check className="size-4" />{fx.t("selected")}</> : fx.t("select")}</Btn>
            </article>
          );
        })}
      </div>
      <NavFooter prev="engine" next="concept" nextLabel={fx.t("developConcept")} disabled={!p.selectedInsight} onNext={() => fx.genConcepts()} />
    </Section>
  );
}

/* ---------------- CONCEPT ---------------- */
function Meter({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-mono">{v}</span></div>
      <div className="mt-1 h-1 rounded-full bg-border"><div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan" style={{ width: `${v}%` }} /></div>
    </div>
  );
}
export function ConceptScreen() {
  const fx = useFx(); const p = fx.project!;
  const [compare, setCompare] = useState(false);
  const [active, setActive] = useState(0);
  const busy = fx.ai !== "idle" && fx.ai !== "done";
  const ins = p.insights.find((i) => i.id === p.selectedInsight);
  if (!ins) return <Section eyebrow="04" title={fx.t("concept")} sub={fx.t("needInsight")}><Btn variant="primary" onClick={() => fx.go("insight")}>{fx.t("insight")}</Btn></Section>;
  const c = p.concepts[Math.min(active, p.concepts.length - 1)];
  const total = (x: typeof c) => Math.round((x.score.originality + x.score.relevance + x.score.impact) / 3);
  return (
    <Section eyebrow={`04 — ${fx.t("concept")}`} title={fx.t("concept")} sub={`“${ins.title}”`}
      actions={<>
        <Btn variant={compare ? "primary" : "outline"} onClick={() => setCompare(!compare)} disabled={!p.concepts.length}>{fx.t("compare")}</Btn>
        <Btn variant="outline" disabled={busy} onClick={fx.genConcepts}><RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />{fx.t("regenerate")}</Btn>
      </>}>
      {!p.concepts.length && (busy ? <div className="h-96 animate-pulse rounded-2xl bg-surface" /> :
        <div className="rounded-2xl border border-dashed border-border p-16 text-center"><Btn variant="primary" onClick={fx.genConcepts}><Sparkles className="size-4" />{fx.t("developConcept")}</Btn></div>)}
      {p.concepts.length > 0 && !compare && c && (
        <div className={busy ? "opacity-50" : ""}>
          <div className="mb-6 flex gap-2">
            {p.concepts.map((x, i) => (
              <button key={x.id} onClick={() => setActive(i)} className={`rounded-full border px-4 py-1.5 text-sm ${i === active ? "border-primary bg-primary/15" : "border-border text-muted-foreground"}`}>
                {x.theme}{p.selectedConcept === x.id && <Check className="ms-1.5 inline size-3 text-cyan" />}
              </button>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-surface/60 p-8">
              <div className="eyebrow">{fx.t("theme")}</div>
              <input className="mt-2 w-full bg-transparent font-display text-5xl outline-none md:text-6xl" value={c.theme} onChange={(e) => fx.updateConcept(c.id, { theme: e.target.value })} />
              <div className="eyebrow mt-8">{fx.t("coreIdea")}</div>
              <textarea rows={2} className="mt-2 w-full resize-none bg-transparent text-xl leading-snug outline-none" value={c.coreIdea} onChange={(e) => fx.updateConcept(c.id, { coreIdea: e.target.value })} />
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {(["mechanism", "emotion", "keyMessage"] as const).map((k) => (
                  <label key={k} className={k === "mechanism" ? "md:col-span-2" : ""}>
                    <span className="eyebrow">{fx.t(k)}</span>
                    <textarea rows={k === "mechanism" ? 3 : 1} className="mt-2 w-full resize-none bg-transparent text-sm leading-relaxed text-muted-foreground outline-none focus:text-foreground" value={c[k]} onChange={(e) => fx.updateConcept(c.id, { [k]: e.target.value })} />
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-baseline justify-between"><span className="eyebrow">Creative score</span><span className="font-display text-5xl text-gradient">{total(c)}</span></div>
                <div className="mt-5 space-y-3">
                  <Meter label={fx.t("originality")} v={c.score.originality} /><Meter label={fx.t("relevance")} v={c.score.relevance} /><Meter label={fx.t("impact")} v={c.score.impact} />
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="eyebrow mb-4">{fx.t("mood")}</div>
                <div className="flex h-24 overflow-hidden rounded-lg">{c.mood.map((m, i) => <div key={i} className="flex-1 transition-all hover:flex-[2]" style={{ background: m }} />)}</div>
                <div className="mt-4 flex flex-wrap gap-2">{c.moodWords.map((w) => <span key={w} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{w}</span>)}</div>
              </div>
              <Btn variant={p.selectedConcept === c.id ? "primary" : "outline"} className="w-full py-3" onClick={() => fx.selectConcept(c.id)}>
                {p.selectedConcept === c.id ? <><Check className="size-4" />{fx.t("selected")}</> : fx.t("select")}
              </Btn>
            </div>
          </div>
        </div>
      )}
      {compare && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <tbody>
              {(["theme", "coreIdea", "emotion", "mechanism"] as const).map((k) => (
                <tr key={k} className="border-b border-border">
                  <th className="eyebrow w-40 p-4 text-start align-top">{fx.t(k)}</th>
                  {p.concepts.map((x) => <td key={x.id} className={`p-4 align-top ${k === "theme" ? "font-display text-2xl" : "text-muted-foreground"}`}>{x[k]}</td>)}
                </tr>
              ))}
              <tr><th className="eyebrow p-4 text-start">Score</th>{p.concepts.map((x) => <td key={x.id} className="p-4"><div className="font-display text-3xl">{total(x)}</div><Btn variant={p.selectedConcept === x.id ? "primary" : "outline"} className="mt-2" onClick={() => fx.selectConcept(x.id)}>{p.selectedConcept === x.id ? fx.t("selected") : fx.t("select")}</Btn></td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
      <NavFooter prev="insight" next="script" nextLabel={fx.t("writeScript")} disabled={!p.selectedConcept} onNext={() => { if (!p.scenes.length) fx.genScript(); }} />
    </Section>
  );
}

/* ---------------- SCRIPT ---------------- */
export function ScriptScreen() {
  const fx = useFx(); const p = fx.project!; const lang = p.brief.language;
  const [open, setOpen] = useState<string | undefined>();
  const busy = fx.ai !== "idle" && fx.ai !== "done";
  if (!p.selectedConcept) return <Section eyebrow="05" title={fx.t("script")} sub={fx.t("needConcept")}><Btn variant="primary" onClick={() => fx.go("concept")}>{fx.t("concept")}</Btn></Section>;
  const total = p.scenes.reduce((a, s) => a + s.duration, 0);
  const move = (i: number, d: number) => fx.setScenes((sc) => { const n = [...sc]; const j = i + d; if (j < 0 || j >= n.length) return sc; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const upd = (id: string, v: object) => fx.setScenes((sc) => sc.map((s) => (s.id === id ? { ...s, ...v } : s)));
  const fields = ["visual", "camera", "dialogue", "music", "sound", "transition"] as const;
  return (
    <Section eyebrow={`05 — ${fx.t("script")}`} title={fx.t("script")}
      actions={<>
        <Btn variant="outline" onClick={() => fx.setScenes((sc) => [...sc, { id: uid(), duration: 4, visual: "", camera: "", dialogue: "", music: "", sound: "", transition: "" }])}><Plus className="size-4" />{fx.t("addScene")}</Btn>
        <Btn variant="outline" disabled={busy} onClick={fx.genScript}><RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />{fx.t("regenerate")}</Btn>
      </>}>
      {!p.scenes.length && (busy ? <div className="h-64 animate-pulse rounded-2xl bg-surface" /> : <div className="rounded-2xl border border-dashed border-border p-16 text-center"><Btn variant="primary" onClick={fx.genScript}><Sparkles className="size-4" />{fx.t("writeScript")}</Btn></div>)}
      {p.scenes.length > 0 && (
        <>
          <div className="mb-8">
            <div className="mb-2 flex justify-between font-mono text-[10px] text-muted-foreground"><span>00:00</span><span>{fx.t("total")} {total}s</span></div>
            <div className="flex h-10 gap-0.5 overflow-hidden rounded-lg">
              {p.scenes.map((s, i) => (
                <button key={s.id} onClick={() => setOpen(s.id)} style={{ flex: s.duration }} className={`flex items-center justify-center font-mono text-[10px] transition ${open === s.id ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:bg-accent"}`}>{String(i + 1).padStart(2, "0")}</button>
              ))}
            </div>
          </div>
          <ol className={`space-y-3 ${busy ? "opacity-60" : ""}`}>
            {p.scenes.map((s, i) => {
              const ex = open === s.id;
              return (
                <li key={s.id} className={`rounded-2xl border transition ${ex ? "border-primary/50 bg-elevated" : "border-border bg-surface/50"}`}>
                  <div className="flex items-center gap-4 p-4">
                    <span className="font-display text-4xl italic text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <button className="min-w-0 flex-1 text-start" onClick={() => setOpen(ex ? undefined : s.id)}>
                      <div className="truncate">{s.visual || "—"}</div>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">{s.camera} · {s.duration}s</div>
                    </button>
                    <div className="no-print flex items-center gap-0.5">
                      <Btn className="p-1.5" aria-label="up" onClick={() => move(i, -1)}><ArrowUp className="size-3.5" /></Btn>
                      <Btn className="p-1.5" aria-label="down" onClick={() => move(i, 1)}><ArrowDown className="size-3.5" /></Btn>
                      <Btn className="p-1.5" aria-label={fx.t("expand")} title={fx.t("expand")} onClick={() => fx.aiScene(() => upd(s.id, expandScene(s, lang)))}><Maximize2 className="size-3.5" /></Btn>
                      <Btn className="p-1.5" aria-label="duplicate" onClick={() => fx.setScenes((sc) => [...sc.slice(0, i + 1), { ...s, id: uid() }, ...sc.slice(i + 1)])}><Copy className="size-3.5" /></Btn>
                      <Btn className="p-1.5" aria-label={fx.t("delete")} onClick={() => fx.setScenes((sc) => sc.filter((x) => x.id !== s.id))}><Trash2 className="size-3.5" /></Btn>
                      <Btn className="p-1.5" onClick={() => setOpen(ex ? undefined : s.id)}><ChevronDown className={`size-4 transition ${ex ? "rotate-180" : ""}`} /></Btn>
                    </div>
                  </div>
                  {ex && (
                    <div className="animate-fx-rise border-t border-border p-5">
                      <div className="grid gap-4 md:grid-cols-[100px_1fr_1fr]">
                        <label><span className="eyebrow">{fx.t("duration")}</span><input type="number" min={1} className="field mt-2" value={s.duration} onChange={(e) => upd(s.id, { duration: Math.max(1, +e.target.value) })} /></label>
                        {fields.map((k) => (
                          <label key={k} className={k === "visual" ? "md:col-span-2" : ""}>
                            <span className="eyebrow">{fx.t(k)}</span>
                            <textarea rows={k === "visual" ? 3 : 2} className="field mt-2 resize-none" value={s[k]} onChange={(e) => upd(s.id, { [k]: e.target.value })} />
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="eyebrow me-2">{fx.t("rewrite")}</span>
                        {(["cinematic", "playful", "intimate"] as const).map((tone) => (
                          <Btn key={tone} variant="outline" className="py-1 text-xs" onClick={() => fx.aiScene(() => upd(s.id, rewriteScene(s, lang, tone)))}><Wand2 className="size-3" />{tone}</Btn>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
      <NavFooter prev="concept" next="output" nextLabel={fx.t("presentation")} disabled={!p.scenes.length} />
    </Section>
  );
}

/* ---------------- OUTPUT ---------------- */
export function OutputScreen() {
  const fx = useFx(); const p = fx.project!; const b = p.brief;
  const ins = p.insights.find((i) => i.id === p.selectedInsight);
  const c = p.concepts.find((x) => x.id === p.selectedConcept);
  const dir = b.language === "ar" ? "rtl" : "ltr";
  return (
    <Section eyebrow={`06 — ${fx.t("output")}`} title={fx.t("output")}
      actions={<>
        <Btn variant="outline" onClick={() => window.print()}><Printer className="size-4" />{fx.t("print")}</Btn>
        <Btn variant="outline" onClick={() => { exportMarkdown(p); toast.success(fx.t("exportMd")); }}><FileText className="size-4" />MD</Btn>
        <Btn variant="outline" onClick={() => { exportJson(p); toast.success(fx.t("exportJson")); }}><FileJson className="size-4" />JSON</Btn>
      </>}>
      <div dir={dir} className="print-area mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface/40">
        <div className="border-b border-border p-10 md:p-14">
          <div className="eyebrow">{b.brand} · {new Date(p.updatedAt).getFullYear()}</div>
          <h2 className="mt-4 font-display text-5xl leading-none md:text-7xl">{c?.theme ?? b.projectName}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{b.projectName}</p>
        </div>
        <Block n="01" t={fx.t("brief")}>
          <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {(["audience", "challenge", "objective", "tension", "keyMessage", "constraints"] as const).map((k) => (
              <div key={k}><dt className="eyebrow">{fx.t(k)}</dt><dd className="mt-1 text-sm">{b[k]}</dd></div>
            ))}
          </dl>
        </Block>
        {ins && <Block n="02" t={fx.t("insight")}><p className="font-display text-3xl">{ins.title}</p><p className="mt-3 text-muted-foreground">{ins.tension}</p><p className="mt-2 text-muted-foreground">{ins.opportunity}</p></Block>}
        {c && <Block n="03" t={fx.t("concept")}><p className="text-xl">{c.coreIdea}</p><p className="mt-3 text-sm text-muted-foreground">{c.mechanism}</p><div className="mt-4 flex h-3 overflow-hidden rounded">{c.mood.map((m, i) => <div key={i} className="flex-1" style={{ background: m }} />)}</div></Block>}
        {p.scenes.length > 0 && (
          <Block n="04" t={fx.t("script")}>
            <div className="space-y-5">
              {p.scenes.map((s, i) => (
                <div key={s.id} className="grid grid-cols-[48px_1fr] gap-4 border-b border-border pb-5 last:border-0">
                  <div className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}<br />{s.duration}s</div>
                  <div><p>{s.visual}</p><p className="mt-1 text-sm italic text-cyan">{s.dialogue}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{s.camera} · {s.music} · {s.sound} · {s.transition}</p></div>
                </div>
              ))}
            </div>
          </Block>
        )}
        {p.rationale && <Block n="05" t={fx.t("rationale")}><p className="leading-relaxed text-muted-foreground">{p.rationale}</p></Block>}
      </div>
      <NavFooter prev="script" />
    </Section>
  );
}
function Block({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-border p-10 last:border-0 md:grid-cols-[160px_1fr] md:p-14">
      <div><div className="font-mono text-xs text-primary">{n}</div><div className="eyebrow mt-1">{t}</div></div>
      <div>{children}</div>
    </section>
  );
}

export const _stages = STAGES;
