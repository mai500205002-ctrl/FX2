import type { BriefData, Ctx } from '../content'
import { ActionBar, Label, Stage } from '../components/ui'

export default function Brief({ c }: { c: Ctx }) {
  const { t, work, setWork, go } = c
  const b = work.brief
  const set = (k: keyof BriefData, v: string) => setWork((w) => ({ ...w, brief: { ...w.brief, [k]: v } }))
  const filled = [b.client, b.objective, b.audience, b.tone, b.constraint].filter((x) => x.trim()).length + (b.text.length > 80 ? 1 : 0)
  const fields: [keyof BriefData, string][] = [
    ['client', t.ui.bf_client],
    ['objective', t.ui.bf_obj],
    ['audience', t.ui.bf_aud],
    ['tone', t.ui.bf_tone],
  ]
  return (
    <>
      <Stage num="01" title={t.stages.brief.title} desc={t.stages.brief.desc} trace={t.briefTrace} traceTitle={t.ui.trace_title}>
        <div className="mb-3 flex items-center justify-between">
          <Label>{t.ui.bf_text}</Label>
          <div className="flex items-center gap-3">
            <Label>{t.ui.strength}</Label>
            <div className="flex gap-1" aria-label={`${filled}/6`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className={`h-1 w-5 transition-colors duration-500 ${i < filled ? 'bg-signal' : 'bg-rule-strong'}`} />
              ))}
            </div>
          </div>
        </div>
        <textarea
          value={b.text}
          onChange={(e) => set('text', e.target.value)}
          placeholder={t.ui.bf_ph}
          rows={6}
          className="w-full resize-none border-y border-rule bg-transparent py-8 font-display text-[clamp(1.4rem,2.5vw,2.2rem)] font-light leading-[1.35] text-bone outline-none transition-colors placeholder:text-faint focus:border-signal"
        />
        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2">
          {fields.map(([k, label]) => (
            <label key={k} className="block">
              <Label className="block">{label}</Label>
              <input className="field" value={b[k]} onChange={(e) => set(k, e.target.value)} />
            </label>
          ))}
          <label className="block md:col-span-2">
            <Label className="block">{t.ui.bf_con}</Label>
            <input className="field" value={b.constraint} onChange={(e) => set('constraint', e.target.value)} />
          </label>
        </div>
      </Stage>
      <ActionBar c={c} stage="brief" onNext={() => go('engines')} nextLabel={t.steps[1]} />
    </>
  )
}
