import { createFileRoute } from "@tanstack/react-router";
import { FxProvider, useFx } from "@/lib/fx/store";
import { CommandPalette, FloatingWidgets, StageRail, TopBar, useCommandPalette } from "@/components/fx/Shell";
import { BriefScreen, ConceptScreen, EngineScreen, Home, InsightScreen, OutputScreen, ScriptScreen } from "@/components/fx/Screens";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FX — AI Creative Lab" },
      { name: "description", content: "An AI creative director: turn a brief into strategic insight, creative concept and a cinematic script. Bilingual English / Arabic." },
      { property: "og:title", content: "FX — AI Creative Lab" },
      { property: "og:description", content: "Brief → Insight → Concept → Cinematic Script. A creative intelligence operating system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Lab() {
  const fx = useFx();
  const cmd = useCommandPalette();
  const S = { home: Home, brief: BriefScreen, engine: EngineScreen, insight: InsightScreen, concept: ConceptScreen, script: ScriptScreen, output: OutputScreen }[fx.project || fx.stage === "home" ? fx.stage : "home"];
  return (
    <div className="ambient grain relative min-h-screen">
      <TopBar onCmd={() => cmd.setOpen(true)} />
      <main className="relative z-10 pt-20">
        <StageRail />
        <S key={fx.stage + (fx.currentId ?? "")} />
      </main>
      <FloatingWidgets />
      <CommandPalette {...cmd} />
    </div>
  );
}

function Index() {
  return <FxProvider><Lab /></FxProvider>;
}
