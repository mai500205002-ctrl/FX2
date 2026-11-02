'use client'

import { useEffect, useRef } from 'react'
import { AiPanel } from './ai-panel'
import { CommandBar } from './command-bar'
import { CommandPalette } from './command-palette'
import { MobileStageTabs, StageRail } from './stage-nav'
import { BriefStage } from './stages/brief-stage'
import { IdeaStage } from './stages/idea-stage'
import { ScriptStage } from './stages/script-stage'
import { StrategyStage } from './stages/strategy-stage'
import { useWorkspace } from './workspace-provider'

const stageViews = {
  brief: BriefStage,
  strategy: StrategyStage,
  idea: IdeaStage,
  script: ScriptStage,
}

export function AppShell() {
  const { state, t } = useWorkspace()
  const mainRef = useRef<HTMLElement>(null)
  const StageView = stageViews[state.stage]

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [state.stage])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-background"
      >
        {t.app.skipToContent}
      </a>
      <CommandBar />
      <div className="flex min-h-0 flex-1">
        <StageRail />
        <main
          ref={mainRef}
          id="workspace"
          tabIndex={-1}
          className="min-w-0 flex-1 overflow-y-auto px-4 pt-0 focus:outline-none md:px-10 md:pt-10"
        >
          <MobileStageTabs />
          <div key={state.stage} className="fx-rise mx-auto w-full max-w-5xl pb-10">
            <StageView />
          </div>
        </main>
        <AiPanel />
      </div>
      <CommandPalette />
    </div>
  )
}
