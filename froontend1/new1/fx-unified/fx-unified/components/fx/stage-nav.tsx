'use client'

import { Check } from 'lucide-react'
import { stageOrder, stageStatus } from '@/lib/fx/workspace-reducer'
import { cn } from '@/lib/utils'
import { useWorkspace } from './workspace-provider'

export function StageRail() {
  const { state, t, actions } = useWorkspace()

  return (
    <nav
      aria-label={t.stageNav.label}
      className="hidden w-60 shrink-0 flex-col border-e border-border md:flex lg:w-64"
    >
      <ol className="flex flex-col p-3">
        {stageOrder.map((stage, i) => {
          const current = state.stage === stage
          const done = stageStatus(state, stage) === 'done'
          const working =
            state.generation &&
            ((stage === 'strategy' && state.generation.operation === 'strategy') ||
              (stage === 'idea' && state.generation.operation !== 'strategy' && state.generation.operation !== 'script') ||
              (stage === 'script' && state.generation.operation === 'script'))
          const meta = t.stages[stage]
          return (
            <li key={stage} className="relative">
              {i < stageOrder.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute start-[27px] top-11 h-[calc(100%-2.25rem)] w-px bg-border"
                />
              ) : null}
              <button
                type="button"
                onClick={() => actions.goTo(stage)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'relative flex w-full items-start gap-3 rounded-md p-3 text-start transition-colors',
                  current ? 'bg-accent' : 'hover:bg-accent/50',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors',
                    current && 'border-foreground bg-foreground text-background',
                    !current && done && 'border-success/60 text-success',
                    !current && !done && 'border-border-strong text-muted-foreground',
                    working && 'border-signal',
                  )}
                  dir="ltr"
                >
                  {done && !current ? <Check className="size-3" /> : `0${i + 1}`}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className={cn('text-sm font-medium', !current && 'text-foreground/80')}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {working ? (
                      <span className="text-signal">{t.ai.working}…</span>
                    ) : (
                      meta.desc
                    )}
                  </span>
                  {done ? <span className="sr-only">{t.stageNav.done}</span> : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function MobileStageTabs() {
  const { state, t, actions } = useWorkspace()
  return (
    <nav
      aria-label={t.stageNav.label}
      className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border bg-background/95 px-4 backdrop-blur-sm md:hidden"
    >
      <ol className="flex gap-1 overflow-x-auto py-2">
        {stageOrder.map((stage, i) => {
          const current = state.stage === stage
          const done = stageStatus(state, stage) === 'done'
          return (
            <li key={stage} className="shrink-0">
              <button
                type="button"
                onClick={() => actions.goTo(stage)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-full px-3 text-xs transition-colors',
                  current ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="font-mono text-[10px]" dir="ltr">
                  0{i + 1}
                </span>
                {t.stages[stage].short}
                {done && !current ? (
                  <span aria-hidden className="size-1.5 rounded-full bg-success" />
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
