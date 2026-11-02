'use client'

import { Check, RotateCcw, Square, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { GenerationState, OperationId } from '@/lib/fx/types'
import { cn } from '@/lib/utils'
import { FxButton } from './primitives'
import { useWorkspace } from './workspace-provider'

type StepKey = keyof ReturnType<typeof useWorkspace>['t']['generation']

export function useStepLabel() {
  const { t } = useWorkspace()
  return (key: string) => t.generation[key as StepKey] ?? key
}

export function GenerationProgress({
  generation,
  children,
  compact = false,
}: {
  generation: GenerationState
  children?: ReactNode
  compact?: boolean
}) {
  const { t, actions } = useWorkspace()
  const label = useStepLabel()
  const current = generation.steps[generation.stepIndex]

  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <div
        className={cn(
          'flex flex-col gap-5 rounded-lg border border-border bg-surface',
          compact ? 'p-4' : 'p-6 md:flex-row md:items-center md:justify-between',
        )}
      >
        <div className="flex flex-col gap-4">
          <p role="status" aria-live="polite" className={cn('font-medium', compact ? 'text-sm' : 'text-lg')}>
            {label(current)}
          </p>
          <ol className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {generation.steps.map((step, i) => {
              const state =
                i < generation.stepIndex ? 'done' : i === generation.stepIndex ? 'active' : 'todo'
              return (
                <li
                  key={step}
                  className={cn(
                    'flex items-center gap-2 text-xs transition-colors',
                    state === 'todo' ? 'text-muted-foreground/60' : 'text-muted-foreground',
                    state === 'active' && 'text-foreground',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-4 items-center justify-center rounded-full border',
                      state === 'done' && 'border-success/50 text-success',
                      state === 'active' && 'border-signal',
                      state === 'todo' && 'border-border-strong',
                    )}
                  >
                    {state === 'done' ? (
                      <Check className="size-2.5" />
                    ) : state === 'active' ? (
                      <span className="size-1.5 animate-pulse rounded-full bg-signal" />
                    ) : null}
                  </span>
                  <span>{label(step).replace(/[.…]+$/, '')}</span>
                </li>
              )
            })}
          </ol>
        </div>
        <FxButton variant="ghost" size="sm" onClick={actions.cancelGeneration} className="self-start md:self-center">
          <Square className="size-3! fill-current" aria-hidden />
          {t.generation.cancel}
        </FxButton>
      </div>
      {children}
    </div>
  )
}

export function GenerationError({ operation, onRetry }: { operation: OperationId; onRetry: () => void }) {
  const { t, actions } = useWorkspace()
  return (
    <div
      role="alert"
      data-operation={operation}
      className="flex flex-col gap-4 rounded-lg border border-destructive/40 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-center gap-3 text-sm">
        <TriangleAlert className="size-4 text-destructive" aria-hidden />
        {t.generation.failed}
      </p>
      <div className="flex gap-2">
        <FxButton variant="ghost" size="sm" onClick={() => actions.dispatch({ type: 'dismissError' })}>
          {t.idea.cancel}
        </FxButton>
        <FxButton size="sm" onClick={onRetry}>
          <RotateCcw aria-hidden />
          {t.generation.retry}
        </FxButton>
      </div>
    </div>
  )
}

export function EmptyStage({
  title,
  hint,
  action,
}: {
  title: string
  hint: string
  action: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border-strong px-6 py-16 md:items-center md:text-center">
      <p className="text-lg font-medium">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{hint}</p>
      <div className="pt-2">{action}</div>
    </div>
  )
}
