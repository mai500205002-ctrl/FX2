import { useEffect, useState, type ReactNode } from 'react'
import type { Ctx, EngineId, StepView } from '../content'
import { STEP_VIEWS } from '../content'

export const Label = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span className={`label ${className}`}>{children}</span>
)

export const Arrow = ({ className = '' }: { className?: string }) => (
  <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.2" className={`rtl:-scale-x-100 ${className}`} aria-hidden>
    <path d="M0 5h16M12 1l4 4-4 4" />
  </svg>
)

export function Btn({
  variant = 'ghost',
  children,
  onClick,
  className = '',
  arrow = false,
}: {
  variant?: 'primary' | 'ghost'
  children: ReactNode
  onClick?: () => void
  className?: string
  arrow?: boolean
}) {
  const v =
    variant === 'primary'
      ? 'bg-signal text-bg hover:bg-bone'
      : 'border border-rule-strong text-bone hover:border-bone hover:bg-bone/5'
  return (
    <button
      onClick={onClick}
      className={`group inline-flex h-11 cursor-pointer items-center gap-3 px-5 text-[13px] font-medium transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${v} ${className}`}
    >
      {children}
      {arrow && <Arrow className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />}
    </button>
  )
}

export function Editable({
  value,
  onChange,
  className = '',
  multiline = false,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  multiline?: boolean
}) {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      onBlur={(e) => {
        const v = e.currentTarget.textContent ?? ''
        if (v !== value) onChange(v)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className={`editable ${className}`}
    >
      {value}
    </span>
  )
}

export function Glyph({ id, size = 30 }: { id: EngineId; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 32 32', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }
  switch (id) {
    case 'provocation':
      return (
        <svg {...p} aria-hidden>
          <path d="M16 4 29 27H3z" />
          <circle cx="16" cy="21" r="1.6" fill="currentColor" />
          <path d="M16 11v6" />
        </svg>
      )
    case 'analogies':
      return (
        <svg {...p} aria-hidden>
          <circle cx="12" cy="16" r="9" />
          <circle cx="20" cy="16" r="9" />
        </svg>
      )
    case 'random':
      return (
        <svg {...p} aria-hidden>
          <rect x="4" y="4" width="24" height="24" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          <circle cx="22" cy="14" r="1.5" fill="currentColor" />
          <circle cx="13" cy="23" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'opposite':
      return (
        <svg {...p} aria-hidden>
          <circle cx="16" cy="16" r="12" />
          <path d="M16 4a12 12 0 0 1 0 24z" fill="currentColor" />
        </svg>
      )
    default:
      return (
        <svg {...p} aria-hidden>
          <path d="M4 4h24v8M28 20v8H4V4" />
          <path d="M18 14l10-6M20 22l8-4" />
        </svg>
      )
  }
}

export function Trace({ title, lines, live = false }: { title: string; lines: string[]; live?: boolean }) {
  const [n, setN] = useState(live ? 0 : lines.length)
  const key = lines.join('|')
  useEffect(() => {
    if (!live) {
      setN(lines.length)
      return
    }
    setN(0)
    const ids = lines.map((_, i) => setTimeout(() => setN(i + 1), (i + 1) * 650))
    return () => ids.forEach(clearTimeout)
  }, [live, key])
  const thinking = live && n < lines.length
  return (
    <div className="border-t border-rule pt-5">
      <div className="mb-4 flex items-center gap-2">
        <span className={`size-1.5 rounded-full bg-signal ${thinking ? 'pulse-dot' : ''}`} />
        <Label>{title}</Label>
      </div>
      <ol className="flex flex-col gap-3">
        {lines.slice(0, n).map((l, i) => (
          <li key={i} className="rise flex gap-3 text-[13px] leading-relaxed text-dim">
            <span className="label shrink-0 pt-px text-faint">0{i + 1}</span>
            <span>{l}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Stage({
  num,
  title,
  desc,
  trace,
  traceTitle,
  traceLive,
  children,
}: {
  num: string
  title: string
  desc: string
  trace: string[]
  traceTitle: string
  traceLive?: boolean
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-12 gap-x-10 px-6 pb-44 pt-12 lg:px-14">
      <aside className="col-span-12 mb-12 self-start lg:sticky lg:top-32 lg:col-span-3 lg:mb-0">
        <div
          className="font-display text-[7rem] font-light italic leading-[.8] text-transparent"
          style={{ WebkitTextStroke: '1px rgb(237 229 214 / 0.45)' }}
          aria-hidden
        >
          {num}
        </div>
        <h1 className="mt-7 font-display text-[2.4rem] leading-[1.05] tracking-[-0.01em] rtl:leading-[1.3]">{title}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-dim">{desc}</p>
        <div className="mt-10">
          <Trace title={traceTitle} lines={trace} live={traceLive} />
        </div>
      </aside>
      <div className="col-span-12 lg:col-span-9">{children}</div>
    </div>
  )
}

export function ActionBar({
  c,
  stage,
  onBack,
  onRegen,
  onNext,
  nextLabel,
}: {
  c: Ctx
  stage: StepView
  onBack?: () => void
  onRegen?: () => void
  onNext: () => void
  nextLabel: string
}) {
  const { t } = c
  const s = t.stages[stage]
  const idx = STEP_VIEWS.indexOf(stage) + 1
  const fields = [
    [t.ui.here, `${t.ui.stage} ${idx} / 6 · ${t.steps[idx - 1]}`],
    [t.ui.l_edit, s.editable],
    [t.ui.l_regen, s.regen],
    [t.ui.l_next, s.next],
  ]
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-bg/90 backdrop-blur-md">
      <div className="flex min-h-[76px] items-center justify-between gap-6 px-6 lg:px-14">
        <div className="hidden flex-1 grid-cols-4 gap-6 lg:grid">
          {fields.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <Label className="block">{k}</Label>
              <div className="mt-1 truncate text-[13px] text-bone">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-end gap-3 lg:flex-none">
          {onBack && (
            <Btn onClick={onBack} className="!px-4">
              <span className="rtl:-scale-x-100">←</span>
              <span className="hidden sm:inline">{t.ui.back}</span>
            </Btn>
          )}
          {onRegen && <Btn onClick={onRegen}>↻ {t.ui.regen}</Btn>}
          <Btn variant="primary" arrow onClick={onNext}>
            {nextLabel}
          </Btn>
        </div>
      </div>
    </div>
  )
}
