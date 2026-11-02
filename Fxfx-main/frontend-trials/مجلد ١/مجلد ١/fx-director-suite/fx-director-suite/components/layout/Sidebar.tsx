"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/brief", label: "الموجز الإبداعي", icon: "description" },
  { href: "/strategy", label: "الرؤية الاستراتيجية", icon: "insights" },
  { href: "/concept", label: "الفكرة الإبداعية", icon: "lightbulb" },
  { href: "/script", label: "السيناريو السينمائي", icon: "movie" },
  { href: "/engines", label: "محركات التفكير", icon: "psychology" },
  { href: "/governance", label: "حلقة الحوكمة", icon: "gavel" },
  { href: "/metrics", label: "مقاييس الأداء", icon: "analytics" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col justify-between py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-l border-surface-container-high/30">
      <div className="flex flex-col gap-6">
        {/* Logo & Version */}
        <div className="px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-primary font-headline text-2xl font-semibold tracking-wider">FX</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/70">ATELIER</span>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant/50">v5.0</span>
        </div>

        {/* Active Project Capsule */}
        <div className="px-6">
          <div className="p-3 rounded bg-surface-container-low flex flex-col gap-2 border border-surface-container-high/50">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">مشروع نشط</span>
            <span className="font-body text-sm text-on-surface line-clamp-2 leading-relaxed font-medium">سكب الوعي 2026: أفق الصمت</span>
            <span className="font-mono text-[10px] text-primary/80">#NEOM_CAMPAIGN_A1</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all font-body text-sm ${
                  isActive
                    ? "bg-surface-container-high text-primary font-semibold shadow-[inset_0_0_8px_rgba(242,202,80,0.15)]"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Telemetry & Processing Power */}
      <div className="px-4 flex flex-col gap-3">
        <div className="p-3 rounded bg-surface-container-low flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-on-surface-variant">طاقة المعالجة (VRAM)</span>
            <span className="font-mono text-[10px] text-primary">74%</span>
          </div>
          <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary-container rounded-full transition-all duration-500" style={{ width: "74%" }}></div>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 text-on-surface-variant font-mono text-[10px]">
          <span>LATENCY: 18ms</span>
          <span className="text-primary animate-pulse">LLM ACTIVE</span>
        </div>
      </div>
    </aside>
  );
}
