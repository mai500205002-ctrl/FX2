import { Fragment } from 'react'
import { STEP_VIEWS, type Ctx, type Lang, type View } from '../content'

export function TopBar({ c, view, lang, setLang }: { c: Ctx; view: View; lang: Lang; setLang: (l: Lang) => void }) {
  const { t, go } = c
  const idx = STEP_VIEWS.indexOf(view as (typeof STEP_VIEWS)[number])
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-bg/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-6 px-6 lg:px-14">
        <button onClick={() => go('home')} className="flex cursor-pointer items-baseline gap-3" aria-label="FX home">
          <span className="font-display text-[1.9rem] italic leading-none tracking-tight rtl:not-italic">FX</span>
          <span className="label hidden sm:inline">{t.ui.brandSub}</span>
        </button>

        <nav className="hidden flex-1 items-center justify-center lg:flex" aria-label="Pipeline">
          {STEP_VIEWS.map((v, i) => {
            const active = i === idx
            const done = idx > i
            return (
              <Fragment key={v}>
                {i > 0 && <span className="mx-2 h-px w-6 bg-rule-strong" />}
                <button
                  onClick={() => go(v)}
                  aria-current={active ? 'step' : undefined}
                  className={`relative flex cursor-pointer items-center gap-2 py-5 text-[13px] transition-colors ${
                    active ? 'text-bone' : 'text-dim hover:text-bone'
                  }`}
                >
                  <span className="label !text-[10px]">0{i + 1}</span>
                  {v === 'engines' && <i className="size-1.5 rotate-45 border border-current" />}
                  {t.steps[i]}
                  {done && <span className="size-1 rounded-full bg-signal" />}
                  {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-signal" />}
                </button>
              </Fragment>
            )
          })}
        </nav>
        <div className="flex-1 lg:hidden">
          {idx >= 0 && (
            <span className="label">
              0{idx + 1} / 06 · {t.steps[idx]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center text-[12px]" role="group" aria-label="Language">
            {(['en', 'ar'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`cursor-pointer px-2 py-1 transition-colors ${lang === l ? 'text-bone underline decoration-signal decoration-2 underline-offset-[6px]' : 'text-dim hover:text-bone'}`}
              >
                {l === 'en' ? 'EN' : 'عربي'}
              </button>
            ))}
          </div>
          <button onClick={() => go('directions')} className="label hidden cursor-pointer transition-colors hover:!text-bone sm:inline">
            {t.ui.directions}
          </button>
        </div>
      </div>
    </header>
  )
}

export function Ribbon({ c, view }: { c: Ctx; view: View }) {
  const { t, work, go } = c
  if (view === 'home') return null
  const s = STEP_VIEWS.indexOf(view as (typeof STEP_VIEWS)[number])
  const cut = (x: string, n: number) => (x.length > n ? x.slice(0, n) + '…' : x)
  const items: [string, string, View][] = [[t.steps[0], work.brief.client, 'brief']]
  if (s >= 1) items.push([t.ui.lens, t.engines[work.engine].name, 'engines'])
  if (s >= 3 && work.insightGen) items.push([t.steps[2], cut(work.insights[work.insightPick], 34), 'insight'])
  if (s >= 4) items.push([t.steps[3], work.routes[work.route].title, 'concept'])
  return (
    <div className="border-b border-rule bg-panel/60">
      <div className="flex h-10 items-center gap-3 overflow-hidden whitespace-nowrap px-6 lg:px-14">
        {items.map(([k, v, target], i) => (
          <Fragment key={k}>
            {i > 0 && <span className="text-faint rtl:-scale-x-100">→</span>}
            <button onClick={() => go(target)} className="group flex min-w-0 cursor-pointer items-baseline gap-2">
              <span className="label !text-[10px]">{k}</span>
              <span className="truncate text-[12px] text-bone/90 transition-colors group-hover:text-signal">{v}</span>
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
