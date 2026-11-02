import { useState, useCallback, useEffect } from 'react';
import {
  LayoutDashboard,
  Workflow,
  Bot,
  Sparkles,
  Type as TypeIcon,
  Activity,
  Settings,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CommandCenter from '@/views/CommandCenter';
import Pipeline from '@/views/Pipeline';
import AgentView from '@/views/AgentView';
import ArchiveView from '@/views/ArchiveView';
import Studio from '@/views/Studio';
import MetricsView from '@/views/MetricsView';
import SettingsView from '@/views/SettingsView';
import type { StudioSeed } from '@/views/Studio';

export type RouteId =
  | 'command'
  | 'pipeline'
  | 'agent'
  | 'archive'
  | 'studio'
  | 'metrics'
  | 'settings';

interface NavItem {
  id: RouteId;
  label: string;
  hint: string;
  icon: typeof LayoutDashboard;
  group: 'core' | 'system';
}

const NAV: NavItem[] = [
  { id: 'command', label: 'Command Center', hint: 'Overview', icon: LayoutDashboard, group: 'core' },
  { id: 'pipeline', label: 'Pipeline', hint: 'Brief → Script', icon: Workflow, group: 'core' },
  { id: 'agent', label: 'Agent', hint: 'Autonomous runs', icon: Bot, group: 'core' },
  { id: 'archive', label: 'Archive', hint: 'Saved work', icon: Sparkles, group: 'core' },
  { id: 'studio', label: 'FX Studio', hint: 'Text effects', icon: TypeIcon, group: 'core' },
  { id: 'metrics', label: 'Metrics', hint: 'System health', icon: Activity, group: 'system' },
  { id: 'settings', label: 'Settings', hint: 'API keys', icon: Settings, group: 'system' },
];

export default function App() {
  const [route, setRoute] = useState<RouteId>('command');
  const [seed, setSeed] = useState<StudioSeed | null>(null);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const goToStudio = useCallback((s: StudioSeed) => {
    setSeed(s);
    setRoute('studio');
  }, []);

  const nav = NAV.find((n) => n.id === route)!;
  const core = NAV.filter((n) => n.group === 'core');
  const system = NAV.filter((n) => n.group === 'system');

  return (
    <div className="h-screen w-screen overflow-hidden bg-base-950 text-base-100 flex">
      <aside className="w-[252px] shrink-0 border-r border-white/[0.06] bg-base-900/60 flex flex-col">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-signal-300/90 to-signal-500 grid place-items-center shadow-signal">
              <span className="font-display font-bold text-base-950 text-sm tracking-tight">Fx</span>
            </div>
            <div className="leading-tight">
              <div className="font-display font-semibold text-[15px] tracking-tight">TEXTFX</div>
              <div className="font-mono text-[10px] text-base-400 uppercase tracking-[0.18em]">
                Creative OS
              </div>
            </div>
          </div>
        </div>

        <nav className="px-3 flex-1 overflow-y-auto no-scrollbar">
          <NavGroup label="Workspace" items={core} route={route} onSelect={setRoute} />
          <div className="h-px bg-white/[0.05] my-3 mx-1" />
          <NavGroup label="System" items={system} route={route} onSelect={setRoute} />
        </nav>

        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-base-500 uppercase tracking-[0.18em]">
              System
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-mono text-[10px] text-base-300">Online</span>
            </span>
          </div>
          <div className="mt-2 font-mono text-[11px] text-base-400 tabular-nums">
            {clock.toLocaleTimeString('en-GB')}
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 border-b border-white/[0.06] bg-base-950/80 glass flex items-center px-6 gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <nav.icon size={16} className="text-signal-300 shrink-0" />
            <h1 className="font-display text-[15px] font-medium tracking-tight truncate">
              {nav.label}
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-4 text-base-500">
            <span className="font-mono text-[11px]">/</span>
            <span className="font-mono text-[11px] text-base-400">{nav.hint}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-lg ring-hairline bg-white/[0.03] px-3 py-1.5 text-base-400">
              <Command size={13} />
              <span className="font-mono text-[11px]">Quick actions</span>
              <kbd className="font-mono text-[10px] text-base-300 bg-white/[0.06] rounded px-1.5 py-0.5 ml-1">
                /
              </kbd>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-auto">
          {route === 'command' && <CommandCenter onNavigate={setRoute} onOpenStudio={goToStudio} />}
          {route === 'pipeline' && <Pipeline onOpenStudio={goToStudio} />}
          {route === 'agent' && <AgentView />}
          {route === 'archive' && <ArchiveView onOpen={(s) => goToStudio(s)} />}
          {route === 'studio' && <Studio seed={seed} onClearSeed={() => setSeed(null)} />}
          {route === 'metrics' && <MetricsView />}
          {route === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  items,
  route,
  onSelect,
}: {
  label: string;
  items: NavItem[];
  route: RouteId;
  onSelect: (r: RouteId) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-base-600">
        {label}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === route;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-300 ease-smooth',
              active
                ? 'bg-white/[0.06] text-base-50 ring-hairline'
                : 'text-base-300 hover:bg-white/[0.03] hover:text-base-100',
            )}
          >
            <Icon
              size={18}
              className={cn(
                'shrink-0 transition-colors',
                active ? 'text-signal-300' : 'text-base-400 group-hover:text-base-200',
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium leading-tight">{item.label}</div>
              <div className="text-[11px] text-base-500 leading-tight mt-0.5">{item.hint}</div>
            </div>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-signal-300 shadow-signal" />}
          </button>
        );
      })}
    </div>
  );
}
