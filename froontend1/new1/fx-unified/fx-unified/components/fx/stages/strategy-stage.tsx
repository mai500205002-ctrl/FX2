'use client'

import { ArrowLeft, ArrowRight, Check, Pencil, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { StrategyField } from '@/lib/fx/types'
import { cn } from '@/lib/utils'
import { EmptyStage, GenerationError, GenerationProgress } from '../generation-progress'
import { FxButton, SectionLabel, Skeleton, StageHeader } from '../primitives'
import { useWorkspace } from '../workspace-provider'

function StrategyBlock({
  field,
  index,
  variant = 'default',
}: {
  field: StrategyField
  index: string
  variant?: 'hero' | 'tension' | 'default'
}) {
  const { state, t, actions } = useWorkspace()
  const [editing, setEditing] = useState(false)
  const value = state.strategy?.[field] ?? ''
  const label = t.strategy.fields[field]
  const textareaId = `strategy-${field}`

  return (
    <article
      className={cn(
        'group flex flex-col gap-4',
        variant === 'tension' && 'rounded-lg border border-signal/40 bg-signal/[0.06] p-6',
        variant === 'default' && 'border-t border-border pt-5',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {index}
          </span>
          <span
            className={cn(
              'text-xs font-medium ltr:uppercase ltr:tracking-[0.12em]',
              variant === 'tension' ? 'text-signal' : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
        </h2>
        <FxButton
          variant="quiet"
          size="sm"
          onClick={() => setEditing((e) => !e)}
          aria-label={`${editing ? t.strategy.done : t.strategy.edit}: ${label}`}
          aria-expanded={editing}
          aria-controls={editing ? textareaId : undefined}
          className={cn(!editing && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100')}
        >
          {editing ? <Check aria-hidden /> : <Pencil aria-hidden />}
          {editing ? t.strategy.done : t.strategy.edit}
        </FxButton>
      </div>
      {editing ? (
        <textarea
          id={textareaId}
          autoFocus
          value={value}
          aria-label={label}
          onChange={(e) =>
            actions.dispatch({ type: 'updateStrategy', field, value: e.target.value })
          }
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditing(false)
          }}
          className={cn(
            'field-sizing-content min-h-24 w-full resize-none rounded-md border border-border-strong bg-surface p-3 leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring',
            variant === 'hero' ? 'text-2xl font-medium' : 'text-[15px]',
          )}
        />
      ) : (
        <p
          className={cn(
            'text-pretty leading-relaxed',
            variant === 'hero' &&
              'text-balance text-2xl font-medium leading-snug md:text-[2rem] md:leading-[1.35]',
            variant === 'tension' && 'text-lg font-medium',
            variant === 'default' && 'text-[15px] text-foreground/90',
          )}
        >
          {value}
        </p>
      )}
    </article>
  )
}

function StrategySkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-hidden>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-full max-w-3xl" />
        <Skeleton className="h-8 w-2/3 max-w-2xl" />
      </div>
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="grid gap-8 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 border-t border-border pt-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function StrategyStage() {
  const { state, t, actions } = useWorkspace()
  const generating = state.generation?.operation === 'strategy' ? state.generation : null
  const failed = state.error?.operation === 'strategy'
  const busy = state.generation !== null
  const Arrow = state.locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <div className="flex flex-col gap-10">
      <StageHeader eyebrow={t.strategy.eyebrow} title={t.strategy.title} lede={t.strategy.lede} />

      {failed ? <GenerationError operation="strategy" onRetry={actions.generateStrategy} /> : null}

      {generating ? (
        <GenerationProgress generation={generating}>
          <StrategySkeleton />
        </GenerationProgress>
      ) : !state.strategy ? (
        <EmptyStage
          title={t.strategy.empty}
          hint={t.strategy.emptyHint}
          action={
            <FxButton onClick={() => actions.goTo('brief')}>{t.strategy.goToBrief}</FxButton>
          }
        />
      ) : (
        <div className="fx-rise flex flex-col gap-12">
          <StrategyBlock field="insight" index="01" variant="hero" />
          <StrategyBlock field="tension" index="02" variant="tension" />
          <section className="flex flex-col gap-6">
            <SectionLabel>{t.strategy.fields.direction}</SectionLabel>
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              <StrategyBlock field="audienceInsight" index="03" />
              <StrategyBlock field="opportunity" index="04" />
              <StrategyBlock field="territory" index="05" />
              <StrategyBlock field="direction" index="06" />
            </div>
          </section>
        </div>
      )}

      {state.strategy && !generating ? (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between md:-mx-10 md:px-10">
          <FxButton variant="ghost" onClick={actions.generateStrategy} disabled={busy}>
            <RotateCcw aria-hidden />
            {t.strategy.regenerate}
          </FxButton>
          <FxButton variant="primary" size="lg" onClick={actions.generateIdeas} disabled={busy}>
            <Sparkles aria-hidden />
            {state.ideas.length ? t.idea.regenerateAll : t.strategy.generate}
            <Arrow aria-hidden />
          </FxButton>
        </div>
      ) : null}
    </div>
  )
}
