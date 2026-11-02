import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const fxButton = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/88',
        signal: 'bg-signal text-signal-foreground hover:bg-signal/90',
        secondary:
          'border border-border-strong bg-transparent text-foreground hover:bg-accent',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        quiet: 'text-muted-foreground hover:text-foreground',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-11 px-5 text-[15px]',
        icon: 'size-9',
        iconSm: 'size-8',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export function FxButton({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof fxButton>) {
  return <button type={type} className={cn(fxButton({ variant, size }), className)} {...props} />
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      dir="ltr"
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-strong px-1 font-mono text-[10px] text-muted-foreground',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'text-xs font-medium tracking-wide text-muted-foreground ltr:uppercase ltr:tracking-[0.14em]',
        className,
      )}
    >
      {children}
    </p>
  )
}

export function StageHeader({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow: string
  title: string
  lede?: string
  aside?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-2xl flex-col gap-3">
        <Eyebrow className="text-signal">{eyebrow}</Eyebrow>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          {title}
        </h1>
        {lede ? (
          <p className="text-pretty text-base leading-relaxed text-muted-foreground">{lede}</p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  )
}

export function SectionLabel({
  index,
  children,
  className,
}: {
  index?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {index ? (
        <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">
          {index}
        </span>
      ) : null}
      <span className="text-xs font-medium text-muted-foreground ltr:uppercase ltr:tracking-[0.12em]">
        {children}
      </span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  )
}

export function Meter({
  value,
  label,
  className,
  tone = 'default',
}: {
  value: number
  label: string
  className?: string
  tone?: 'default' | 'signal'
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-subtle', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          tone === 'signal' ? 'bg-signal' : 'bg-foreground/70',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('fx-skeleton rounded', className)} />
}
