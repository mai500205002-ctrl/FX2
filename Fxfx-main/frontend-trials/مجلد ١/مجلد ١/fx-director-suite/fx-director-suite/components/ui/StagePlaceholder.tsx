import { AppShell } from "@/components/layout/AppShell";

export function StagePlaceholder({ title, endpoint }: { title: string; endpoint: string }) {
  return (
    <AppShell>
      <div className="flex flex-col gap-4 py-8">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">PLACEHOLDER</span>
        <h1 className="font-headline text-3xl font-semibold text-on-surface">{title}</h1>
        <p className="font-body text-sm text-on-surface-variant max-w-xl leading-relaxed">
          هذه الشاشة لم تُرسل بعد ضمن الكود المُسلَّم، وأُضيفت كمسار مؤقت حتى لا يظهر 404. سيتم ربطها بالباك إند عبر:
        </p>
        <code dir="ltr" className="font-mono text-xs text-primary bg-surface-container p-2 rounded w-fit">{endpoint}</code>
      </div>
    </AppShell>
  );
}
