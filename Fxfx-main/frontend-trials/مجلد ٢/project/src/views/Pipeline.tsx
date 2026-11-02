import { useCallback, useState } from 'react';
import {
  Workflow,
  Sparkles,
  Lightbulb,
  Target,
  Film,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Download,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  api,
  ApiError,
  type InsightResponse,
  type ConceptResponse,
  type ScriptResponse,
} from '@/lib/api';
import type { StudioSeed } from '@/views/Studio';

type StageId = 'brief' | 'insight' | 'concept' | 'script';

const STAGES: { id: StageId; label: string; icon: typeof Sparkles; hint: string }[] = [
  { id: 'brief', label: 'Brief', icon: Sparkles, hint: 'Define the challenge' },
  { id: 'insight', label: 'Insight', icon: Lightbulb, hint: '5 lateral thinking techniques' },
  { id: 'concept', label: 'Concept', icon: Target, hint: 'Cognitive shift + metaphor' },
  { id: 'script', label: 'Script', icon: Film, hint: '3-beat screenplay' },
];

interface Props {
  onOpenStudio: (s: StudioSeed) => void;
}

export default function Pipeline({ onOpenStudio }: Props) {
  const [stage, setStage] = useState<StageId>('brief');
  const [brief, setBrief] = useState('');
  const [archetype, setArchetype] = useState('');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [concept, setConcept] = useState<ConceptResponse | null>(null);
  const [script, setScript] = useState<ScriptResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runStage = useCallback(async (target: StageId) => {
    setError(null);
    setLoading(true);
    try {
      if (target === 'insight') {
        const r = await api.generateInsight({ brief, archetype: archetype || undefined, language });
        setInsight(r);
        setConcept(null);
        setScript(null);
      } else if (target === 'concept') {
        if (!insight) throw new Error('Generate the insight first.');
        const r = await api.mapConcept({ insight, archetype: archetype || undefined, language });
        setConcept(r);
        setScript(null);
      } else if (target === 'script') {
        if (!concept) throw new Error('Generate the concept first.');
        const r = await api.writeScript({ concept, archetype: archetype || undefined, language });
        setScript(r);
      }
      setStage(target);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Request failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [brief, archetype, language, insight, concept]);

  const reset = () => {
    setStage('brief');
    setInsight(null);
    setConcept(null);
    setScript(null);
    setError(null);
  };

  const currentIndex = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="h-full flex flex-col">
      {/* Stage rail */}
      <div className="border-b border-white/[0.06] px-8 py-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Workflow size={18} className="text-signal-300" />
          <h2 className="font-display text-xl font-semibold tracking-tight">Creative Pipeline</h2>
          <span className="font-mono text-[11px] text-base-500 uppercase tracking-[0.16em] ml-2">
            Brief → Insight → Concept → Script
          </span>
        </div>
        <div className="flex items-center gap-2">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const done =
              (s.id === 'insight' && insight) ||
              (s.id === 'concept' && concept) ||
              (s.id === 'script' && script);
            const active = s.id === stage;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => (s.id === 'brief' || done ? setStage(s.id) : undefined)}
                  disabled={s.id !== 'brief' && !done}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors flex-1 text-left',
                    active
                      ? 'bg-white/[0.06] ring-hairline'
                      : done
                        ? 'hover:bg-white/[0.03]'
                        : 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn(
                      'h-7 w-7 rounded-lg grid place-items-center shrink-0',
                      active
                        ? 'bg-signal-300 text-base-950'
                        : done
                          ? 'bg-success/15 text-success'
                          : 'bg-white/[0.04] text-base-400',
                    )}
                  >
                    {done && !active ? <Check size={14} /> : <Icon size={14} />}
                  </span>
                  <div className="min-w-0">
                    <div className={cn('text-[13px] font-medium leading-tight', active && 'text-base-50')}>
                      {s.label}
                    </div>
                    <div className="text-[11px] text-base-500 leading-tight truncate">{s.hint}</div>
                  </div>
                </button>
                {i < STAGES.length - 1 && (
                  <ArrowRight size={14} className="text-base-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage body */}
      <div className="flex-1 min-h-0 overflow-auto">
        {stage === 'brief' && (
          <BriefStage
            brief={brief}
            setBrief={setBrief}
            archetype={archetype}
            setArchetype={setArchetype}
            language={language}
            setLanguage={setLanguage}
            onRun={() => runStage('insight')}
            loading={loading}
            error={error}
          />
        )}
        {stage === 'insight' && (
          <InsightStage
            data={insight}
            loading={loading}
            error={error}
            onRun={() => runStage('concept')}
            onBack={() => setStage('brief')}
          />
        )}
        {stage === 'concept' && (
          <ConceptStage
            data={concept}
            loading={loading}
            error={error}
            onRun={() => runStage('script')}
            onBack={() => setStage('insight')}
          />
        )}
        {stage === 'script' && (
          <ScriptStage
            data={script}
            conceptTitle={concept?.title}
            tagline={concept?.tagline}
            onOpenStudio={onOpenStudio}
            onBack={() => setStage('concept')}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

// ── Brief stage ───────────────────────────────────────────────────────────────

function BriefStage({
  brief,
  setBrief,
  archetype,
  setArchetype,
  language,
  setLanguage,
  onRun,
  loading,
  error,
}: {
  brief: string;
  setBrief: (v: string) => void;
  archetype: string;
  setArchetype: (v: string) => void;
  language: 'en' | 'ar';
  setLanguage: (v: 'en' | 'ar') => void;
  onRun: () => void;
  loading: boolean;
  error: string | null;
}) {
  const examples = [
    'Product: Water reminder app + smart bottle. Target: Urban professionals 25-40. Challenge: People know water is important but forget in daily rush. Goal: Make hydration irresistible.',
    'Product: Premium noise-cancelling headphones. Target: Remote workers. Challenge: Open-plan homes are noisy. Goal: Position silence as a productivity superpower.',
    'Product: Plant-based meal kit. Target: Busy parents. Challenge: Healthy eating feels like a chore. Goal: Make plant-based feel like a treat, not a task.',
  ];

  return (
    <div className="animate-appear max-w-3xl px-8 md:px-12 py-10">
      <SectionTitle
        icon={Sparkles}
        title="Write the brief"
        subtitle="Describe the product, target, challenge, and goal. The backend applies 5 lateral thinking techniques."
      />

      <div className="mt-6 rounded-xl2 ring-hairline bg-base-900 p-5">
        <label className="text-[12px] text-base-300 font-medium">Brief</label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Product: …  Target: …  Challenge: …  Goal: …"
          rows={8}
          className="mt-2 w-full resize-none rounded-xl ring-hairline bg-base-950 p-4 text-sm text-base-100 placeholder:text-base-500 outline-none focus:ring-signal-300/30 font-body leading-relaxed"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[11px] text-base-500">{brief.length} chars</span>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
              className="rounded-lg ring-hairline bg-base-950 px-2.5 py-1.5 text-[12px] font-mono text-base-200 outline-none"
            >
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
            <input
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
              placeholder="archetype (optional)"
              className="w-44 rounded-lg ring-hairline bg-base-950 px-3 py-1.5 text-[12px] font-mono text-base-200 outline-none placeholder:text-base-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500 mb-2">
          Example briefs
        </div>
        <div className="space-y-2">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setBrief(ex)}
              className="block w-full text-left rounded-lg ring-hairline bg-base-900 hover:bg-base-850 px-4 py-3 text-[12px] text-base-300 leading-relaxed transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <ErrorRow error={error} />

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onRun}
          disabled={!brief.trim() || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-signal-300 hover:bg-signal-200 disabled:opacity-50 text-base-950 font-medium text-sm px-4 py-2.5 transition-colors shadow-signal"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
          {loading ? 'Generating insight…' : 'Generate Insight'}
          {!loading && <ArrowRight size={15} />}
        </button>
      </div>
    </div>
  );
}

// ── Insight stage ─────────────────────────────────────────────────────────────

function InsightStage({
  data,
  loading,
  error,
  onRun,
  onBack,
}: {
  data: InsightResponse | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
  onBack: () => void;
}) {
  if (loading && !data) return <LoadingBlock label="Running 5 lateral thinking techniques…" />;
  if (!data) return <EmptyBlock label="No insight yet. Go back and run the brief." onBack={onBack} />;

  const lt = data.lateralThinkingBreakdown;
  const techniques = [
    { name: 'Provocation', body: lt.provocation?.provocation, opp: lt.provocation?.opportunity },
    { name: 'Analogies', body: lt.analogies?.map((a) => `${a.sourceField}: ${a.metaphor}`).join(' · ') },
    { name: 'Random Stimulus', body: lt.randomStimulus?.unexpectedAngle, word: lt.randomStimulus?.randomWord },
    { name: 'Opposite Thinking', body: lt.oppositeThinking?.paradox, mid: lt.oppositeThinking?.desirableMiddle },
    { name: 'Constraint Reversal', body: lt.constraintReversal?.reversal, opp: lt.constraintReversal?.opportunity },
  ];

  return (
    <div className="animate-appear max-w-4xl px-8 md:px-12 py-10">
      <SectionTitle icon={Lightbulb} title="Insight" subtitle={data.creativeMethod} />

      <div className="mt-6 rounded-xl2 ring-hairline bg-gradient-to-br from-signal-300/[0.06] to-transparent p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal-300 mb-2">
          Main insight
        </div>
        <p className="font-display text-xl leading-relaxed text-balance">{data.mainInsight}</p>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-3">
        <Card title="Metaphoric framing" body={data.metaphoricFraming} />
        <Card title="Emotional truth" body={data.emotionalTruth} />
      </div>

      <div className="mt-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500 mb-3">
          Lateral thinking breakdown
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {techniques.map((t) => (
            <div key={t.name} className="rounded-xl ring-hairline bg-base-900 p-4">
              <div className="text-[13px] font-medium text-signal-300">{t.name}</div>
              {t.body && <div className="text-[13px] text-base-200 mt-1.5 leading-relaxed">{t.body}</div>}
              {t.word && (
                <div className="text-[11px] text-base-500 mt-1 font-mono">word: {t.word}</div>
              )}
              {t.opp && <div className="text-[12px] text-base-400 mt-1.5">→ {t.opp}</div>}
              {t.mid && <div className="text-[12px] text-base-400 mt-1.5">middle: {t.mid}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-3">
        <ListCard title="Constraints" items={data.constraints} />
        <ListCard title="Opportunities" items={data.opportunities} />
      </div>

      <ErrorRow error={error} />

      <StageNav
        onBack={onBack}
        onNext={onRun}
        nextLabel="Map to Concept"
        nextIcon={Target}
        loading={loading}
      />
    </div>
  );
}

// ── Concept stage ─────────────────────────────────────────────────────────────

function ConceptStage({
  data,
  loading,
  error,
  onRun,
  onBack,
}: {
  data: ConceptResponse | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
  onBack: () => void;
}) {
  if (loading && !data) return <LoadingBlock label="Mapping insight to creative concept…" />;
  if (!data) return <EmptyBlock label="No concept yet. Go back and generate it." onBack={onBack} />;

  return (
    <div className="animate-appear max-w-4xl px-8 md:px-12 py-10">
      <SectionTitle icon={Target} title="Concept" subtitle="Cognitive shift + metaphor strategy" />

      <div className="mt-6 rounded-xl2 ring-hairline bg-gradient-to-br from-sky2-400/[0.07] to-transparent p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sky2-300 mb-2">Title</div>
        <h3 className="font-display text-2xl font-semibold">{data.title}</h3>
        <div className="mt-3 font-display text-lg text-signal-300 italic">“{data.tagline}”</div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-3">
        <Card title="Core idea" body={data.coreIdea} />
        <Card title="Creative device" body={data.creativeDevice} />
        <Card title="Emotional arc" body={data.emotionalArc} />
        <Card title="Target paradox" body={data.targetParadox} />
      </div>
      <div className="mt-3">
        <Card title="Visual notes" body={data.visualNotes} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.lateralThinkingTechniques.map((t) => (
          <span key={t} className="rounded-full ring-hairline bg-white/[0.03] px-3 py-1 text-[11px] font-mono text-base-300">
            {t}
          </span>
        ))}
      </div>

      <ErrorRow error={error} />
      <StageNav onBack={onBack} onNext={onRun} nextLabel="Write Script" nextIcon={Film} loading={loading} />
    </div>
  );
}

// ── Script stage ──────────────────────────────────────────────────────────────

function ScriptStage({
  data,
  conceptTitle,
  tagline,
  onOpenStudio,
  onBack,
  onReset,
}: {
  data: ScriptResponse | null;
  conceptTitle?: string;
  tagline?: string;
  onOpenStudio: (s: StudioSeed) => void;
  onBack: () => void;
  onReset: () => void;
}) {
  if (!data) return <EmptyBlock label="No script yet. Go back and generate it." onBack={onBack} />;

  const download = () => {
    const blob = new Blob([data.script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textfx-${(conceptTitle || 'script').replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-appear max-w-4xl px-8 md:px-12 py-10">
      <SectionTitle icon={Film} title="Script" subtitle="3-beat emotional screenplay" />

      <div className="mt-6 rounded-xl2 ring-hairline bg-base-950 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500">
            Screenplay
          </div>
          <button
            onClick={download}
            className="inline-flex items-center gap-2 rounded-lg ring-hairline bg-white/[0.04] hover:bg-white/[0.07] text-base-200 text-[12px] px-3 py-1.5 transition-colors"
          >
            <Download size={13} /> .txt
          </button>
        </div>
        <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-base-200">
          {data.script}
        </pre>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-3">
        {data.beats.map((b, i) => (
          <div key={i} className="rounded-xl ring-hairline bg-base-900 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal-300">
              Beat {i + 1}
            </div>
            <div className="text-[13px] text-base-200 mt-1.5 leading-relaxed">{b}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-3">
        <Card title="Camera language" body={data.cameraLanguage} />
        <Card title="Narrative strategy" body={data.narrativeStrategy} />
        <Card title="Emotional turning" body={data.emotionalTurning} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl ring-hairline bg-white/[0.03] hover:bg-white/[0.06] text-base-200 text-sm px-4 py-2.5 transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <button
          onClick={() =>
            onOpenStudio({ effectId: 'neon', text: tagline || conceptTitle || 'TEXTFX' })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-signal-300 hover:bg-signal-200 text-base-950 font-medium text-sm px-4 py-2.5 transition-colors"
        >
          <Sparkles size={15} /> Send tagline to FX Studio
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl ring-hairline bg-white/[0.02] hover:bg-white/[0.05] text-base-300 hover:text-base-100 text-sm px-4 py-2.5 transition-colors"
        >
          <RotateCcw size={15} /> New brief
        </button>
      </div>
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Sparkles; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-signal-300/10 ring-hairline grid place-items-center shrink-0">
        <Icon size={18} className="text-signal-300" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-[13px] text-base-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function Card({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <div className="rounded-xl ring-hairline bg-base-900 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500">{title}</div>
      <div className="text-[13px] text-base-200 mt-1.5 leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-xl ring-hairline bg-base-900 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-base-500">{title}</div>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-[13px] text-base-200 leading-relaxed flex gap-2">
            <span className="text-signal-300 mt-1">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="h-full grid place-items-center px-8">
      <div className="text-center">
        <Loader2 size={28} className="mx-auto text-signal-300 animate-spin" />
        <div className="mt-4 text-sm text-base-300">{label}</div>
        <div className="text-[11px] text-base-500 mt-1 font-mono">Calling the TEXTFX backend…</div>
      </div>
    </div>
  );
}

function EmptyBlock({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div className="h-full grid place-items-center px-8">
      <div className="text-center">
        <div className="text-sm text-base-300">{label}</div>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 rounded-lg ring-hairline bg-white/[0.04] hover:bg-white/[0.07] text-base-200 text-sm px-3 py-2 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    </div>
  );
}

function ErrorRow({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="mt-5 flex items-start gap-2 rounded-lg ring-1 ring-error/30 bg-error/10 text-error text-[13px] px-4 py-3">
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <div>
        <div className="font-medium">Backend call failed</div>
        <div className="text-[12px] opacity-90 mt-0.5">{error}</div>
        <div className="text-[11px] opacity-70 mt-1 font-mono">
          Is the TEXTFX backend running at {api.base}?
        </div>
      </div>
    </div>
  );
}

function StageNav({
  onBack,
  onNext,
  nextLabel,
  nextIcon: NextIcon,
  loading,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon: typeof Sparkles;
  loading: boolean;
}) {
  return (
    <div className="mt-8 flex items-center gap-3">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl ring-hairline bg-white/[0.03] hover:bg-white/[0.06] text-base-200 text-sm px-4 py-2.5 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <button
        onClick={onNext}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-signal-300 hover:bg-signal-200 disabled:opacity-60 text-base-950 font-medium text-sm px-4 py-2.5 transition-colors shadow-signal"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <NextIcon size={15} />}
        {loading ? 'Working…' : nextLabel}
        {!loading && <ArrowRight size={14} />}
      </button>
    </div>
  );
}
