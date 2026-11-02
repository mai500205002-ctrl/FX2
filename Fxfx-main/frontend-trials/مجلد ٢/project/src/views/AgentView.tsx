import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  Play,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Check,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  api,
  ApiError,
  type AgentStatusResponse,
  type AgentRunRecord,
} from '@/lib/api';

const PHASE_COLORS: Record<string, string> = {
  queued: 'text-base-400',
  planning: 'text-sky2-300',
  insight: 'text-signal-300',
  concept: 'text-ember-300',
  script: 'text-ember-300',
  evaluating: 'text-sky2-300',
  done: 'text-success',
  failed: 'text-error',
};

export default function AgentView() {
  const [status, setStatus] = useState<AgentStatusResponse | null>(null);
  const [runs, setRuns] = useState<AgentRunRecord[]>([]);
  const [selected, setSelected] = useState<AgentRunRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [goal, setGoal] = useState('');
  const [brief, setBrief] = useState('');
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([api.agentStatus(), api.agentRuns()]);
      setStatus(s);
      setRuns(r.runs);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load agent data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startRun = async () => {
    if (!goal.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const run = await api.agentRunCreate({ goal: goal.trim(), brief: brief.trim() || undefined });
      setSelected(run);
      setGoal('');
      setBrief('');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Agent run failed.');
    } finally {
      setRunning(false);
    }
  };

  const openRun = async (runId: string) => {
    try {
      const r = await api.agentRun(runId);
      setSelected(r.run);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load run.');
    }
  };

  return (
    <div className="h-full flex">
      {/* Left column: new run + list */}
      <div className="w-[400px] shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Bot size={18} className="text-signal-300" />
            <h2 className="font-display text-lg font-semibold">Agent</h2>
          </div>
          <p className="text-[12px] text-base-400 mt-1">
            Autonomous goal-driven runs through the full pipeline.
          </p>
        </div>

        <div className="p-5 border-b border-white/[0.06]">
          <label className="text-[12px] text-base-300 font-medium">Goal</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Create a campaign for a sleep tracker app"
            className="mt-1.5 w-full rounded-lg ring-hairline bg-base-950 px-3 py-2 text-sm text-base-100 placeholder:text-base-500 outline-none focus:ring-signal-300/30"
          />
          <label className="text-[12px] text-base-300 font-medium mt-3 block">Brief (optional)</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="Product, target, challenge…"
            className="mt-1.5 w-full resize-none rounded-lg ring-hairline bg-base-950 px-3 py-2 text-[13px] text-base-100 placeholder:text-base-500 outline-none focus:ring-signal-300/30"
          />
          <button
            onClick={startRun}
            disabled={!goal.trim() || running}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-signal-300 hover:bg-signal-200 disabled:opacity-50 text-base-950 font-medium text-sm px-3 py-2.5 transition-colors"
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {running ? 'Running…' : 'Start run'}
          </button>
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg ring-1 ring-error/30 bg-error/10 text-error text-[12px] px-3 py-2">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500">
            Runs · {runs.length}
          </span>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-[11px] text-base-400 hover:text-base-100 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading && runs.length === 0 && (
            <div className="text-center py-8 text-base-500 text-sm">Loading runs…</div>
          )}
          {!loading && runs.length === 0 && (
            <div className="text-center py-8 text-base-500 text-sm">No runs yet.</div>
          )}
          {runs.map((r) => (
            <button
              key={r.runId}
              onClick={() => openRun(r.runId)}
              className={cn(
                'w-full text-left rounded-lg p-3 transition-colors',
                selected?.runId === r.runId
                  ? 'bg-white/[0.06] ring-hairline'
                  : 'hover:bg-white/[0.03]',
              )}
            >
              <div className="text-[13px] font-medium truncate">{r.goal}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn('font-mono text-[10px] uppercase tracking-wider', PHASE_COLORS[r.status])}>
                  {r.status}
                </span>
                <span className="font-mono text-[10px] text-base-500">· {r.mode}</span>
                {r.evaluation && (
                  <span className="font-mono text-[10px] text-base-400">
                    · score {r.evaluation.score}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-base-500 mt-1 font-mono">
                {new Date(r.updatedAt).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right column: detail */}
      <div className="flex-1 min-w-0 overflow-auto">
        {!selected && (
          <div className="h-full grid place-items-center px-8">
            <div className="text-center">
              {status && (
                <div className="mb-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
                  <MiniStat label="Total" value={status.counts.totalRuns} />
                  <MiniStat label="Active" value={status.counts.activeRuns} />
                  <MiniStat label="Mode" value={status.mode} />
                </div>
              )}
              <Bot size={28} className="mx-auto text-base-600" />
              <div className="mt-3 text-sm text-base-400">Select a run to inspect, or start a new one.</div>
            </div>
          </div>
        )}
        {selected && <RunDetail run={selected} />}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl ring-hairline bg-base-900 p-3 text-center">
      <div className="font-display text-lg font-semibold tabular-nums">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-base-500 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function RunDetail({ run }: { run: AgentRunRecord }) {
  return (
    <div className="animate-appear max-w-3xl px-8 md:px-10 py-8">
      <div className="flex items-center gap-2.5">
        <span className={cn('font-mono text-[11px] uppercase tracking-[0.18em]', PHASE_COLORS[run.status])}>
          {run.status}
        </span>
        <span className="font-mono text-[11px] text-base-500">· {run.mode}</span>
        <span className="font-mono text-[11px] text-base-500">· {run.runId.slice(0, 8)}</span>
      </div>
      <h2 className="font-display text-2xl font-semibold mt-2 tracking-tight">{run.goal}</h2>
      {run.brief && <p className="text-[13px] text-base-400 mt-2 leading-relaxed">{run.brief}</p>}
      {run.error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg ring-1 ring-error/30 bg-error/10 text-error text-[13px] px-4 py-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{run.error}</span>
        </div>
      )}

      {run.plan && (
        <Block title="Execution plan">
          <div className="text-[13px] text-base-200 leading-relaxed">{run.plan.summary}</div>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <SubList title="Steps" items={run.plan.steps} />
            <SubList title="Acceptance" items={run.plan.acceptanceCriteria} />
            <SubList title="Risks" items={run.plan.risks} />
            <div className="rounded-lg bg-white/[0.02] p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-base-500">Estimate</div>
              <div className="text-[13px] text-base-200 mt-1">~{run.plan.estimatedMinutes} min</div>
            </div>
          </div>
        </Block>
      )}

      {run.insight && (
        <Block title="Insight">
          <p className="text-[13px] text-base-200 leading-relaxed">{run.insight.mainInsight}</p>
        </Block>
      )}
      {run.concept && (
        <Block title="Concept">
          <div className="font-display text-lg">{run.concept.title}</div>
          <div className="text-signal-300 italic mt-1">“{run.concept.tagline}”</div>
          <div className="text-[13px] text-base-300 mt-2 leading-relaxed">{run.concept.coreIdea}</div>
        </Block>
      )}
      {run.script && (
        <Block title="Script">
          <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-base-200">
            {run.script.script}
          </pre>
        </Block>
      )}

      {run.evaluation && (
        <Block title="Evaluation">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-display text-2xl font-semibold tabular-nums">{run.evaluation.score}</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider',
                run.evaluation.verdict === 'ready'
                  ? 'bg-success/15 text-success'
                  : run.evaluation.verdict === 'needs-review'
                    ? 'bg-warning/15 text-warning'
                    : 'bg-error/15 text-error',
              )}
            >
              {run.evaluation.verdict}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <SubList title="Strengths" items={run.evaluation.strengths} icon="+" />
            <SubList title="Weaknesses" items={run.evaluation.weaknesses} icon="!" />
          </div>
          <div className="mt-3">
            <SubList title="Next actions" items={run.evaluation.nextActions} icon="→" />
          </div>
        </Block>
      )}

      {run.trace?.length > 0 && (
        <Block title="Trace">
          <div className="space-y-1.5">
            {run.trace.map((t, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-3 py-2">
                <span className={cn('font-mono text-[10px] uppercase tracking-wider mt-0.5 shrink-0', PHASE_COLORS[t.phase])}>
                  {t.phase}
                </span>
                <span className="text-[12px] text-base-300 flex-1">{t.message}</span>
                <span className="font-mono text-[10px] text-base-500 mt-0.5 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(t.ts).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-xl2 ring-hairline bg-base-900 p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500 mb-3">{title}</div>
      {children}
    </div>
  );
}

function SubList({ title, items, icon = '•' }: { title: string; items: string[]; icon?: string }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-lg bg-white/[0.02] p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-base-500 mb-2">{title}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-[12px] text-base-300 leading-relaxed flex gap-2">
            <span className="text-signal-300">{icon}</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
