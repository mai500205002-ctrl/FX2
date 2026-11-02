import type { CSSProperties } from 'react';
import type { Effect } from '@/engine/effects';

export interface RenderProps {
  style: CSSProperties;
  className?: string;
}

export function renderEffect(
  effect: Effect,
  values: Record<string, number | string>,
): RenderProps {
  const style = effect.style(values);
  const className = effect.className ? effect.className(values) : undefined;
  return { style, className: className || undefined };
}

/** Build a shareable, self-contained CSS rule for an exported effect. */
export function exportCSS(
  effect: Effect,
  values: Record<string, number | string>,
  selector = '.textfx',
): string {
  const styleObj = effect.style(values) as Record<string, string>;
  // Normalize React camelCase keys to CSS kebab-case.
  const lines: string[] = [];
  for (const [k, val] of Object.entries(styleObj)) {
    const key = k
      .replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      .replace(/^webkit-/, '-webkit-')
      .replace(/^fx-/, '--fx-');
    lines.push(`  ${key}: ${val};`);
  }
  return `/* TEXTFX · ${effect.name} (${effect.family}) */\n${selector} {\n${lines.join('\n')}\n}`;
}
