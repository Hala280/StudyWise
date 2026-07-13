import { initTheme, bindThemeToggle } from './theme';
import { createNavbar } from './components/Navbar';
import { createButton } from './components/Button';
import { createCard } from './components/Card';

function requireElement<T extends Element>(element: T | null, id: string): T {
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

initTheme();

document.addEventListener('DOMContentLoaded', () => {
  const navRoot = requireElement(document.getElementById('nav-root'), 'nav-root');
  navRoot.appendChild(createNavbar({ active: 'home' }));
  bindThemeToggle();

  const heroActions = requireElement(document.getElementById('hero-actions'), 'hero-actions');
  heroActions.appendChild(
    createButton({
      label: 'Start studying free',
      variant: 'primary',
      size: 'lg',
      onClick: () => alert('Hook up sign-up flow'),
    })
  );
  heroActions.appendChild(
    createButton({
      label: 'See how it works',
      variant: 'secondary',
      size: 'lg',
      onClick: () => alert('Hook up demo scroll/modal'),
    })
  );

  const features = [
    { eyebrow: 'Recall', title: 'Spaced repetition', body: 'Cards resurface right before you forget them.' },
    { eyebrow: 'Import', title: 'Notes to flashcards', body: 'Paste your notes, get study-ready cards in seconds.' },
    { eyebrow: 'Track', title: 'Progress by subject', body: 'See exactly which topics need more attention.' },
  ];
  const featureRoot = requireElement(document.getElementById('feature-cards'), 'feature-cards');
  features.forEach((feature) => featureRoot.appendChild(createCard(feature)));

  const ctaAction = requireElement(document.getElementById('cta-action'), 'cta-action');
  ctaAction.appendChild(
    createButton({
      label: 'Create free account',
      variant: 'accent',
      size: 'lg',
      onClick: () => alert('Hook up sign-up flow'),
    })
  );
});