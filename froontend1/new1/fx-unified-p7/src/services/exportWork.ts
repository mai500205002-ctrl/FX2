import type { Work } from './fx';
import { buildScenes } from './scenes';

export function toMarkdown(w: Work): string {
  const sc = buildScenes(w).script;
  return [
    `# ${w.concept?.title ?? 'FX'}`, '',
    `**الموجز:** ${w.brief}`, `**الشخصية:** ${w.archetype} · **المحرك:** ${w.engine} · **الحدّة:** ${w.intensity}`, '',
    '## الرؤية', w.insight ?? '', '',
    '## الفكرة', w.concept?.idea ?? '', '',
    `## المرآة: ${w.mirror?.title ?? ''}`, w.mirror?.idea ?? '', '',
    '## السيناريو',
    ...sc.map(s => `- **${s.slugline}** (${s.timecode}) — ${s.summary}\n  - ${s.cameraDirection}`),
    ...(w.scriptText ? ['', '## نص السيناريو (من الـBackend)', w.scriptText] : []),
    '', `<!-- المصدر: الفكرة ${w.source ?? '-'} · المرآة ${w.mirrorSource ?? '-'} -->`,
  ].join('\n');
}
export async function copyMarkdown(w: Work): Promise<boolean> {
  try { await navigator.clipboard.writeText(toMarkdown(w)); return true; } catch { return false; }
}
export function downloadMarkdown(w: Work) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([toMarkdown(w)], { type: 'text/markdown;charset=utf-8' }));
  a.download = `fx-${Date.now()}.md`; a.click(); URL.revokeObjectURL(a.href);
}
