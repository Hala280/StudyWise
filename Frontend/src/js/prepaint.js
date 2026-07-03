(() => {
  const storedAppearance = localStorage.getItem('studywise-appearance');
  const storedMode = localStorage.getItem('studywise-mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const appearance = storedAppearance || (prefersDark ? 'dark' : 'light');
  const mode = storedMode || 'classic';

  document.documentElement.setAttribute('data-appearance', mode === 'dev' ? 'dark' : appearance);
  document.documentElement.setAttribute('data-mode', mode);
})();