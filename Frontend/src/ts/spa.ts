type Appearance = 'light' | 'dark';
type Mode = 'classic' | 'dev';

const APPEARANCE_KEY = 'studywise-appearance';
const MODE_KEY = 'studywise-mode';
const html = document.documentElement;

function requireElement<T extends Element>(element: T | null, id: string): T {
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

const devInviteBtn = requireElement(document.getElementById('dev-invite-btn'), 'dev-invite-btn');
const exitDevBtn = requireElement(document.getElementById('exit-dev-btn'), 'exit-dev-btn');
const appearanceBtn = requireElement(document.getElementById('appearance-btn'), 'appearance-btn');
const iconSun = requireElement(document.getElementById('icon-sun'), 'icon-sun');
const iconMoon = requireElement(document.getElementById('icon-moon'), 'icon-moon');
const navLabels = document.querySelectorAll<HTMLElement>('[data-nav-label]');
const navTitle = requireElement(document.querySelector<HTMLElement>('[data-mode-label]'), 'data-mode-label');

function applyAppearance(appearance: Appearance): void {
  const nextAppearance = html.getAttribute('data-mode') === 'dev' ? 'dark' : appearance;

  html.setAttribute('data-appearance', nextAppearance);
  localStorage.setItem(APPEARANCE_KEY, nextAppearance);
  iconSun.classList.toggle('hidden', nextAppearance === 'light');
  iconMoon.classList.toggle('hidden', nextAppearance === 'dark');
}

function syncNavLabels(): void {
  const isDevMode = html.getAttribute('data-mode') === 'dev';
  const prefix = isDevMode ? 'import ' : '';

  navTitle.textContent = isDevMode ? 'import StudyWise' : 'StudyWise';
  navLabels.forEach((label) => {
    const baseLabel = (label.textContent ?? '').replace(/^import\s+/, '').trim();
    label.textContent = prefix + baseLabel;
  });
}

function applyMode(mode: Mode): void {
  html.setAttribute('data-mode', mode);
  localStorage.setItem(MODE_KEY, mode);

  if (mode === 'dev') {
    applyAppearance('dark');
  } else {
    const storedAppearance = (localStorage.getItem(APPEARANCE_KEY) || 'dark') as Appearance;
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

applyAppearance((html.getAttribute('data-appearance') || 'dark') as Appearance);
syncNavLabels();