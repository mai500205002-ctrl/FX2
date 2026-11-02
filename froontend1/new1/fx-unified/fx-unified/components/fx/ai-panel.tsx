'use client'

import { ArrowUpLeft, ArrowUpRight, X } from 'lucide-react'
import { formatNumber } from '@/lib/fx/i18n'
import { buildSuggestions, type Suggestion } from '@/lib/fx/suggestions'
import type { EngineId } from '@/lib/fx/types'
import {
  selectedIdea,
  stageOrder,
  stageStatus,
  TOKEN_LIMIT,
} from '@/lib/fx/workspace-reducer'
import { cn } from '@/lib/utils'
import { useStepLabel } from './generation-progress'
import { FxButton, Meter } from './primitives'
import { useWorkspace } from './workspace-provider'

const engineOrder: EngineId[] = ['provocation', 'analogies', 'random', 'opposite', 'constraint']

function PanelSection({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-border px-5 py-5 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium text-muted-foreground ltr:uppercase ltr:tracking-[0.12em]">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function ScoreSection() {
  const { state, t } = useWorkspace()
  const chosen = selectedIdea(state)
  const score = chosen
    ? chosen.score
    : state.ideas.length
      ? Math.round(state.ideas.reduce((s, i) => s + i.score, 0) / state.ideas.length)
      : null

  return (
    <PanelSection title={t.panel.score}>
      {score === null ? (
        <p className="text-sm text-muted-foreground">{t.panel.scoreEmpty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <span className="font-mono text-4xl font-medium leading-none" dir="ltr">
              {score}
              <span className="text-base text-muted-foreground">/100</span>
            </span>
            {chosen ? (
              <span className="text-xs text-signal">{t.engines.items[chosen.engine].name}</span>
            ) : null}
          </div>
          <Meter value={score} label={t.panel.score} tone="signal" />
        </div>
      )}
    </PanelSection>
  )
}

function EnginesSection() {
  const { state, t, actions } = useWorkspace()
  return (
    <PanelSection title={t.engines.title}>
      <p className="text-xs text-muted-foreground">{t.engines.hint}</p>
      <ul className="flex flex-col gap-1">
        {engineOrder.map((engine) => {
          const on = state.engines.includes(engine)
          const lastOne = on && state.engines.length === 1
          const item = t.engines.items[engine]
          return (
            <li key={engine}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-disabled={lastOne}
                title={lastOne ? t.engines.minOne : undefined}
                onClick={() => actions.dispatch({ type: 'toggleEngine', engine })}
                className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-start transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors',
                    on ? 'bg-signal' : 'bg-border-strong',
                  )}
                >
                  <span
                    className={cn(
                      'size-3 rounded-full bg-background transition-transform',
                      on && 'translate-x-3 rtl:-translate-x-3',
                    )}
                  />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className={cn('text-sm', !on && 'text-muted-foreground')}>{item.name}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{item.desc}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </PanelSection>
  )
}

function SuggestionsSection() {
  const { state, t, actions } = useWorkspace()
  const suggestions = buildSuggestions(state, t)
  const busy = state.generation !== null
  const Arrow = state.locale === 'ar' ? ArrowUpLeft : ArrowUpRight

  const run = (s: Suggestion) => {
    switch (s.action.kind) {
      case 'goto':
        return actions.goTo(s.action.stage)
      case 'generateStrategy':
        return actions.generateStrategy()
      case 'generateIdeas':
        return actions.generateIdeas()
      case 'compare':
        return actions.dispatch({ type: 'toggleCompareMode' })
      case 'generateScript':
        return actions.generateScript()
      case 'addScene':
        return actions.addScene()
    }
  }

  return (
    <PanelSection title={t.panel.suggestions}>
      <ul className="flex flex-col gap-2">
        {suggestions.map((s) =>
          s.action.kind === 'none' ? (
            <li key={s.id} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" />
              {s.text}
            </li>
          ) : (
            <li key={s.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(s)}
                className="group flex w-full items-start justify-between gap-3 rounded-md border border-border px-3 py-2.5 text-start text-sm leading-relaxed transition-colors hover:border-signal/60 disabled:opacity-40"
              >
                {s.text}
                <Arrow
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-signal"
                />
              </button>
            </li>
          ),
        )}
      </ul>
    </PanelSection>
  )
}

function MemorySection() {
  const { state, t } = useWorkspace()
  const chosen = selectedIdea(state)
  const facts = [
    state.brief.brand && { k: t.memory.brand, v: state.brief.brand },
    state.brief.audience && { k: t.memory.audience, v: state.brief.audience },
    state.strategy && { k: t.memory.tension, v: state.strategy.tension },
    state.strategy && { k: t.memory.territory, v: state.strategy.territory },
    chosen && { k: t.memory.idea, v: chosen.theme },
    state.script && { k: t.memory.scenes, v: String(state.script.scenes.length) },
  ].filter((f): f is { k: string; v: string } => Boolean(f))

  return (
    <PanelSection title={t.panel.memory}>
      {facts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.panel.memoryEmpty}</p>
      ) : (
        <dl className="flex flex-col gap-3">
          {facts.map((f) => (
            <div key={f.k} className="flex flex-col gap-0.5">
              <dt className="text-[11px] text-muted-foreground">{f.k}</dt>
              <dd className="line-clamp-2 text-sm leading-relaxed">{f.v}</dd>
            </div>
          ))}
        </dl>
      )}
    </PanelSection>
  )
}

function StatusSection() {
  const { state, t } = useWorkspace()
  const stepLabel = useStepLabel()
  const done = stageOrder.filter((s) => stageStatus(state, s) === 'done').length
  const usage = (state.tokens / TOKEN_LIMIT) * 100

  return (
    <PanelSection
      title={t.panel.project}
      aside={
        <span className="font-mono text-xs text-muted-foreground" dir="ltr">
          {done}/4
        </span>
      }
    >
      <div className="flex gap-1" aria-label={`${done} ${t.panel.stagesDone}`} role="img">
        {stageOrder.map((s) => (
          <span
            key={s}
            className={cn(
              'h-1 flex-1 rounded-full',
              stageStatus(state, s) === 'done' ? 'bg-foreground/70' : 'bg-subtle',
            )}
          />
        ))}
      </div>
      {state.generation ? (
        <p className="text-xs text-signal" aria-hidden>
          {stepLabel(state.generation.steps[state.generation.stepIndex])}
        </p>
      ) : null}
      <div className="mt-2 flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">{t.panel.tokens}</span>
          <span className="font-mono" dir="ltr">
            {formatNumber(state.tokens)} / {formatNumber(TOKEN_LIMIT)}
          </span>
        </div>
        <Meter value={usage} label={t.panel.tokens} />
      </div>
    </PanelSection>
  )
}

export function AiPanel() {
  const { state, t, actions } = useWorkspace()

  return (
    <>
      {state.mobilePanelOpen ? (
        <div
          aria-hidden
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-[2px] xl:hidden"
          onClick={() => actions.dispatch({ type: 'setMobilePanelOpen', open: false })}
        />
      ) : null}
      <aside
        id="ai-panel"
        aria-label={t.panel.title}
        className={cn(
          'flex w-[min(340px,90vw)] shrink-0 flex-col border-s border-border bg-background',
          'fixed inset-y-0 end-0 z-40 xl:static xl:z-auto xl:w-[320px]',
          state.mobilePanelOpen ? 'flex' : 'hidden',
          state.panelOpen ? 'xl:flex' : 'xl:hidden',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          <p className="text-sm font-medium">{t.panel.title}</p>
          <FxButton
            variant="ghost"
            size="iconSm"
            aria-label={t.panel.close}
            onClick={actions.togglePanel}
          >
            <X aria-hidden />
          </FxButton>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SuggestionsSection />
          <ScoreSection />
          <EnginesSection />
          <MemorySection />
          <StatusSection />
        </div>
      </aside>
    </>
  )
}
