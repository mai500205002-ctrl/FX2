'use client'

import { Bot, Command, Download, Gauge, Moon, PanelRight, Search, Sun } from 'lucide-react'
import { useState } from 'react'
import { exportJson, exportMarkdown } from '@/lib/fx/export'
import { extraDictionaries } from '@/lib/fx/i18n-extra'
import type { ViewId } from './app-shell'
import { cn } from '@/lib/utils'
import { useStepLabel } from './generation-progress'
import { FxButton, Kbd } from './primitives'
import { useWorkspace } from './workspace-provider'

function SaveIndicator() {
  const { state, t } = useWorkspace()
  const tone = {
    saved: 'bg-success',
    saving: 'bg-muted-foreground animate-pulse',
    unsaved: 'bg-signal',
    error: 'bg-destructive',
  }[state.saveStatus]
  return (
    <span role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span aria-hidden className={cn('size-1.5 rounded-full', tone)} />
      <span className="hidden sm:inline">{t.save[state.saveStatus]}</span>
      <span className="sr-only sm:hidden">{t.save[state.saveStatus]}</span>
    </span>
  )
}

function AiStatus() {
  const { state, t } = useWorkspace()
  const stepLabel = useStepLabel()
  const working = state.generation !== null
  return (
    <div
      className={cn(
        'hidden h-8 items-center gap-2 rounded-full border px-3 text-xs md:flex',
        working ? 'border-signal/50 text-foreground' : 'border-border text-muted-foreground',
      )}
      aria-label={t.ai.label}
    >
      <span aria-hidden className="relative flex size-2">
        {working ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-signal opacity-60" />
        ) : null}
        <span className={cn('relative size-2 rounded-full', working ? 'bg-signal' : 'bg-success')} />
      </span>
      <span className="max-w-48 truncate">
        {working && state.generation
          ? stepLabel(state.generation.steps[state.generation.stepIndex])
          : t.ai.idle}
      </span>
    </div>
  )
}

export function CommandBar({ view, setView }: { view: ViewId; setView: (v: ViewId) => void }) {
  const { state, t, actions } = useWorkspace()
  const x = extraDictionaries[state.locale]
  const [exportOpen, setExportOpen] = useState(false)
  const project = {
    id: state.projectId, brief: state.brief, strategy: state.strategy, ideas: state.ideas,
    selectedIdeaId: state.selectedIdeaId, script: state.script, engines: state.engines, locale: state.locale,
  }
  const hasContent = !!state.strategy || state.ideas.length > 0
  const panelVisible = state.panelOpen || state.mobilePanelOpen

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground font-mono text-xs font-bold text-background"
          dir="ltr"
          aria-label={`${t.app.name} — ${t.app.tagline}`}
          role="img"
        >
          FX
        </span>
        <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="sr-only">{t.bar.project}: </span>
          <span className="truncate text-sm font-medium">
            {state.brief.project || t.bar.project}
          </span>
        </div>
        <SaveIndicator />
      </div>

      <div className="flex flex-1 justify-center">
        <button
          type="button"
          onClick={() => actions.dispatch({ type: 'setPaletteOpen', open: true })}
          aria-haspopup="dialog"
          className="hidden h-8 w-full max-w-xs items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground lg:flex"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="flex-1 text-start">{t.palette.placeholder}</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <AiStatus />
        <FxButton variant="ghost" size="iconSm" aria-label={x.nav.agent} title={x.nav.agent}
          className={cn(view === 'agent' && 'text-foreground bg-accent')}
          onClick={() => setView(view === 'agent' ? 'workspace' : 'agent')}><Bot aria-hidden /></FxButton>
        <FxButton variant="ghost" size="iconSm" aria-label={x.nav.control} title={x.nav.control}
          className={cn(view === 'control' && 'text-foreground bg-accent')}
          onClick={() => setView(view === 'control' ? 'workspace' : 'control')}><Gauge aria-hidden /></FxButton>
        <div className="relative">
          <FxButton variant="ghost" size="iconSm" aria-label={x.export.label} title={x.export.label}
            aria-expanded={exportOpen} onClick={() => setExportOpen((o) => !o)}><Download aria-hidden /></FxButton>
          {exportOpen ? (
            <div role="menu" className="absolute end-0 top-9 z-30 w-44 rounded-md border border-border bg-surface p-1 text-sm shadow-lg"
              onMouseLeave={() => setExportOpen(false)}>
              {hasContent ? (
                <>
                  <button role="menuitem" className="w-full rounded px-3 py-2 text-start hover:bg-accent" onClick={() => { exportMarkdown(project); setExportOpen(false) }}>{x.export.md}</button>
                  <button role="menuitem" className="w-full rounded px-3 py-2 text-start hover:bg-accent" onClick={() => { exportJson(project); setExportOpen(false) }}>{x.export.json}</button>
                </>
              ) : <p className="px-3 py-2 text-xs text-muted-foreground">{x.export.empty}</p>}
            </div>
          ) : null}
        </div>
        <FxButton
          variant="ghost"
          size="iconSm"
          className="lg:hidden"
          aria-label={t.bar.commands}
          onClick={() => actions.dispatch({ type: 'setPaletteOpen', open: true })}
        >
          <Command aria-hidden />
        </FxButton>
        <FxButton
          variant="ghost"
          size="sm"
          onClick={actions.toggleLocale}
          aria-label={t.bar.languageLabel}
          lang={state.locale === 'ar' ? 'en' : 'ar'}
        >
          {t.bar.language}
        </FxButton>
        <FxButton
          variant="ghost"
          size="iconSm"
          onClick={actions.toggleTheme}
          aria-label={state.theme === 'dark' ? t.bar.themeLight : t.bar.themeDark}
        >
          {state.theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </FxButton>
        <FxButton
          variant="ghost"
          size="iconSm"
          onClick={actions.togglePanel}
          aria-label={t.bar.togglePanel}
          aria-controls="ai-panel"
          aria-expanded={panelVisible}
          className={cn(panelVisible && 'text-foreground')}
        >
          <PanelRight aria-hidden className="rtl:-scale-x-100" />
        </FxButton>
      </div>
    </header>
  )
}
