// Input.ts
// Usage: import { createInput } from './components/Input';
//        container.appendChild(createInput({ label: 'Email', type: 'email', placeholder: 'you@studywise.com' }));

let idCounter = 0;

interface InputOptions {
  label: string;
  type?: HTMLInputElement['type'];
  placeholder?: string;
  helpText?: string;
  errorText?: string;
}

export function createInput({ label, type = 'text', placeholder = '', helpText, errorText }: InputOptions): HTMLDivElement {
  const id = `field-${idCounter++}`;
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col gap-1.5';

  const borderClass = errorText
    ? 'border-red-400 focus:ring-red-400'
    : 'border-ink-200 dark:border-ink-400 focus:ring-amber';

  wrapper.innerHTML = `
    <label for="${id}" class="text-sm font-medium text-ink-900 dark:text-paper">${label}</label>
    <input
      id="${id}"
      type="${type}"
      placeholder="${placeholder}"
      class="rounded-lg border ${borderClass} bg-white dark:bg-ink-600 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 transition-shadow duration-150"
    />
    ${helpText && !errorText ? `<p class="text-xs text-ink-400 dark:text-ink-200">${helpText}</p>` : ''}
    ${errorText ? `<p class="text-xs text-red-500">${errorText}</p>` : ''}
  `;

  return wrapper;
}