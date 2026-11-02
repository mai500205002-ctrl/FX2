import type { Ctx } from '../content'
import { ENGINE_IDS, insightsFor } from '../content'
import Still from '../components/Still'
import { Arrow, Btn, Glyph, Label } from '../components/ui'

export default function Home({ c }: { c: Ctx }) {
  const { t, go, work, setWork } = c
  const views = ['brief', 'insight', 'concept', 'script'] as const
  return (
    <div className="px-6 pb-28 pt-14 lg:px-14">
      <section className="grid grid-cols-12 items-end gap-x-10 gap-y-10">
        <div className="col-span-12 lg:col-span-8">
          <Label>FX · {t.ui.brandSub}</Label>
          <h1 className="mt-8 font-display text-[clamp(3.4rem,9.5vw,9.5rem)] font-light leading-[.88] tracking-[-0.03em] rtl:leading-[1.15] rtl:tracking-normal">
            {t.ui.home_h1a}
            <br />
            <em className="text-signal">{t.ui.home_h1b}</em>
          </h1>
        </div>
        <div className="rise col-span-12 pb-3 lg:col-span-4" style={{ animationDelay: '.25s' }}>
          <p className="max-w-sm text-[17px] leading-relaxed text-dim">{t.ui.home_p}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn variant="primary" arrow onClick={() => go('brief')}>
              {t.ui.home_new}
            </Btn>
            <Btn onClick={() => go('script')}>{t.ui.home_cont}</Btn>
          </div>
        </div>
      </section>

      <section className="rise group relative mt-16" style={{ animationDelay: '.4s' }}>
        <Still title={work.routes[0].title} sub="DAR COLD BREW · 60″" />
        <div className="absolute inset-x-5 bottom-4 flex items-end justify-between">
          <Label className="!text-bone/80">{t.ui.home_now}</Label>
          <button onClick={() => go('script')} className="flex cursor-pointer items-center gap-3 bg-bg/70 px-4 py-2 text-[13px] backdrop-blur transition-colors hover:bg-signal hover:text-bg">
            {t.ui.home_resume} <Arrow />
          </button>
        </div>
      </section>

      <section className="mt-28">
        <Label>{t.ui.home_pipe}</Label>
        <div className="mt-6 grid grid-cols-1 border-t border-rule-strong md:grid-cols-4">
          {t.pipe.map((p, i) => (
            <button
              key={p.name}
              onClick={() => go(views[i])}
              className="group relative cursor-pointer border-rule py-8 text-start transition-colors hover:bg-bone/[0.03] md:border-s md:px-7 md:first:border-s-0 md:first:ps-0"
            >
              <div className="font-display text-[3.2rem] font-light italic leading-none text-signal rtl:not-italic">0{i + 1}</div>
              <div className="mt-6 font-display text-[2rem] leading-none">{p.name}</div>
              <div className="mt-3 text-[15px] text-bone">{p.verb}</div>
              <p className="mt-3 max-w-[16rem] text-[13px] leading-relaxed text-dim">{p.desc}</p>
              <Arrow className="mt-6 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 rtl:group-hover:-translate-x-1" />
            </button>
          ))}
        </div>
        <div className="border-y border-rule bg-panel/70 px-0 py-6 md:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <i className="size-2 rotate-45 border border-signal" />
              <Label>{t.ui.home_lens}</Label>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-3">
              {ENGINE_IDS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setWork((w) => (w.engine === e ? w : { ...w, engine: e, insightGen: false, insightSet: 0, insightPick: 0, insights: insightsFor(t, e, 0) }))
                    go('engines')
                  }}
                  className="flex cursor-pointer items-center gap-2.5 text-[14px] text-dim transition-colors hover:text-signal"
                >
                  <Glyph id={e} size={20} />
                  {t.engines[e].name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-28">
        <Label>{t.ui.home_recent}</Label>
        <ul className="mt-6">
          {t.recent.map((r, i) => (
            <li key={r.name} className="border-t border-rule last:border-b">
              <button
                onClick={() => go(i === 0 ? 'script' : 'brief')}
                className="grid w-full cursor-pointer grid-cols-12 items-center gap-4 py-6 text-start transition-colors hover:bg-bone/[0.03]"
              >
                <span className="label col-span-1">0{i + 1}</span>
                <span className="col-span-11 font-display text-[1.5rem] leading-tight md:col-span-6 md:text-[1.8rem]">{r.name}</span>
                <span className="label col-span-4 md:col-span-2 md:col-start-8">{t.steps[r.step]}</span>
                <span className="col-span-6 md:col-span-2">
                  <span className="block h-px w-full bg-rule-strong">
                    <span className="block h-px bg-signal" style={{ width: `${r.pct}%` }} />
                  </span>
                </span>
                <span className="col-span-2 flex justify-end md:col-span-1">
                  <Arrow />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
