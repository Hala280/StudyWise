// Card.ts
// Usage: import { createCard } from './components/Card';
//        container.appendChild(createCard({ title: 'Biology 101', body: '12 flashcards due', progress: 40 }));

export interface CardOptions {
  title: string;
  body?: string;
  progress?: number;
  eyebrow?: string;
}

export function createCard({ title, body, progress, eyebrow }: CardOptions): HTMLDivElement {
  const card = document.createElement('div');
  card.className =
    'rounded-xl border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 p-6 shadow-sm hover:shadow-md transition-shadow duration-200';

  let html = '';

  if (eyebrow) {
    html += `<p class="text-xs font-semibold uppercase tracking-wide text-amber-dark dark:text-amber mb-2">${eyebrow}</p>`;
  }

  html += `<h3 class="text-lg font-display font-semibold text-ink-900 dark:text-paper mb-1">${title}</h3>`;

  if (body) {
    html += `<p class="text-sm text-ink-400 dark:text-ink-200 mb-4">${body}</p>`;
  }

  if (typeof progress === 'number') {
    const clamped = Math.min(100, Math.max(0, progress));
    html += `
      <div class="w-full h-2 rounded-full bg-ink-50 dark:bg-ink-900 overflow-hidden">
        <div class="h-full bg-sage rounded-full" style="width: ${clamped}%"></div>
      </div>
      <p class="text-xs text-ink-400 dark:text-ink-200 mt-1.5">${clamped}% complete</p>
    `;
  }

  card.innerHTML = html;
  return card;
}