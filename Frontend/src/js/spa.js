const APPEARANCE_KEY = 'studywise-appearance';
const MODE_KEY = 'studywise-mode';
const html = document.documentElement;

const devInviteBtn = document.getElementById('dev-invite-btn');
const exitDevBtn = document.getElementById('exit-dev-btn');
const appearanceBtn = document.getElementById('appearance-btn');
const iconSun = document.getElementById('icon-sun');
const iconMoon = document.getElementById('icon-moon');
const navLabels = document.querySelectorAll('[data-nav-label]');
const navTitle = document.querySelector('[data-mode-label]');

function applyAppearance(appearance) {
  if (html.getAttribute('data-mode') === 'dev') {
    appearance = 'dark';
  }

  html.setAttribute('data-appearance', appearance);
  localStorage.setItem(APPEARANCE_KEY, appearance);
  iconSun.classList.toggle('hidden', appearance === 'light');
  iconMoon.classList.toggle('hidden', appearance === 'dark');
}

function syncNavLabels() {
  const isDevMode = html.getAttribute('data-mode') === 'dev';
  const prefix = isDevMode ? 'import ' : '';

  navTitle.textContent = isDevMode ? 'import StudyWise' : 'StudyWise';
  navLabels.forEach((label) => {
    const baseLabel = label.textContent.replace(/^import\s+/, '').trim();
    label.textContent = prefix + baseLabel;
  });
}

function applyMode(mode) {
  html.setAttribute('data-mode', mode);
  localStorage.setItem(MODE_KEY, mode);

  if (mode === 'dev') {
    applyAppearance('dark');
  } else {
    const storedAppearance = localStorage.getItem(APPEARANCE_KEY) || 'dark';
    applyAppearance(storedAppearance);
  }

  syncNavLabels();
  appearanceBtn.setAttribute('aria-disabled', mode === 'dev' ? 'true' : 'false');
}

appearanceBtn.addEventListener('click', () => {
  if (html.getAttribute('data-mode') === 'dev') {
    return;
  }

  const next = html.getAttribute('data-appearance') === 'dark' ? 'light' : 'dark';
  applyAppearance(next);
});

devInviteBtn.addEventListener('click', () => applyMode('dev'));
exitDevBtn.addEventListener('click', () => applyMode('classic'));

applyAppearance(html.getAttribute('data-appearance'));
syncNavLabels();