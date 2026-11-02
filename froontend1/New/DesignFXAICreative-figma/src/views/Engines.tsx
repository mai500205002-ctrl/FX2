import { useState } from 'react'
import { ENGINE_IDS, insightsFor, type Ctx, type EngineId } from '../content'
import { ActionBar, Glyph, Label, Stage } from '../components/ui'

export default function Engines({ c }: { c: Ctx }) {
  const { t, work, setWork, go } = c
  const [open, setOpen] = useState<EngineId>(work.engine)
  const pick = (e: EngineId) => {
    setOpen(e)
    if (e !== work.engine)
      setWork((w) => ({ ...w, engine: e, insightGen: false, insightSet: 0, insightPick: 0, insights: insightsFor(t, e, 0) }))
  }
  const rerun = () => {
    setWork((w) => ({ ...w, insightGen: false, insightSet: 0, insightPick: 0, insights: insightsFor(t, w.engine, 0) }))
    go('insight')
  }
  return (
    <>
      <Stage
        num="02"
        title={t.stages.engines.title}
        desc={t.stages.engines.desc}
        trace={t.engines[open].trace}
        traceTitle={`${t.ui.trace_title} · ${t.engines[open].name}`}
      >
        <ul role="radiogroup">
          {ENGINE_IDS.map((e, i) => {
            const on = open === e
            const sel = work.engine === e
            const eng = t.engines[e]
            return (
              <li key={e} className="border-t border-rule last:border-b">
                <button
                  role="radio"
                  aria-checked={sel}
                  onClick={() => pick(e)}
                  className={`group grid w-full cursor-pointer grid-cols-12 items-center gap-4 py-7 text-start transition-opacity ${on ? '' : 'opacity-60 hover:opacity-100'}`}
                >
                  <span className="label col-span-2 md:col-span-1">0{i + 1}</span>
                  <span className={`col-span-2 md:col-span-1 ${sel ? 'text-signal' : ''}`}>
                    <Glyph id={e} />
                  </span>
                  <span className="col-span-8 font-display text-[clamp(1.9rem,3.6vw,3.4rem)] leading-none transition-transform duration-500 group-hover:translate-x-2 md:col-span-6 rtl:group-hover:-translate-x-2 rtl:leading-[1.3]">
                    {eng.name}
                  </span>
                  <span className="col-span-9 col-start-3 hidden text-[14px] italic text-dim md:col-span-4 md:col-start-auto md:block rtl:not-italic">{eng.q}</span>
                </button>
                {on && (
                  <div className="rise grid grid-cols-12 gap-x-6 gap-y-6 pb-10">
                    <div className="col-span-12 md:col-span-4 md:col-start-3">
                      <Label>{t.ui.en_how}</Label>
                      <p className="mt-3 text-[15px] leading-relaxed text-bone/90">{eng.how}</p>
                      <p className="label mt-4 !text-signal">{t.ui.en_out}</p>
                    </div>
                    <div className="col-span-12 border-s border-signal ps-6 md:col-span-6">
                      <Label>{t.ui.en_apply}</Label>
                      <p className="mt-3 font-display text-[clamp(1.4rem,2.3vw,2rem)] italic leading-[1.25] rtl:not-italic">{eng.applied}</p>
                      <button
                        onClick={() => pick(e)}
                        className={`label mt-5 cursor-pointer border px-3 py-2 transition-colors ${sel ? 'border-signal !text-signal' : 'border-rule-strong hover:!text-bone'}`}
                      >
                        {sel ? `● ${t.ui.en_selected}` : t.ui.en_pick}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Stage>
      <ActionBar c={c} stage="engines" onBack={() => go('brief')} onRegen={rerun} onNext={() => go('insight')} nextLabel={t.steps[2]} />
    </>
  )
}
