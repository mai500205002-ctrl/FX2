'use client'

import { ArrowLeft, ArrowRight, Plus, Sparkles } from 'lucide-react'
import { useId, useState } from 'react'
import { briefSuggestions } from '@/lib/fx/brief-suggestions'
import type { BriefField } from '@/lib/fx/types'
import { briefCompleteness, isBriefReady } from '@/lib/fx/workspace-reducer'
import { cn } from '@/lib/utils'
import { FxButton, Meter, SectionLabel, StageHeader } from '../primitives'
import { useWorkspace } from '../workspace-provider'

const groups: { key: 'identity' | 'mission' | 'ground'; fields: BriefField[] }[] = [
  { key: 'identity', fields: ['project', 'brand', 'product'] },
  { key: 'mission', fields: ['objective', 'audience', 'challenge'] },
  { key: 'ground', fields: ['context', 'requirements'] },
]

const singleLine: BriefField[] = ['project', 'brand', 'product']

function BriefFieldEditor({ field }: { field: BriefField }) {
  const { state, t, actions } = useWorkspace()
  const id = useId()
  const [focused, setFocused] = useState(false)
  const meta = t.brief.fields[field]
  const value = state.brief[field]
  const suggestions = briefSuggestions[state.locale][field] ?? []
  const isSingle = singleLine.includes(field)

  const insert = (text: string) => {
    const next = value.trim() ? `${value.trim()}\n${text}` : text
    actions.dispatch({ type: 'updateBrief', field, value: next })
  }

  const inputClass =
    'w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none'

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 rounded-lg border border-transparent px-4 py-3 transition-colors',
        'hover:bg-surface focus-within:border-border-strong focus-within:bg-surface',
      )}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false)
      }}
    >
      <label htmlFor={id} className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
        {value.trim() ? (
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
        ) : (
          <span aria-hidden className="size-1.5 rounded-full bg-border-strong" />
        )}
      </label>
      {isSingle ? (
        <input
          id={id}
          value={value}
          placeholder={meta.placeholder}
          onChange={(e) => actions.dispatch({ type: 'updateBrief', field, value: e.target.value })}
          className={cn(inputClass, field === 'project' && 'text-lg font-semibold')}
        />
      ) : (
        <textarea
          id={id}
          value={value}
          rows={3}
          placeholder={meta.placeholder}
          onChange={(e) => actions.dispatch({ type: 'updateBrief', field, value: e.target.value })}
          className={cn(inputClass, 'field-sizing-content min-h-[4.5rem]')}
        />
      )}
      {focused && suggestions.length > 0 ? (
        <div className="fx-rise flex flex-wrap items-center gap-2 pt-1">
          <span className="flex items-center gap-1 text-[11px] text-signal">
            <Sparkles className="size-3" aria-hidden />
            {t.brief.suggestions}
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => insert(s)}
              aria-label={`${t.brief.insertSuggestion}: ${s}`}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              <Plus className="size-3" aria-hidden />
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function BriefStage() {
  const { state, t, actions } = useWorkspace()
  const completeness = briefCompleteness(state.brief)
  const ready = isBriefReady(state.brief)
  const busy = state.generation !== null
  const Arrow = state.locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <div className="flex flex-col gap-10">
      <StageHeader
        eyebrow={t.brief.eyebrow}
        title={t.brief.title}
        lede={t.brief.lede}
        aside={
          <div className="flex w-56 flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">{t.brief.completeness}</span>
              <span className="font-mono text-sm" dir="ltr">
                {completeness}%
              </span>
            </div>
            <Meter value={completeness} label={t.brief.completeness} tone="signal" />
          </div>
        }
      />

      <div className="flex flex-col gap-10">
        {groups.map((group, gi) => (
          <section key={group.key} aria-labelledby={`brief-${group.key}`} className="flex flex-col gap-3">
            <SectionLabel index={`0${gi + 1}`}>
              <span id={`brief-${group.key}`}>{t.brief.groups[group.key]}</span>
            </SectionLabel>
            <div
              className={cn(
                'grid gap-1',
                group.key === 'identity' ? 'md:grid-cols-3' : 'md:grid-cols-2',
                group.key === 'mission' && 'lg:grid-cols-3',
              )}
            >
              {group.fields.map((field) => (
                <BriefFieldEditor key={field} field={field} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse items-stretch gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between md:-mx-10 md:px-10">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {ready ? null : t.brief.needMore}
        </p>
        <FxButton
          variant="primary"
          size="lg"
          disabled={!ready || busy}
          onClick={actions.generateStrategy}
        >
          <Sparkles aria-hidden />
          {state.strategy ? t.brief.regenerate : t.brief.generate}
          <Arrow aria-hidden />
        </FxButton>
      </div>
    </div>
  )
}
