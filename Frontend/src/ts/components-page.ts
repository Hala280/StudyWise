import { initTheme, bindThemeToggle } from './theme';
import { createNavbar } from './components/Navbar';
import { createButton } from './components/Button';
import { createCard } from './components/Card';
import { createInput } from './components/Input';
import { createBadge } from './components/Badge';
import type { ButtonSize, ButtonVariant } from './components/Button';

function requireElement<T extends Element>(element: T | null, id: string): T {
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

initTheme();

document.addEventListener('DOMContentLoaded', () => {
  const navRoot = requireElement(document.getElementById('nav-root'), 'nav-root');
  navRoot.appendChild(createNavbar({ active: 'components' }));
  bindThemeToggle();

  const variants: ButtonVariant[] = ['primary', 'secondary', 'accent', 'ghost'];
  const buttonsRoot = requireElement(document.getElementById('section-buttons'), 'section-buttons');
  variants.forEach((variant) => buttonsRoot.appendChild(createButton({ label: variant, variant })));

  const sizesRoot = requireElement(document.getElementById('section-button-sizes'), 'section-button-sizes');
  ['sm', 'md', 'lg'].forEach((size) =>
    sizesRoot.appendChild(createButton({ label: `size: ${size}`, size: size as ButtonSize }))
  );

  requireElement(document.getElementById('section-button-disabled'), 'section-button-disabled').appendChild(
    createButton({ label: 'Disabled button', disabled: true })
  );

  const cardsRoot = requireElement(document.getElementById('section-cards'), 'section-cards');
  cardsRoot.appendChild(createCard({ eyebrow: 'Biology', title: 'Cell structure', body: '18 cards · last studied 2d ago', progress: 65 }));
  cardsRoot.appendChild(createCard({ eyebrow: 'History', title: 'Cold War timeline', body: 'New deck, not started', progress: 0 }));
  cardsRoot.appendChild(createCard({ title: 'No progress bar variant', body: 'Card without the progress prop.' }));

  const inputsRoot = requireElement(document.getElementById('section-inputs'), 'section-inputs');
  inputsRoot.appendChild(createInput({ label: 'Default', placeholder: 'Type something' }));
  inputsRoot.appendChild(createInput({ label: 'With help text', placeholder: 'you@studywise.com', helpText: "We'll never share this." }));
  inputsRoot.appendChild(createInput({ label: 'With error', placeholder: 'you@studywise.com', errorText: 'Enter a valid email.' }));

  const badgesRoot = requireElement(document.getElementById('section-badges'), 'section-badges');
  badgesRoot.appendChild(createBadge({ label: 'Neutral', tone: 'neutral' }));
  badgesRoot.appendChild(createBadge({ label: 'Due today', tone: 'amber' }));
  badgesRoot.appendChild(createBadge({ label: 'Mastered', tone: 'sage' }));

  const colors = [
    { name: 'ink', hex: '#14213D', class: 'bg-ink' },
    { name: 'paper', hex: '#FBFAF7', class: 'bg-paper border border-ink-100' },
    { name: 'amber', hex: '#E8A33D', class: 'bg-amber' },
    { name: 'sage', hex: '#5C7A5C', class: 'bg-sage' },
  ];
  const colorsRoot = requireElement(document.getElementById('section-colors'), 'section-colors');
  colors.forEach((color) => {
    const swatch = document.createElement('div');
    swatch.className = 'rounded-xl overflow-hidden border border-ink-100 dark:border-ink-600';
    swatch.innerHTML = `
      <div class="h-20 ${color.class}"></div>
      <div class="px-4 py-3 bg-white dark:bg-ink-600">
        <p class="text-sm font-medium text-ink-900 dark:text-paper">${color.name}</p>
        <p class="text-xs text-ink-400 dark:text-ink-200">${color.hex}</p>
      </div>
    `;
    colorsRoot.appendChild(swatch);
  });
});