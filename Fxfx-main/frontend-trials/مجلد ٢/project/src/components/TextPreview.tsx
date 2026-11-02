import { useMemo } from 'react';
import type { Effect } from '@/engine/effects';
import { renderEffect } from '@/engine/render';
import { cn } from '@/lib/utils';

interface TextPreviewProps {
  effect: Effect;
  text: string;
  values: Record<string, number | string>;
  className?: string;
  textClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl md:text-7xl',
};

export default function TextPreview({
  effect,
  text,
  values,
  className,
  textClassName,
  size = 'md',
}: TextPreviewProps) {
  const { style, className: fxClass } = useMemo(
    () => renderEffect(effect, values),
    [effect, values],
  );

  return (
    <div
      className={cn(
        'flex items-center justify-center text-center px-6 py-8 select-none',
        className,
      )}
    >
      <span
        className={cn(
          'font-display leading-tight tracking-tight break-words',
          SIZE_MAP[size],
          fxClass,
          textClassName,
        )}
        style={style}
      >
        {text || 'TEXTFX'}
      </span>
    </div>
  );
}
