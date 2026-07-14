// Navbar.ts
// Usage: import { createNavbar } from './components/Navbar';
//        document.getElementById('nav-root')?.appendChild(createNavbar({ active: 'home' }));
// Remember to call bindThemeToggle() from theme.ts AFTER this is inserted into the DOM.

export type NavbarActive = 'home' | 'components';

interface NavbarOptions {
  active?: NavbarActive;
}

export function createNavbar({ active = 'home' }: NavbarOptions = {}): HTMLElement {
  const nav = document.createElement('nav');
  nav.className =
    'sticky top-0 z-50 backdrop-blur bg-paper/80 dark:bg-ink-900/80 border-b border-ink-100 dark:border-ink-600';

  const linkClass = (key: NavbarActive): string =>
    `progress-underline text-sm font-medium ${
      active === key
        ? 'is-active text-ink-900 dark:text-paper'
        : 'text-ink-400 dark:text-ink-200 hover:text-ink-900 dark:hover:text-paper'
    }`;

  nav.innerHTML = `
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <a href="/index.html" class="font-display text-xl font-semibold text-ink-900 dark:text-paper">
        StudyWise
      </a>

      <div class="hidden sm:flex items-center gap-8">
        <a href="/index.html" class="${linkClass('home')}">Home</a>
      </div>

      <button
        data-theme-toggle
        aria-label="Toggle dark mode"
        class="rounded-lg p-2 text-ink-600 dark:text-paper hover:bg-ink-50 dark:hover:bg-ink-600 transition-colors"
      >
        <svg data-icon-sun class="hidden w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
        </svg>
        <svg data-icon-moon class="hidden w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </button>
    </div>
  `;

  return nav;
}