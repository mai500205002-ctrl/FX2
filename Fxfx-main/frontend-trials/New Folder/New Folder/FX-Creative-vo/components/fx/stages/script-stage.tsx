'use client'

import { ChevronDown, ChevronUp, Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatTimecode } from '@/lib/fx/i18n'
import type { Scene, SceneField } from '@/lib/fx/types'
import { cn } from '@/lib/utils'
import { EmptyStage, GenerationError, GenerationProgress } from '../generation-progress'
import { FxButton, SectionLabel, Skeleton, StageHeader } from '../primitives'
import { useWorkspace } from '../workspace-provider'

const sceneFieldGroups: { fields: SceneField[] }[] = [
  { fields: ['action', 'visual', 'camera'] },
  { fields: ['dialogue', 'voiceover'] },
  { fields: ['music', 'sound'] },
]

function Timeline({
  scenes,
  activeId,
  onSelect,
}: {
  scenes: Scene[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const { t } = useWorkspace()
  const total = scenes.reduce((sum, s) => sum + s.duration, 0) || 1
  let cursor = 0

  return (
    <section aria-labelledby="timeline-label" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SectionLabel className="flex-1">
          <span id="timeline-label">{t.script.timeline}</span>
        </SectionLabel>
        <span className="ms-4 font-mono text-xs text-muted-foreground" dir="ltr">
          {t.script.total} {formatTimecode(total)}
        </span>
      </div>
      <ol className="flex h-14 w-full gap-0.5 overflow-hidden rounded-md">
        {scenes.map((scene, i) => {
          const start = cursor
          cursor += scene.duration
          const active = scene.id === activeId
          return (
            <li key={scene.id} style={{ flexGrow: scene.duration, flexBasis: 0 }} className="min-w-6">
              <button
                type="button"
                onClick={() => onSelect(scene.id)}
                aria-current={active ? 'true' : undefined}
                aria-label={`${t.script.scene} ${i + 1}: ${scene.scene} (${formatTimecode(start)}–${formatTimecode(cursor)})`}
                className={cn(
                  'flex h-full w-full flex-col justify-between overflow-hidden p-2 text-start transition-colors',
                  active
                    ? 'bg-signal text-signal-foreground'
                    : 'bg-subtle text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <span className="font-mono text-[10px] leading-none" dir="ltr">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-mono text-[10px] leading-none opacity-80" dir="ltr">
                  {formatTimecode(start)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function SceneRow({
  scene,
  index,
  start,
  expanded,
  isFirst,
  isLast,
  onToggle,
}: {
  scene: Scene
  index: number
  start: number
  expanded: boolean
  isFirst: boolean
  isLast: boolean
  onToggle: () => void
}) {
  const { t, actions } = useWorkspace()
  const panelId = `scene-panel-${scene.id}`
  const update = (patch: Partial<Omit<Scene, 'id'>>) =>
    actions.dispatch({ type: 'updateScene', id: scene.id, patch })

  return (
    <li
      id={`scene-${scene.id}`}
      className={cn(
        'scroll-mt-24 rounded-lg border transition-colors',
        expanded ? 'border-border-strong bg-surface' : 'border-border hover:border-border-strong',
      )}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex w-20 shrink-0 flex-col gap-1" dir="ltr">
          <span className="font-mono text-xs text-signal">{String(index + 1).padStart(2, '0')}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {formatTimecode(start)}–{formatTimecode(start + scene.duration)}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 flex-col items-start gap-1 text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span className="w-full truncate font-medium">{scene.scene || t.script.newScene}</span>
          {!expanded && scene.action ? (
            <span className="line-clamp-1 w-full text-sm text-muted-foreground">{scene.action}</span>
          ) : null}
          <span className="sr-only">{expanded ? t.script.collapse : t.script.expand}</span>
        </button>
        <ChevronDown
          aria-hidden
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
        />
      </div>

      {expanded ? (
        <div id={panelId} className="fx-rise flex flex-col gap-6 border-t border-border p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-muted-foreground">{t.script.fields.scene}</span>
              <input
                value={scene.scene}
                onChange={(e) => update({ scene: e.target.value })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-border-strong focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-muted-foreground">{t.script.duration}</span>
              <input
                type="number"
                min={1}
                max={120}
                dir="ltr"
                value={scene.duration}
                onChange={(e) =>
                  update({ duration: Math.max(1, Math.min(120, Number(e.target.value) || 1)) })
                }
                className="h-9 w-28 rounded-md border border-border bg-background px-3 font-mono text-sm focus:border-border-strong focus:outline-none"
              />
            </label>
          </div>

          {sceneFieldGroups.map((group, gi) => (
            <div
              key={gi}
              className={cn('grid gap-4', group.fields.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}
            >
              {group.fields.map((field) => (
                <label key={field} className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-muted-foreground ltr:uppercase ltr:tracking-[0.1em]">
                    {t.script.fields[field]}
                  </span>
                  <textarea
                    value={scene[field]}
                    rows={2}
                    onChange={(e) => update({ [field]: e.target.value })}
                    className={cn(
                      'field-sizing-content min-h-16 resize-none rounded-md border border-border bg-background p-3 text-sm leading-relaxed focus:border-border-strong focus:outline-none',
                      (field === 'dialogue' || field === 'voiceover') && 'italic',
                    )}
                  />
                </label>
              ))}
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <div className="flex gap-1">
              <FxButton
                variant="ghost"
                size="iconSm"
                disabled={isFirst}
                aria-label={t.script.moveUp}
                onClick={() => actions.dispatch({ type: 'moveScene', id: scene.id, direction: -1 })}
              >
                <ChevronUp aria-hidden />
              </FxButton>
              <FxButton
                variant="ghost"
                size="iconSm"
                disabled={isLast}
                aria-label={t.script.moveDown}
                onClick={() => actions.dispatch({ type: 'moveScene', id: scene.id, direction: 1 })}
              >
                <ChevronDown aria-hidden />
              </FxButton>
            </div>
            <div className="flex gap-2">
              <FxButton variant="ghost" size="sm" onClick={() => actions.addScene(scene.id)}>
                <Plus aria-hidden />
                {t.script.addScene}
              </FxButton>
              <FxButton
                variant="ghost"
                size="sm"
                className="hover:text-destructive"
                onClick={() => actions.dispatch({ type: 'removeScene', id: scene.id })}
              >
                <Trash2 aria-hidden />
                {t.script.deleteScene}
              </FxButton>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  )
}

function ScriptSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <Skeleton className="h-14 w-full rounded-md" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-4">
          <Skeleton className="h-8 w-16" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ScriptStage() {
  const { state, t, actions } = useWorkspace()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const generating = state.generation?.operation === 'script' ? state.generation : null
  const failed = state.error?.operation === 'script'
  const script = state.script
  const busy = state.generation !== null
  const activeId = expandedId ?? script?.scenes[0]?.id ?? null

  const focusScene = (id: string) => {
    setExpandedId(id)
    requestAnimationFrame(() =>
      document.getElementById(`scene-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  let cursor = 0

  return (
    <div className="flex flex-col gap-8">
      <StageHeader
        eyebrow={t.script.eyebrow}
        title={script?.title || t.script.title}
        lede={script?.logline}
        aside={
          script && !generating ? (
            <FxButton size="sm" variant="ghost" disabled={busy} onClick={actions.generateScript}>
              <RotateCcw aria-hidden />
              {t.script.regenerate}
            </FxButton>
          ) : null
        }
      />

      {failed ? <GenerationError operation="script" onRetry={actions.generateScript} /> : null}

      {generating ? (
        <GenerationProgress generation={generating}>
          <ScriptSkeleton />
        </GenerationProgress>
      ) : !script ? (
        <EmptyStage
          title={t.script.empty}
          hint={t.script.emptyHint}
          action={
            state.selectedIdeaId ? (
              <FxButton variant="primary" onClick={actions.generateScript}>
                <Sparkles aria-hidden />
                {t.script.generate}
              </FxButton>
            ) : (
              <FxButton onClick={() => actions.goTo('idea')}>{t.script.goToIdea}</FxButton>
            )
          }
        />
      ) : (
        <div className="fx-rise flex flex-col gap-8">
          {script.scenes.length > 0 ? (
            <Timeline scenes={script.scenes} activeId={activeId} onSelect={focusScene} />
          ) : null}
          <ol className="flex flex-col gap-2">
            {script.scenes.map((scene, i) => {
              const start = cursor
              cursor += scene.duration
              return (
                <SceneRow
                  key={scene.id}
                  scene={scene}
                  index={i}
                  start={start}
                  expanded={scene.id === activeId}
                  isFirst={i === 0}
                  isLast={i === script.scenes.length - 1}
                  onToggle={() => setExpandedId(scene.id === activeId ? '' : scene.id)}
                />
              )
            })}
          </ol>
          <FxButton variant="secondary" className="self-start" onClick={() => actions.addScene()}>
            <Plus aria-hidden />
            {t.script.addScene}
          </FxButton>
        </div>
      )}
    </div>
  )
}
