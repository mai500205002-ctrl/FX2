import type { Ctx, View } from '../content'
import Still from '../components/Still'
import { ActionBar, Arrow, Btn, Label } from '../components/ui'

export default function Output({ c, onReset }: { c: Ctx; onReset: () => void }) {
  const { t, work, go, toast } = c
  const r = work.routes[work.route]
  const total = work.scenes.reduce((a, s) => a + s.dur, 0)
  const proto = () => toast(t.ui.ou_toast)
  const chain: [string, string, View, string][] = [
    [t.steps[0], work.brief.client, 'brief', work.brief.objective],
    [t.steps[1], t.engines[work.engine].name, 'engines', t.engines[work.engine].applied],
    [t.steps[2], work.insights[work.insightPick] ?? t.engines[work.engine].insight, 'insight', ''],
    [t.steps[3], r.title, 'concept', r.line],
    [t.steps[4], `${work.scenes.length} · ${total}${t.ui.sc_sec}`, 'script', work.scenes[2].vo],
  ]
  return (
    <>
      <div className="grid grid-cols-12 gap-x-10 gap-y-14 px-6 pb-44 pt-12 lg:px-14">
        <div className="col-span-12 xl:col-span-7">
          <Label>{t.stages.output.title}</Label>
          <h1 className="mt-4 font-display text-[clamp(3rem,7vw,6.5rem)] font-light leading-[.92] tracking-[-0.03em] rtl:leading-[1.2] rtl:tracking-normal">
            {r.title}
          </h1>
          <p className="mt-5 text-[1.4rem] italic text-signal rtl:not-italic">{r.line}</p>
          <div className="mt-10">
            <Still title={r.title} sub={`${work.brief.client} · ${total}${t.ui.sc_sec}`} tone={work.route === 2 ? 'night' : 'dusk'} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Btn variant="primary" onClick={proto}>
              {t.ui.ou_pdf}
            </Btn>
            <Btn onClick={proto}>{t.ui.ou_copy}</Btn>
            <Btn onClick={proto}>{t.ui.ou_share}</Btn>
          </div>
          <div className="mt-14 max-w-2xl">
            <Label>{t.ui.ou_treatment}</Label>
            <p className="mt-4 font-display text-[1.45rem] font-light leading-[1.45] rtl:leading-[1.8]">{r.manifesto}</p>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <Label>{t.ui.ou_chain}</Label>
          <ol className="mt-5 border-t border-rule-strong">
            {chain.map(([k, v, target, sub], i) => (
              <li key={k} className="group grid grid-cols-12 gap-x-4 border-b border-rule py-5">
                <span className="label col-span-1 pt-1 !text-signal">0{i + 1}</span>
                <div className="col-span-9">
                  <Label>{k}</Label>
                  <div className="mt-1 font-display text-[1.25rem] leading-snug">{v}</div>
                  {sub && <p className="mt-1 text-[13px] leading-relaxed text-dim">{sub}</p>}
                </div>
                <button
                  onClick={() => go(target)}
                  className="label col-span-2 cursor-pointer self-start text-end transition-colors hover:!text-signal"
                >
                  {t.ui.ou_edit}
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <Label>{t.ui.ou_next}</Label>
            <ul className="mt-4">
              {[
                [t.ui.ou_a1, () => go('engines')],
                [t.ui.ou_a2, () => go('concept')],
                [t.ui.ou_a3, proto],
              ].map(([l, fn]) => (
                <li key={l as string}>
                  <button
                    onClick={fn as () => void}
                    className="group flex w-full cursor-pointer items-center justify-between border-t border-rule py-4 text-start text-[15px] transition-colors last:border-b hover:text-signal"
                  >
                    {l as string}
                    <Arrow className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <ActionBar c={c} stage="output" onBack={() => go('script')} onRegen={() => go('engines')} onNext={onReset} nextLabel={t.ui.ou_new} />
    </>
  )
}
