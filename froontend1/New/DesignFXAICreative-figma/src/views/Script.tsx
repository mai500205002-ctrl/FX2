import { useRef, useState } from 'react'
import type { Ctx } from '../content'
import { ActionBar, Editable, Label } from '../components/ui'

export default function Script({ c }: { c: Ctx }) {
  const { t, work, setWork, go } = c
  const [sel, setSel] = useState(0)
  const refs = useRef<(HTMLElement | null)[]>([])
  const total = work.scenes.reduce((a, s) => a + s.dur, 0)
  const sc = t.scenes[sel]
  const ws = work.scenes[sel]
  const patch = (i: number, p: Partial<(typeof work.scenes)[number]>) =>
    setWork((w) => ({ ...w, scenes: w.scenes.map((x, j) => (j === i ? { ...x, ...p } : x)) }))
  const choose = (i: number) => {
    setSel(i)
    refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const regen = () => {
    const alt = !ws.alt
    patch(sel, { alt, vo: alt ? sc.vo2 : sc.vo })
  }
  const title = work.routes[work.route].title

  return (
    <>
      <div className="grid grid-cols-12 gap-x-8 px-6 pb-44 pt-10 lg:px-14">
        <aside className="col-span-12 mb-10 self-start lg:sticky lg:top-32 lg:col-span-3 lg:mb-0">
          <h1 className="font-display text-[2.2rem] leading-[1.05] rtl:leading-[1.3]">{t.stages.script.title}</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-dim">{t.stages.script.desc}</p>
          <Label className="mt-8 block">{t.ui.sc_scenes}</Label>
          <ol className="mt-3 border-t border-rule">
            {t.scenes.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => choose(i)}
                  aria-current={sel === i}
                  className={`relative flex w-full cursor-pointer items-baseline gap-3 border-b border-rule py-3 text-start transition-colors ${sel === i ? 'text-bone' : 'text-dim hover:text-bone'}`}
                >
                  {sel === i && <span className="absolute inset-y-0 -start-3 w-0.5 bg-signal" />}
                  <span className="label !text-[10px]">0{i + 1}</span>
                  <span className="flex-1 truncate text-[13px]">{s.slug}</span>
                  <span className="label !text-[10px]">
                    {work.scenes[i].dur}
                    {t.ui.sc_sec}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className="col-span-12 lg:col-span-6">
          <div className="sticky top-[104px] z-10 -mx-1 mb-6 bg-bg/95 px-1 pb-3 pt-2 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <Label>
                {t.ui.sc_runtime} · {total}
                {t.ui.sc_sec}
              </Label>
              <Label className={total === 60 ? '!text-dim' : '!text-signal'}>
                {t.ui.sc_target} 60{t.ui.sc_sec}
              </Label>
            </div>
            <div className="flex h-7 gap-px" aria-label="Timeline">
              {work.scenes.map((s, i) => (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  style={{ flexGrow: s.dur, flexBasis: 0 }}
                  className={`label cursor-pointer !text-[10px] transition-colors ${sel === i ? 'bg-signal !text-bg' : 'bg-raise hover:bg-rule-strong'}`}
                >
                  0{i + 1}
                </button>
              ))}
            </div>
          </div>

          <article className="bg-paper px-8 py-14 font-script text-[14.5px] leading-[1.75] text-[#16120d] shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)] md:px-16 rtl:text-[17px]">
            <div className="mb-14 text-center">
              <div className="text-[11px] uppercase tracking-[.3em] opacity-60 rtl:tracking-normal">{t.ui.sc_film}</div>
              <div className="mt-2 text-[1.15rem] font-bold">{work.brief.client}</div>
              <div className="mt-8 text-[2rem] font-bold uppercase leading-none tracking-[.04em] rtl:tracking-normal">{title}</div>
            </div>
            <div className="mb-8 font-bold">{t.ui.sc_fade}</div>
            {work.scenes.map((s, i) => (
              <section
                key={i}
                ref={(el) => {
                  refs.current[i] = el
                }}
                onClick={() => setSel(i)}
                className={`relative mb-10 ps-4 transition-opacity ${sel === i ? 'border-s-2 border-signal' : 'border-s-2 border-transparent opacity-55'}`}
              >
                <h3 className="mb-2 font-bold uppercase">
                  {i + 1}. {t.scenes[i].slug}
                </h3>
                <Editable multiline value={s.action} onChange={(v) => patch(i, { action: v })} className="block" />
                {s.who && (
                  <div className="mt-4">
                    <div className="text-center uppercase">{s.who}</div>
                    <div className="mx-auto max-w-[70%] text-center">
                      <Editable value={s.line} onChange={(v) => patch(i, { line: v })} className="block" />
                    </div>
                  </div>
                )}
                {i === work.scenes.length - 1 && (
                  <div className="mt-4 text-center font-bold uppercase">
                    {t.ui.sc_super}: {title}
                  </div>
                )}
                <div className="mt-4 text-center text-[12px] uppercase opacity-70">{t.ui.sc_vo}</div>
                <div className="mx-auto max-w-[78%] text-center italic rtl:not-italic">
                  <Editable key={`${i}-${s.alt}`} value={s.vo} onChange={(v) => patch(i, { vo: v })} className="block" />
                </div>
              </section>
            ))}
            <div className="text-end font-bold">{t.ui.sc_fade.replace('FADE IN:', 'FADE OUT.')}</div>
          </article>
        </div>

        <aside className="col-span-12 mt-10 self-start lg:sticky lg:top-32 lg:col-span-3 lg:mt-0">
          <div className="border-t border-rule-strong pt-5">
            <div className="label !text-signal">
              0{sel + 1} / 0{t.scenes.length}
            </div>
            <div className="mt-2 font-display text-[1.4rem] leading-tight">{sc.slug}</div>
            <dl className="mt-6 flex flex-col gap-5">
              {[
                [t.ui.sc_shot, sc.shot],
                [t.ui.sc_mood, sc.mood],
                [t.ui.sc_sound, sc.sound],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label">{k}</dt>
                  <dd className="mt-1 text-[14px] text-bone/90">{v}</dd>
                </div>
              ))}
              <div>
                <dt className="label">{t.ui.sc_dur}</dt>
                <dd className="mt-2 flex items-center gap-4">
                  <button
                    aria-label="-"
                    onClick={() => patch(sel, { dur: Math.max(2, ws.dur - 1) })}
                    className="size-8 cursor-pointer border border-rule-strong transition-colors hover:border-bone"
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center font-mono text-[15px]">
                    {ws.dur}
                    {t.ui.sc_sec}
                  </span>
                  <button
                    aria-label="+"
                    onClick={() => patch(sel, { dur: ws.dur + 1 })}
                    className="size-8 cursor-pointer border border-rule-strong transition-colors hover:border-bone"
                  >
                    +
                  </button>
                </dd>
              </div>
            </dl>
            <button
              onClick={regen}
              className="mt-8 flex w-full cursor-pointer items-center justify-between border border-rule-strong px-4 py-3 text-[13px] transition-colors hover:border-signal hover:text-signal"
            >
              {t.ui.sc_regen} <span>↻</span>
            </button>
          </div>
        </aside>
      </div>
      <ActionBar c={c} stage="script" onBack={() => go('concept')} onRegen={regen} onNext={() => go('output')} nextLabel={t.steps[5]} />
    </>
  )
}
