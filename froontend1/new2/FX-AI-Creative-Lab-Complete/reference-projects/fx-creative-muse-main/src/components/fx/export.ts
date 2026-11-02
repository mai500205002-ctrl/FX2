import type { Project } from "@/lib/fx/types";

function download(name: string, text: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
export function exportJson(p: Project) {
  download(`${p.brief.projectName || "fx"}.json`, JSON.stringify(p, null, 2), "application/json");
}
export function exportMarkdown(p: Project) {
  const b = p.brief;
  const i = p.insights.find((x) => x.id === p.selectedInsight);
  const c = p.concepts.find((x) => x.id === p.selectedConcept);
  const md = [
    `# ${b.projectName}`, `## Brief`, `- Brand: ${b.brand}`, `- Audience: ${b.audience}`, `- Challenge: ${b.challenge}`, `- Objective: ${b.objective}`, `- Tension: ${b.tension}`, `- Key message: ${b.keyMessage}`,
    i ? `## Insight\n**${i.title}**\n\n${i.tension}\n\n${i.opportunity}` : "",
    c ? `## Concept — ${c.theme}\n${c.coreIdea}\n\n${c.mechanism}` : "",
    p.scenes.length ? `## Script\n` + p.scenes.map((s, n) => `### Scene ${n + 1} (${s.duration}s)\n- Visual: ${s.visual}\n- Camera: ${s.camera}\n- VO: ${s.dialogue}\n- Music: ${s.music}\n- Sound: ${s.sound}\n- Transition: ${s.transition}`).join("\n\n") : "",
    p.rationale ? `## Rationale\n${p.rationale}` : "",
  ].filter(Boolean).join("\n\n");
  download(`${b.projectName || "fx"}.md`, md, "text/markdown");
}
