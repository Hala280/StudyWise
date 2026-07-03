import { initTheme, bindThemeToggle } from './theme.js';
import { createNavbar } from './components/Navbar.js';
import { createButton } from './components/Button.js';
import { createCard } from './components/Card.js';
import { createInput } from './components/Input.js';
import { createBadge } from './components/Badge.js';

initTheme();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nav-root').appendChild(createNavbar({ active: 'components' }));
  bindThemeToggle();

  // Button variants
  const variants = ['primary', 'secondary', 'accent', 'ghost'];
  const buttonsRoot = document.getElementById('section-buttons');
  variants.forEach((variant) =>
    buttonsRoot.appendChild(createButton({ label: variant, variant }))
  );

  // Button sizes
  const sizesRoot = document.getElementById('section-button-sizes');
  ['sm', 'md', 'lg'].forEach((size) =>
    sizesRoot.appendChild(createButton({ label: `size: ${size}`, size }))
  );

  // Disabled
  document.getElementById('section-button-disabled').appendChild(
    createButton({ label: 'Disabled button', disabled: true })
  );

  // Cards
  const cardsRoot = document.getElementById('section-cards');
  cardsRoot.appendChild(createCard({ eyebrow: 'Biology', title: 'Cell structure', body: '18 cards · last studied 2d ago', progress: 65 }));
  cardsRoot.appendChild(createCard({ eyebrow: 'History', title: 'Cold War timeline', body: 'New deck, not started', progress: 0 }));
  cardsRoot.appendChild(createCard({ title: 'No progress bar variant', body: 'Card without the progress prop.' }));

  // Inputs
  const inputsRoot = document.getElementById('section-inputs');
  inputsRoot.appendChild(createInput({ label: 'Default', placeholder: 'Type something' }));
  inputsRoot.appendChild(createInput({ label: 'With help text', placeholder: 'you@studywise.com', helpText: "We'll never share this." }));
  inputsRoot.appendChild(createInput({ label: 'With error', placeholder: 'you@studywise.com', errorText: 'Enter a valid email.' }));

  // Badges
  const badgesRoot = document.getElementById('section-badges');
  badgesRoot.appendChild(createBadge({ label: 'Neutral', tone: 'neutral' }));
  badgesRoot.appendChild(createBadge({ label: 'Due today', tone: 'amber' }));
  badgesRoot.appendChild(createBadge({ label: 'Mastered', tone: 'sage' }));

  // Color tokens
  const colors = [
    { name: 'ink', hex: '#14213D', class: 'bg-ink' },
    { name: 'paper', hex: '#FBFAF7', class: 'bg-paper border border-ink-100' },
    { name: 'amber', hex: '#E8A33D', class: 'bg-amber' },
    { name: 'sage', hex: '#5C7A5C', class: 'bg-sage' },
  ];
  const colorsRoot = document.getElementById('section-colors');
  colors.forEach((c) => {
    const swatch = document.createElement('div');
    swatch.className = 'rounded-xl overflow-hidden border border-ink-100 dark:border-ink-600';
    swatch.innerHTML = `
      <div class="h-20 ${c.class}"></div>
      <div class="px-4 py-3 bg-white dark:bg-ink-600">
        <p class="text-sm font-medium text-ink-900 dark:text-paper">${c.name}</p>
        <p class="text-xs text-ink-400 dark:text-ink-200">${c.hex}</p>
      </div>
    `;
    colorsRoot.appendChild(swatch);
  });
});
