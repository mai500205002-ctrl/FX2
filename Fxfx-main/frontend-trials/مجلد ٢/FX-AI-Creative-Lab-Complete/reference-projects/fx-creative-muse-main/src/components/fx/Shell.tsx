import { useEffect, useState, type ReactNode } from "react";
import { Bell, Command as CmdIcon, Languages, Sparkles, Check, Cpu } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { useFx } from "@/lib/fx/store";
import { STAGES } from "@/lib/fx/i18n";
import { toast } from "sonner";
import { exportMarkdown } from "./export";

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-lg border border-border bg-elevated font-display text-lg italic glow">fx</span>
      <span className="hidden font-mono text-[11px] tracking-[0.2em] text-muted-foreground sm:inline">AI CREATIVE LAB</span>
    </span>
  );
}

export function TopBar({ onCmd }: { onCmd: () => void }) {
  const fx = useFx();
  const thinking = fx.ai !== "idle" && fx.ai !== "done";
  return (
    <header className="glass no-print fixed inset-x-0 top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 md:px-6">
        <button onClick={() => fx.go("home")} aria-label="FX home"><Logo /></button>
        <div className="hidden h-5 w-px bg-border md:block" />
        <div className="hidden min-w-0 md:block">
          <div className="truncate text-sm font-medium">{fx.project?.brief.projectName || fx.t("untitled")}</div>
        </div>
        <span className="hidden items-center gap-1 text-xs text-muted-foreground md:flex"><Check className="size-3 text-success" />{fx.t("saved")}</span>
        <div className="flex-1" />
        <span className={`flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs ${thinking ? "text-cyan" : "text-muted-foreground"}`}>
          <span className={`size-1.5 rounded-full ${thinking ? "bg-cyan animate-fx-pulse" : fx.ai === "done" ? "bg-success" : "bg-muted-foreground"}`} />
          <span className="hidden sm:inline">{fx.t(`status_${fx.ai}` as never)}</span>
        </span>
        <button onClick={onCmd} className="hidden items-center gap-2 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground lg:flex">
          <CmdIcon className="size-3" />K
        </button>
        <button onClick={() => fx.setLang(fx.lang === "en" ? "ar" : "en")} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
          <Languages className="size-4" />{fx.lang === "en" ? "عربي" : "EN"}
        </button>
        <button onClick={() => toast(fx.t("notifications"), { description: fx.lang === "ar" ? "لا جديد. كل شيء محفوظ محلياً." : "All caught up. Everything is saved locally." })} className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={fx.t("notifications")}>
          <Bell className="size-4" /><span className="absolute end-1 top-1 size-1.5 rounded-full bg-primary" />
        </button>
        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan text-xs font-semibold text-primary-foreground">NB</span>
      </div>
    </header>
  );
}

