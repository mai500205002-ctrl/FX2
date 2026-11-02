import type { Ctx } from '../content'
import Still from '../components/Still'
import { ActionBar, Editable, Label, Stage } from '../components/ui'

export default function Concept({ c }: { c: Ctx }) {
  const { t, work, setWork, go } = c
  const r = work.routes[work.route]
  const tr = t.routes[work.route]
  const patch = (p: Partial<typeof r>) =>
    setWork((w) => ({ ...w, routes: w.routes.map((x, i) => (i === w.route ? { ...x, ...p } : x)) }))
  const regen = () => {
    const next = r.lineIdx === 0 ? 1 : 0
    patch({ lineIdx: next, line: tr.lines[next] })
  }
  return (
    <>
      <Stage
        num="04"
        title={t.stages.concept.title}
        desc={t.stages.concept.desc}
        trace={[`${t.ui.co_from}:`, `“${work.insights[work.insightPick] ?? ''}”`, `${t.ui.lens}: ${t.engines[work.engine].name}`]}
        traceTitle={t.ui.trace_title}
      >
        <div role="tablist" className="grid grid-cols-1 border-t border-rule-strong md:grid-cols-3">
          {work.routes.map((x, i) => {
            const on = work.route === i
            return (
              <button
                key={i}
                role="tab"
                aria-selected={on}
                onClick={() => setWork((w) => ({ ...w, route: i }))}
                className={`relative cursor-pointer border-rule px-0 py-5 text-start transition-opacity md:border-s md:px-6 md:first:border-s-0 md:first:ps-0 ${on ? '' : 'opacity-50 hover:opacity-90'}`}
              >
                {on && <span className="absolute inset-x-0 top-0 h-0.5 bg-signal" />}
                <Label>{t.routes[i].name}</Label>
                <div className="mt-2 font-display text-[1.5rem] leading-tight">{x.title}</div>
              </button>
            )
          })}
        </div>

        <div key={work.route} className="rise mt-10 grid grid-cols-12 gap-x-10 gap-y-10">
          <div className="col-span-12 xl:col-span-7">
            <Still title={r.title} sub={r.line} tone={work.route === 2 ? 'night' : 'dusk'} />
            <p className="label mt-3">
              {t.ui.co_route} · {tr.name}
            </p>
          </div>
          <div className="col-span-12 flex flex-col gap-8 xl:col-span-5">
            <div>
              <Label>{t.ui.co_title}</Label>
              <h2 className="mt-2">
                <Editable
                  value={r.title}
                  onChange={(v) => patch({ title: v })}
                  className="block font-display text-[clamp(2.2rem,4vw,3.6rem)] font-light leading-[1] tracking-[-0.02em] rtl:leading-[1.3] rtl:tracking-normal"
                />
              </h2>
            </div>
            <div>
              <Label>{t.ui.co_line}</Label>
              <p className="mt-2 text-[1.2rem] italic text-signal rtl:not-italic">
                <Editable key={r.lineIdx} value={r.line} onChange={(v) => patch({ line: v })} className="block" />
              </p>
            </div>
            <div>
              <Label>{t.ui.co_manifesto}</Label>
              <p className="mt-2 text-[15px] leading-[1.75] text-bone/90">
                <Editable value={r.manifesto} multiline onChange={(v) => patch({ manifesto: v })} className="block" />
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Label>{t.ui.co_principles}</Label>
          <div className="mt-5 grid grid-cols-1 border-t border-rule-strong md:grid-cols-3">
            {t.pillars.map(([n, d], i) => (
              <div key={n} className="border-rule py-6 md:border-s md:px-6 md:first:border-s-0 md:first:ps-0">
                <div className="label !text-signal">0{i + 1}</div>
                <div className="mt-3 font-display text-[1.6rem] leading-tight">{n}</div>
                <p className="mt-2 text-[14px] text-dim">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </Stage>
      <ActionBar c={c} stage="concept" onBack={() => go('insight')} onRegen={regen} onNext={() => go('script')} nextLabel={t.steps[4]} />
    </>
  )
}
