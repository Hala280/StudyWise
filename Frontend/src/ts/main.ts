// main.ts
// Router bootstrap. The Home page is the existing static markup in
// index.html (#home-view); Courses, Course Details, etc. render into the
// #app mount point. This function toggles which one is visible per-route.

import { registerRoute, registerNotFound, startRouter, getAppRoot } from './router';
import { renderCourses } from './views/courses';
import { renderCourseDetails } from './views/course-details';
import { renderPlanner } from './views/planner';

registerRoute('/planner', () => {
  showApp();
  renderPlanner();
});


function requireElement<T extends Element>(element: T | null, id: string): T {
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element;
}

const homeView = requireElement(document.getElementById('home-view'), 'home-view');

function showHome(): void {
  homeView.classList.remove('hidden');
  getAppRoot().classList.add('hidden');
}

function showApp(): void {
  homeView.classList.add('hidden');
  getAppRoot().classList.remove('hidden');
}

registerRoute('/', () => {
  showHome();
});

registerRoute('/courses', () => {
  showApp();
  renderCourses();
});

registerRoute('/courses/:id', (params) => {
  showApp();
  renderCourseDetails(params);
});

registerNotFound(() => {
  showApp();
  const app = getAppRoot();
  app.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'max-w-2xl mx-auto px-6 py-24 text-center';
  section.innerHTML = `
    <p class="font-hand text-2xl accent mb-3">wrong classroom</p>
    <h1 class="font-display text-5xl text-ink-900 dark:text-paper mb-4">404</h1>
    <p class="text-sm surface-muted mb-8">That page doesn't exist. Let's get you back on track.</p>
    <a href="#/" class="cta-primary rounded-md px-6 py-3 text-sm font-semibold hover:brightness-110 transition inline-block">Back to Home</a>
  `;
  app.appendChild(section);
});

document.addEventListener('DOMContentLoaded', () => {
  const ctaStart = document.getElementById('cta-start');
  const ctaUpload = document.getElementById('cta-upload-syllabus');

  ctaStart?.addEventListener('click', () => {
    window.location.hash = '#/courses';
  });
  ctaUpload?.addEventListener('click', () => {
    window.location.hash = '#/syllabus-upload';
  });

  startRouter();
});
