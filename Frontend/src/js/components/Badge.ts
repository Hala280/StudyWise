// Badge.ts
// Usage: import { createBadge } from './components/Badge';
//        container.appendChild(createBadge({ label: 'Due today', tone: 'amber' }));

export type BadgeTone = 'neutral' | 'amber' | 'sage';

interface BadgeOptions {
  label: string;
  tone?: BadgeTone;
}

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-50 text-ink-600 dark:bg-ink-600 dark:text-ink-100',
  amber: 'bg-amber-light/40 text-amber-dark dark:bg-amber/20 dark:text-amber-light',
  sage: 'bg-sage-light/30 text-sage dark:bg-sage/20 dark:text-sage-light',
};

export function createBadge({ label, tone = 'neutral' }: BadgeOptions): HTMLSpanElement {
  const span = document.createElement('span');
  span.textContent = label;
  span.className = `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]}`;
  return span;
}