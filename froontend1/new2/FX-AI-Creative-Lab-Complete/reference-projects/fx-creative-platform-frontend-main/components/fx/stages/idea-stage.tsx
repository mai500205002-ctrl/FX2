'use client'

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Columns2,
  RotateCcw,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useState } from 'react'
import type { Idea, IdeaField } from '@/lib/fx/types'
import { cn } from '@/lib/utils'
import {
  EmptyStage,
  GenerationError,
  GenerationProgress,
  useStepLabel,
} from '../generation-progress'
import { FxButton, Meter, Skeleton, StageHeader } from '../primitives'
import { useWorkspace } from '../workspace-provider'

const detailFields: IdeaField[] = ['territory', 'hook', 'message']

function EditableText({
  idea,
  field,
  className,
  multiline = true,
}: {
  idea: Idea
  field: IdeaField
  className?: string
  multiline?: boolean
}) {
  const { t, actions } = useWorkspace()
  const shared = cn(
    'w-full resize-none rounded-sm bg-transparent -mx-1 px-1 transition-colors hover:bg-accent/60 focus:bg-accent focus:outline-none',
    className,
  )
  const onChange = (value: string) =>
    actions.dispatch({ type: 'updateIdea', id: idea.id, field, value })
  return multiline ? (
    <textarea
      value={idea[field]}
      aria-label={t.idea.fields[field]}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className={cn(shared, 'field-sizing-content')}
    />
  ) : (
    <input
      value={idea[field]}
      aria-label={t.idea.fields[field]}
      onChange={(e) => onChange(e.target.value)}
      className={shared}
    />
  )
}

function RefineForm({ idea, onClose }: { idea: Idea; onClose: () => void }) {
  const { t, actions } = useWorkspace()
  const [value, setValue] = useState('')
  const submit = () => {
    if (!value.trim()) return
    actions.refineIdea(idea.id, value)
    onClose()
  }
  return (
    <form
      className="fx-rise flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <label htmlFor={`refine-${idea.id}`} className="sr-only">
        {t.idea.refine}
      </label>
      <input
        id={`refine-${idea.id}`}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
          if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
        }}
        placeholder={t.idea.refinePlaceholder}
        className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex justify-end gap-2">
        <FxButton variant="ghost" size="sm" onClick={onClose}>
          {t.idea.cancel}
        </FxButton>
        <FxButton type="submit" variant="primary" size="sm" disabled={!value.trim()}>
          {t.idea.refineSubmit}
        </FxButton>
      </div>
    </form>
  )
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="font-mono text-2xl font-medium leading-none" dir="ltr" aria-hidden>
        {score}
      </span>
      <Meter value={score} label={label} tone="signal" className="w-14" />
    </div>
  )
}

function IdeaCardSkeleton({ stepLabel }: { stepLabel?: string }) {
  return (
    <div className="flex min-h-[420px] flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-6 w-10" />
      </div>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="mt-auto flex flex-col gap-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      {stepLabel ? (
        <p role="status" className="text-xs text-signal">
          {stepLabel}
        </p>
      ) : null}
    </div>
  )
}