export function StageRail() {
  const fx = useFx();
  if (fx.stage === "home") return null;
  const cur = STAGES.indexOf(fx.stage);
  return (
    <nav className="no-print mx-auto mb-10 flex max-w-[1400px] gap-1 overflow-x-auto px-4 md:px-6">
      {STAGES.map((s, i) => (
        <button key={s} onClick={() => fx.go(s)}
          className={`group flex min-w-[130px] flex-1 flex-col gap-2 rounded-lg px-3 py-2.5 text-start transition-colors ${i === cur ? "bg-elevated" : "hover:bg-surface"}`}>
          <span className={`h-0.5 w-full rounded-full ${i < cur ? "bg-primary" : i === cur ? "bg-gradient-to-r from-primary to-cyan" : "bg-border"}`} />
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
            <span className={`text-sm ${i === cur ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{fx.t(s)}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}

export function FloatingWidgets() {
  const fx = useFx();
  const pct = Math.min(100, (fx.tokens / fx.tokenLimit) * 100);
  const states = ["analyzing", "tensions", "concept", "script", "done"] as const;
  const active = fx.ai !== "idle";
  return (
    <div className="no-print fixed bottom-4 end-4 z-40 flex flex-col items-end gap-2">
      {active && (
        <div className="glass-strong animate-fx-rise w-64 overflow-hidden rounded-xl p-3">
          <div className="mb-2 flex items-center gap-2 text-xs"><Sparkles className="size-3.5 text-cyan" />FX</div>
          <ul className="space-y-1.5">
            {states.map((st) => {
              const on = st === fx.ai;
              return (
                <li key={st} className={`flex items-center gap-2 text-xs ${on ? "text-foreground" : "text-muted-foreground/60"}`}>
                  <span className={`size-1.5 rounded-full ${on ? (st === "done" ? "bg-success" : "bg-cyan animate-fx-pulse") : "bg-border"}`} />
                  {fx.t(`status_${st}` as never)}
                </li>
              );
            })}
          </ul>
          {fx.ai !== "done" && <div className="mt-3 h-px overflow-hidden bg-border"><div className="h-full w-1/2 animate-fx-scan bg-gradient-to-r from-transparent via-cyan to-transparent" /></div>}
        </div>
      )}
      <div className="glass-strong w-64 rounded-xl p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground"><Cpu className="size-3.5" />{fx.t("tokens")}</span>
          <span className="font-mono">{fx.tokens.toLocaleString()}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>{(fx.tokenLimit - fx.tokens).toLocaleString()} {fx.t("remaining")}</span>
          <span>{Math.round((fx.tokenLimit - fx.tokens) / 100)} {fx.t("credits")}</span>
        </div>
      </div>
    </div>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const fx = useFx();
  const ar = fx.lang === "ar";
  const act = (fn: () => void) => () => { setOpen(false); fn(); };
  const items: { label: string; k?: string; fn: () => void }[] = [
    { label: fx.t("newBrief"), k: "N", fn: () => fx.create(false) },
    { label: ar ? "توليد رؤية" : "Generate insight", fn: () => { fx.go("insight"); fx.genInsights(); } },
    { label: ar ? "إعادة كتابة الفكرة" : "Rewrite concept", fn: () => { if (!fx.project?.selectedInsight) return toast(fx.t("needInsight")); fx.go("concept"); fx.genConcepts(); } },
    { label: ar ? "توسيع كل المشاهد" : "Expand all scenes", fn: () => { fx.go("script"); fx.aiScene(() => fx.setScenes((sc) => sc.map((x) => ({ ...x, duration: x.duration + 1 })))); } },
    { label: fx.t("translate"), fn: () => fx.updateBrief({ language: fx.project?.brief.language === "ar" ? "en" : "ar" }) },
    { label: fx.t("exportMd"), fn: () => fx.project && exportMarkdown(fx.project) },
    { label: ar ? "تبديل اللغة" : "Toggle interface language", k: "L", fn: () => fx.setLang(ar ? "en" : "ar") },
  ];
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={fx.t("command")} />
      <CommandList>
        <CommandEmpty>—</CommandEmpty>
        <CommandGroup heading={ar ? "إجراءات" : "Actions"}>
          {items.map((i) => (<CommandItem key={i.label} onSelect={act(i.fn)}>{i.label}{i.k && <CommandShortcut>{i.k}</CommandShortcut>}</CommandItem>))}
        </CommandGroup>
        <CommandGroup heading={ar ? "انتقال" : "Go to"}>
          {(["home", ...STAGES] as const).map((s) => (<CommandItem key={s} onSelect={act(() => fx.go(s))}>{fx.t(s)}</CommandItem>))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function Section({ eyebrow, title, sub, actions, children }: { eyebrow: string; title: ReactNode; sub?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-40 md:px-6 animate-fx-rise">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="eyebrow mb-3">{eyebrow}</div>
          <h1 className="font-display text-4xl leading-[1.05] md:text-6xl">{title}</h1>
          {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
        </div>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function Btn({ variant = "ghost", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  const v = variant === "primary"
    ? "bg-primary text-primary-foreground hover:brightness-110 glow"
    : variant === "outline" ? "border border-border hover:bg-accent" : "text-muted-foreground hover:bg-accent hover:text-foreground";
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-40 ${v} ${className}`} />;
}
