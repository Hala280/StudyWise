import { initTheme, bindThemeToggle } from './theme.js';
import { createNavbar } from './components/Navbar.js';
import { createButton } from './components/Button.js';
import { createCard } from './components/Card.js';

initTheme();

document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('nav-root').appendChild(createNavbar({ active: 'home' }));
  bindThemeToggle();


  const heroActions = document.getElementById('hero-actions');
  heroActions.appendChild(
    createButton({ label: 'Start studying free', variant: 'primary', size: 'lg', onClick: () => alert('Hook up sign-up flow') })
  );
  heroActions.appendChild(
    createButton({ label: 'See how it works', variant: 'secondary', size: 'lg', onClick: () => alert('Hook up demo scroll/modal') })
  );


  const features = [
    { eyebrow: 'Recall', title: 'Spaced repetition', body: 'Cards resurface right before you forget them.' },
    { eyebrow: 'Import', title: 'Notes to flashcards', body: 'Paste your notes, get study-ready cards in seconds.' },
    { eyebrow: 'Track', title: 'Progress by subject', body: 'See exactly which topics need more attention.' },
  ];
  const featureRoot = document.getElementById('feature-cards');
  features.forEach((f) => featureRoot.appendChild(createCard(f)));


  document.getElementById('cta-action').appendChild(
    createButton({ label: 'Create free account', variant: 'accent', size: 'lg', onClick: () => alert('Hook up sign-up flow') })
  );
});