function IdeaCard({ idea, index }: { idea: Idea; index: number }) {
  const { state, t, actions } = useWorkspace()
  const [refining, setRefining] = useState(false)
  const stepLabel = useStepLabel()
  const isSelected = state.selectedIdeaId === idea.id
  const inCompare = state.compareIds.includes(idea.id)
  const busy = state.generation !== null
  const target = state.generation?.targetId === idea.id ? state.generation : null

  if (target) {
    return <IdeaCardSkeleton stepLabel={stepLabel(target.steps[target.stepIndex])} />
  }

  return (
    <article
      aria-labelledby={`idea-${idea.id}-title`}
      className={cn(
        'fx-rise relative flex flex-col gap-5 rounded-lg border bg-surface p-5 transition-colors',
        isSelected ? 'border-signal ring-1 ring-signal' : 'border-border hover:border-border-strong',
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-mono">{String(index + 1).padStart(2, '0')}</span>
                <span aria-hidden>·</span>
                <span>
                  {t.idea.version} <span className="font-mono">{idea.version}</span>
                </span>
              </span>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border-strong px-2.5 py-0.5 text-xs">
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {t.engines.items[idea.engine].name}
          </span>
        </div>
        <ScoreBadge score={idea.score} label={`${t.idea.score}: ${idea.score}`} />
      </header>

      <div className="flex flex-col gap-3">
        <h3 id={`idea-${idea.id}-title`} className="sr-only">
          {idea.bigIdea}
        </h3>
        <EditableText
          idea={idea}
          field="bigIdea"
          className="text-xl font-semibold leading-snug text-balance"
        />
        <div className="flex items-baseline gap-2 text-signal">
          <span aria-hidden className="text-lg leading-none">
            {'“'}
          </span>
          <EditableText idea={idea} field="theme" multiline={false} className="text-sm font-medium" />
        </div>
      </div>

      <dl className="flex flex-col gap-4 border-t border-border pt-4">
        {detailFields.map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <dt className="text-[11px] text-muted-foreground ltr:uppercase ltr:tracking-[0.1em]">
              {t.idea.fields[field]}
            </dt>
            <dd>
              <EditableText idea={idea} field={field} className="text-sm leading-relaxed text-foreground/85" />
            </dd>
          </div>
        ))}
      </dl>

      {idea.refinements.length > 0 ? (
        <ul className="flex flex-col gap-1 border-t border-border pt-3">
          {idea.refinements.slice(-2).map((r, i) => (
            <li key={`${r}-${i}`} className="flex items-start gap-2 text-xs text-muted-foreground">
              <WandSparkles className="mt-0.5 size-3 shrink-0" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        {refining ? (
          <RefineForm idea={idea} onClose={() => setRefining(false)} />
        ) : state.compareMode ? (
          <FxButton
            variant={inCompare ? 'primary' : 'secondary'}
            size="sm"
            aria-pressed={inCompare}
            onClick={() => actions.dispatch({ type: 'toggleCompareId', id: idea.id })}
          >
            {inCompare ? <Check aria-hidden /> : <Columns2 aria-hidden />}
            {inCompare ? t.idea.removeFromCompare : t.idea.addToCompare}
          </FxButton>
        ) : (
          <>
            <FxButton
              variant={isSelected ? 'signal' : 'primary'}
              size="sm"
              aria-pressed={isSelected}
              onClick={() => actions.dispatch({ type: 'selectIdea', id: idea.id })}
            >
              {isSelected ? <Check aria-hidden /> : null}
              {isSelected ? t.idea.selected : t.idea.select}
            </FxButton>
            <div className="grid grid-cols-2 gap-2">
              <FxButton variant="ghost" size="sm" disabled={busy} onClick={() => setRefining(true)}>
                <WandSparkles aria-hidden />
                {t.idea.refine}
              </FxButton>
              <FxButton
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => actions.regenerateIdea(idea.id)}
              >
                <RotateCcw aria-hidden />
                {t.idea.regenerate}
              </FxButton>
            </div>
          </>
        )}
      </footer>
    </article>
  )
}

function CompareTable() {
  const { state, t } = useWorkspace()
  const ideas = state.compareIds
    .map((id) => state.ideas.find((i) => i.id === id))
    .filter((i): i is Idea => Boolean(i))

  if (ideas.length < 2) {
    return (
      <p role="status" className="rounded-lg border border-dashed border-border-strong p-4 text-sm text-muted-foreground">
        {t.idea.compareHint}
      </p>
    )
  }

  const rows: IdeaField[] = ['bigIdea', 'theme', 'territory', 'hook', 'message']
  const best = ideas[0].score >= ideas[1].score ? 0 : 1

  return (
    <section aria-label={t.idea.comparing} className="fx-rise overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">{t.idea.comparing}</caption>
        <thead>
          <tr className="border-b border-border bg-surface">
            <th scope="col" className="w-40 p-4 text-start text-xs font-medium text-muted-foreground">
              {t.idea.comparing}
            </th>
            {ideas.map((idea, i) => (
              <th key={idea.id} scope="col" className="p-4 text-start">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium">{t.engines.items[idea.engine].name}</span>
                  <span
                    className={cn('font-mono text-lg', i === best ? 'text-signal' : 'text-muted-foreground')}
                    dir="ltr"
                  >
                    {idea.score}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((field) => (
            <tr key={field} className="border-b border-border last:border-0">
              <th scope="row" className="p-4 text-start align-top text-xs font-normal text-muted-foreground">
                {t.idea.fields[field]}
              </th>
              {ideas.map((idea) => (
                <td
                  key={idea.id}
                  className={cn(
                    'p-4 align-top leading-relaxed',
                    field === 'bigIdea' && 'font-medium',
                    field === 'theme' && 'text-signal',
                  )}
                >
                  {idea[field]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export function IdeaStage() {
  const { state, t, actions } = useWorkspace()
  const generating = state.generation?.operation === 'ideas' ? state.generation : null
  const failedOp = state.error?.operation
  const busy = state.generation !== null
  const Arrow = state.locale === 'ar' ? ArrowLeft : ArrowRight

  const retry = () => {
    if (failedOp === 'ideas') actions.generateIdeas()
    else if (state.error?.targetId) actions.regenerateIdea(state.error.targetId)
  }

  return (
    <div className="flex flex-col gap-8">
      <StageHeader
        eyebrow={t.idea.eyebrow}
        title={t.idea.title}
        lede={t.idea.lede}
        aside={
          state.ideas.length > 0 && !generating ? (
            <div className="flex gap-2">
              <FxButton
                size="sm"
                variant={state.compareMode ? 'primary' : 'secondary'}
                aria-pressed={state.compareMode}
                onClick={() => actions.dispatch({ type: 'toggleCompareMode' })}
              >
                <Columns2 aria-hidden />
                {state.compareMode ? t.idea.compareOn : t.idea.compare}
              </FxButton>
              <FxButton size="sm" variant="ghost" disabled={busy} onClick={actions.generateIdeas}>
                <RotateCcw aria-hidden />
                {t.idea.regenerateAll}
              </FxButton>
            </div>
          ) : null
        }
      />

      {failedOp === 'ideas' || failedOp === 'regenerateIdea' || failedOp === 'refineIdea' ? (
        <GenerationError operation={failedOp} onRetry={retry} />
      ) : null}

      {generating ? (
        <GenerationProgress generation={generating}>
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <IdeaCardSkeleton key={i} />
            ))}
          </div>
        </GenerationProgress>
      ) : state.ideas.length === 0 ? (
        <EmptyStage
          title={t.idea.empty}
          hint={t.idea.emptyHint}
          action={
            state.strategy ? (
              <FxButton variant="primary" onClick={actions.generateIdeas}>
                <Sparkles aria-hidden />
                {t.idea.generate}
              </FxButton>
            ) : (
              <FxButton onClick={() => actions.goTo('strategy')}>{t.idea.goToStrategy}</FxButton>
            )
          }
        />
      ) : (
        <>
          {state.compareMode ? <CompareTable /> : null}
          <div className="grid gap-4 lg:grid-cols-3">
            {state.ideas.map((idea, i) => (
              <IdeaCard key={idea.id} idea={idea} index={i} />
            ))}
          </div>
        </>
      )}

      {state.selectedIdeaId && !generating ? (
        <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm md:-mx-10 md:px-10">
          <FxButton variant="primary" size="lg" disabled={busy} onClick={actions.generateScript}>
            <Sparkles aria-hidden />
            {state.script ? t.script.regenerate : t.idea.toScript}
            <Arrow aria-hidden />
          </FxButton>
        </div>
      ) : null}
    </div>
  )
}
