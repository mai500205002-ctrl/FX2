'use client'

import {
  Columns2,
  FileText,
  Film,
  Languages,
  Lightbulb,
  PanelRight,
  Search,
  SunMoon,
  Target,
  Bot,
  Gauge,
  type LucideIcon,
} from 'lucide-react'
import { extraDictionaries } from '@/lib/fx/i18n-extra'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { StageId } from '@/lib/fx/types'
import { isBriefReady, stageOrder } from '@/lib/fx/workspace-reducer'
import { cn } from '@/lib/utils'
import { Kbd } from './primitives'
import { useWorkspace } from './workspace-provider'

interface PaletteCommand {
  id: string
  group: 'navigate' | 'actions' | 'preferences'
  label: string
  icon: LucideIcon
  run: () => void
  shortcut?: string
}

const stageIcons: Record<StageId, LucideIcon> = {
  brief: FileText,
  strategy: Target,
  idea: Lightbulb,
  script: Film,
}

export function CommandPalette() {
  const { state, t, actions } = useWorkspace()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const open = state.paletteOpen
  const close = () => actions.dispatch({ type: 'setPaletteOpen', open: false })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        actions.dispatch({ type: 'setPaletteOpen', open: !state.paletteOpen })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actions, state.paletteOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const commands = useMemo<PaletteCommand[]>(() => {
    const busy = state.generation !== null
    const list: PaletteCommand[] = stageOrder.map((stage, i) => ({
      id: `go-${stage}`,
      group: 'navigate',
      label: `${t.palette.goTo} ${t.stages[stage].label}`,
      icon: stageIcons[stage],
      run: () => actions.goTo(stage),
      shortcut: String(i + 1),
    }))
    const nav = extraDictionaries[state.locale].nav
    const go = (v: string) => () => window.dispatchEvent(new CustomEvent('fx:view', { detail: v }))
    list.push(
      { id: 'view-agent', group: 'navigate', label: nav.agent, icon: Bot, run: go('agent') },
      { id: 'view-control', group: 'navigate', label: nav.control, icon: Gauge, run: go('control') },
    )
    if (!busy && isBriefReady(state.brief))
      list.push({
        id: 'gen-strategy',
        group: 'actions',
        label: state.strategy ? t.brief.regenerate : t.brief.generate,
        icon: Target,
        run: actions.generateStrategy,
      })
    if (!busy && state.strategy)
      list.push({
        id: 'gen-ideas',
        group: 'actions',
        label: state.ideas.length ? t.idea.regenerateAll : t.strategy.generate,
        icon: Lightbulb,
        run: actions.generateIdeas,
      })
    if (state.ideas.length > 1)
      list.push({
        id: 'compare',
        group: 'actions',
        label: state.compareMode ? t.idea.compareOn : t.idea.compare,
        icon: Columns2,
        run: () => {
          actions.goTo('idea')
          actions.dispatch({ type: 'toggleCompareMode' })
        },
      })
    if (!busy && state.selectedIdeaId)
      list.push({
        id: 'gen-script',
        group: 'actions',
        label: state.script ? t.script.regenerate : t.script.generate,
        icon: Film,
        run: actions.generateScript,
      })
    list.push(
      {
        id: 'lang',
        group: 'preferences',
        label: t.palette.toggleLanguage,
        icon: Languages,
        run: actions.toggleLocale,
      },
      {
        id: 'theme',
        group: 'preferences',
        label: t.palette.toggleTheme,
        icon: SunMoon,
        run: actions.toggleTheme,
      },
      {
        id: 'panel',
        group: 'preferences',
        label: t.palette.togglePanel,
        icon: PanelRight,
        run: actions.togglePanel,
      },
    )
    return list
  }, [state, t, actions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands
  }, [commands, query])

  const groups = (['navigate', 'actions', 'preferences'] as const)
    .map((g) => ({ g, items: filtered.filter((c) => c.group === g) }))
    .filter((x) => x.items.length)

  const execute = (cmd: PaletteCommand | undefined) => {
    if (!cmd) return
    close()
    setQuery('')
    setActive(0)
    cmd.run()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % Math.max(filtered.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + filtered.length) % Math.max(filtered.length, 1))
    } else if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      execute(filtered[active])
    }
  }

  const activeId = filtered[active] ? `cmd-${filtered[active].id}` : undefined

  return (
    <dialog
      ref={dialogRef}
      aria-label={t.palette.label}
      onClose={() => {
        if (state.paletteOpen) close()
        setQuery('')
        setActive(0)
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      className="fixed inset-0 m-auto mt-[12vh] h-fit w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border-strong bg-popover p-0 text-popover-foreground shadow-2xl backdrop:bg-background/70 backdrop:backdrop-blur-sm"
    >
      {open ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              aria-activedescendant={activeId}
              aria-label={t.palette.placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={t.palette.placeholder}
              className="h-12 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <Kbd>Esc</Kbd>
          </div>
          <div id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {groups.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t.palette.empty}</p>
            ) : (
              groups.map(({ g, items }) => (
                <div key={g} role="group" aria-label={t.palette[g]} className="flex flex-col pb-2">
                  <p className="px-3 py-2 text-[11px] text-muted-foreground ltr:uppercase ltr:tracking-[0.12em]">
                    {t.palette[g]}
                  </p>
                  {items.map((cmd) => {
                    const index = filtered.indexOf(cmd)
                    const Icon = cmd.icon
                    return (
                      <div
                        key={cmd.id}
                        id={`cmd-${cmd.id}`}
                        role="option"
                        aria-selected={index === active}
                        onMouseMove={() => setActive(index)}
                        onClick={() => execute(cmd)}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm',
                          index === active ? 'bg-accent text-foreground' : 'text-foreground/80',
                        )}
                      >
                        <Icon className="size-4 text-muted-foreground" aria-hidden />
                        <span className="flex-1">{cmd.label}</span>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Kbd>↑↓</Kbd>
              {t.palette.hintNavigate}
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd>
              {t.palette.hintSelect}
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>Esc</Kbd>
              {t.palette.hintClose}
            </span>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
