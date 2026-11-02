import { useEffect } from 'react'
import { insightsFor, type Ctx } from '../content'
import { ActionBar, Editable, Label, Stage } from '../components/ui'

export default function Insight({ c }: { c: Ctx }) {
  const { t, work, setWork, go } = c
  const gen = work.insightGen
  const eng = t.engines[work.engine]

  useEffect(() => {
    if (gen) return
    const id = setTimeout(() => setWork((w) => ({ ...w, insightGen: true })), 2300)
    return () => clearTimeout(id)
  }, [gen])

  const regen = () =>
    setWork((w) => {
      const set = w.insightSet === 0 ? 1 : 0
      return { ...w, insightSet: set, insights: insightsFor(t, w.engine, set), insightPick: 0, insightGen: false }
    })

  return (
    <>
      <Stage
        num="03"
        title={t.stages.insight.title}
        desc={t.stages.insight.desc}
        trace={eng.trace}
        traceTitle={`${t.ui.trace_title} · ${eng.name}`}
        traceLive={!gen}
      >
        <div className="mb-2 flex items-center justify-between">
          <Label>{gen ? t.ui.in_hint : `${t.ui.in_thinking}…`}</Label>
          <Label className="!text-signal">
            {t.ui.lens}: {eng.name}
          </Label>
        </div>
        <div role="radiogroup">
          {!gen &&
            [0, 1, 2].map((i) => (
              <div key={i} className="border-t border-rule py-9">
                <div className="shimmer mb-3 h-7 w-[92%]" />
                <div className="shimmer h-7 w-[64%]" />
              </div>
            ))}
          {gen &&
            work.insights.map((text, i) => {
              const sel = work.insightPick === i
              return (
                <div
                  key={`${work.insightSet}-${i}`}
                  role="radio"
                  aria-checked={sel}
                  tabIndex={0}
                  onClick={() => setWork((w) => ({ ...w, insightPick: i }))}
                  onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && e.target === e.currentTarget && setWork((w) => ({ ...w, insightPick: i }))}
                  className={`rise relative grid cursor-pointer grid-cols-12 gap-x-4 border-t border-rule py-9 transition-opacity duration-300 last:border-b ${sel ? '' : 'opacity-50 hover:opacity-80'}`}
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  {sel && <span className="absolute inset-y-9 -start-5 w-0.5 bg-signal" />}
                  <span className="col-span-1 font-display text-[2rem] italic leading-none text-signal rtl:not-italic">0{i + 1}</span>
                  <div className="col-span-11">
                    <Editable
                      value={text}
                      onChange={(v) =>
                        setWork((w) => ({ ...w, insights: w.insights.map((x, j) => (j === i ? v : x)), insightPick: i }))
                      }
                      className="block font-display text-[clamp(1.5rem,2.6vw,2.4rem)] font-light leading-[1.2] rtl:leading-[1.5]"
                    />
                    <div className="mt-4 flex items-center gap-3">
                      <Label>
                        {t.ui.in_via} {eng.name}
                      </Label>
                      {sel && <Label className="!text-signal">● {t.ui.en_selected}</Label>}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {gen && (
          <div className="rise mt-14">
            <Label>{t.ui.in_anatomy}</Label>
            <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-3">
              {t.scaffold.map((s, i) => (
                <div key={s.label} className="border-t border-rule-strong pt-4">
                  <div className="label !text-signal">
                    0{i + 1} · {s.label}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-bone/90">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Stage>
      <ActionBar c={c} stage="insight" onBack={() => go('engines')} onRegen={regen} onNext={() => go('concept')} nextLabel={t.steps[3]} />
    </>
  )
}
