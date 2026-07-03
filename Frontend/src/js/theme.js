// theme.js
// It handles dark/light mode using Tailwind's class strategy.
// Preference is persisted in localStorage under 'studywise-theme'.

const STORAGE_KEY = 'studywise-theme';

export function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = stored ? stored === 'dark' : prefersDark;

  document.documentElement.classList.toggle('dark', isDark);
}

// toggle theme button
export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  syncToggleIcons(isDark);
}


export function bindThemeToggle() {
  const buttons = document.querySelectorAll('[data-theme-toggle]');
  buttons.forEach((btn) => btn.addEventListener('click', toggleTheme));

  const isDark = document.documentElement.classList.contains('dark');
  syncToggleIcons(isDark);
}

function syncToggleIcons(isDark) {
  document.querySelectorAll('[data-icon-sun]').forEach((el) => {
    el.classList.toggle('hidden', isDark);
  });
  document.querySelectorAll('[data-icon-moon]').forEach((el) => {
    el.classList.toggle('hidden', !isDark);
  });
}
