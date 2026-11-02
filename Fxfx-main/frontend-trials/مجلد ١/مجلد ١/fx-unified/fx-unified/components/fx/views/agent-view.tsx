'use client'

import { Check, Play } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { backend, type AgentRun } from '@/lib/fx/backend-api'
import { extraDictionaries } from '@/lib/fx/i18n-extra'
import { briefToText, conceptToIdea, insightToStrategy, scriptToScript } from '@/lib/fx/service/backend-service'
import { cn } from '@/lib/utils'
import { FxButton } from '../primitives'
import { useWorkspace } from '../workspace-provider'

const verdictTone = {
  ready: 'text-success border-success/50',
  'needs-review': 'text-signal border-signal/50',
  blocked: 'text-destructive border-destructive/50',
} as const

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h4>
      <ul className="space-y-1.5 text-sm">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AgentView({ onApplied }: { onApplied: () => void }) {
  const { state, actions } = useWorkspace()
  const a = extraDictionaries[state.locale].agent
  const [goal, setGoal] = useState(state.brief.project ? `${state.brief.project} — ${state.brief.objective}`.trim() : '')
  const [run, setRun] = useState<AgentRun | null>(null)
  const [history, setHistory] = useState<AgentRun[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [applied, setApplied] = useState(false)

  const load = useCallback(() => backend.agentRuns().then((r) => setHistory(r.runs)).catch(() => {}), [])
  useEffect(() => void load(), [load])

  const start = async () => {
    setBusy(true)
    setErr(null)
    setApplied(false)
    try {
      const r = await backend.agentRun({ goal, brief: briefToText(state.brief), language: state.locale })
      setRun(r)
      load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const adopt = () => {
    if (!run?.insight || !run.concept) return
    const idea = conceptToIdea(run.concept, state.engines[0] ?? 'provocation')
    actions.dispatch({ type: 'strategyReady', strategy: insightToStrategy(run.insight), tokens: 0 })
    actions.dispatch({ type: 'ideasReady', ideas: [idea], tokens: 0 })
    actions.dispatch({ type: 'selectIdea', id: idea.id })
    if (run.script) actions.dispatch({ type: 'scriptReady', script: scriptToScript(run.script, idea, state.locale), tokens: 0 })
    setApplied(true)
    onApplied()
  }

  const ev = run?.evaluation

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{a.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{a.desc}</p>
      </header>

      <section className="rounded-lg border border-border bg-surface p-4">
        <label htmlFor="agent-goal" className="mb-2 block text-xs font-medium text-muted-foreground">{a.goal}</label>
        <textarea
          id="agent-goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={a.goalPh}
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none focus-visible:border-ring"
        />
        <div className="mt-3 flex items-center gap-3">
          <FxButton variant="primary" disabled={busy || !goal.trim()} onClick={start}>
            <Play aria-hidden /> {busy ? a.running : a.run}
          </FxButton>
          {err ? <span role="alert" className="text-sm text-destructive">{err}</span> : null}
        </div>
      </section>

      {run ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {run.plan ? (
              <div className="space-y-4 rounded-lg border border-border p-4">
                <h2 className="text-sm font-semibold">{a.plan}</h2>
                <p className="text-sm text-muted-foreground">{run.plan.summary}</p>
                <List title={a.criteria} items={run.plan.acceptanceCriteria} />
                <List title={a.risks} items={run.plan.risks} />
              </div>
            ) : null}
            <div className="rounded-lg border border-border p-4">
              <h2 className="mb-3 text-sm font-semibold">{a.trace}</h2>
              <ol className="space-y-3 border-s border-border ps-4">
                {run.trace.map((t, i) => (
                  <li key={i} className="relative text-sm">
                    <span aria-hidden className="absolute -start-[21px] top-1.5 size-2 rounded-full bg-signal" />
                    <span className="font-mono text-[10px] uppercase text-muted-foreground" dir="ltr">{t.phase}</span>
                    <p>{t.message}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="space-y-5 rounded-lg border border-border bg-surface p-4 lg:self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{a.evaluation}</h2>
              <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">{run.mode}</span>
            </div>
            {ev ? (
              <>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-semibold tabular-nums" dir="ltr">{Math.round(ev.score <= 1 ? ev.score * 100 : ev.score)}</span>
                  <span className={cn('mb-1.5 rounded-full border px-2.5 py-0.5 text-xs', verdictTone[ev.verdict])}>{a.verdict[ev.verdict]}</span>
                </div>
                <List title={a.strengths} items={ev.strengths} />
                <List title={a.weaknesses} items={ev.weaknesses} />
                <List title={a.next} items={ev.nextActions} />
              </>
            ) : run.error ? (
              <p className="text-sm text-destructive">{run.error}</p>
            ) : null}
            <FxButton variant="signal" className="w-full" disabled={!run.concept || applied} onClick={adopt}>
              {applied ? <><Check aria-hidden /> {a.applied}</> : a.apply}
            </FxButton>
          </aside>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold">{a.history}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">{a.none}</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {history.slice(0, 8).map((h) => (
              <li key={h.runId} className="flex items-center gap-3 p-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{h.goal}</span>
                <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">{h.status}</span>
                {h.evaluation ? <span className="tabular-nums" dir="ltr">{Math.round(h.evaluation.score <= 1 ? h.evaluation.score * 100 : h.evaluation.score)}</span> : null}
                <FxButton size="sm" variant="ghost" onClick={() => { setRun(h); setApplied(false) }}>{a.open}</FxButton>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
