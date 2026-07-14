// views/course-details.ts
// Course Details page: header (title, exam date, total hours), topic list
// with completion toggles, progress bar, and Add Topic / Upload Syllabus /
// Generate Plan actions. Upload Syllabus and Generate Plan are placeholders
// for now (routes/features not built yet) and say so honestly.

import { getAppRoot, navigate, type RouteParams } from '../router';
import { getCourseById, addTopic, toggleTopic, courseProgress, courseTotalHours, type Topic } from '../data/courses';

function requireElement<T extends Element>(element: T | null, id: string): T {
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element;
}

function formatExamDate(iso: string | null): string {
  if (!iso) return 'No exam date set';
  const date = new Date(iso + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const date = new Date(iso + 'T00:00:00');
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function topicRow(topic: Topic, onToggle: (row: HTMLElement, topic: Topic) => void): HTMLElement {
  const row = document.createElement('li');
  row.className =
    'flex items-center gap-4 rounded-lg border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 px-4 py-3.5 transition-colors';

  row.innerHTML = `
    <button
      type="button"
      class="topic-toggle shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
        topic.done
          ? 'bg-sage border-sage'
          : 'border-ink-200 dark:border-ink-400 hover:border-sage'
      }"
      aria-pressed="${topic.done}"
      aria-label="${topic.done ? 'Mark incomplete' : 'Mark complete'}"
    >
      ${topic.done ? '<svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>' : ''}
    </button>
    <span class="topic-title flex-1 text-sm ${topic.done ? 'line-through text-ink-400 dark:text-ink-200' : 'text-ink-900 dark:text-paper'}">${topic.title}</span>
    <span class="text-xs text-ink-400 dark:text-ink-200 shrink-0">${topic.estMinutes} min</span>
  `;

  row.querySelector('.topic-toggle')?.addEventListener('click', () => onToggle(row, topic));

  return row;
}

function syncTopicRow(row: HTMLElement, topic: Topic): void {
  const toggle = requireElement(row.querySelector<HTMLButtonElement>('.topic-toggle'), 'topic-toggle');
  const title = requireElement(row.querySelector<HTMLElement>('.topic-title'), 'topic-title');

  toggle.setAttribute('aria-pressed', String(topic.done));
  toggle.setAttribute('aria-label', topic.done ? 'Mark incomplete' : 'Mark complete');
  toggle.classList.toggle('bg-sage', topic.done);
  toggle.classList.toggle('border-sage', topic.done);
  toggle.classList.toggle('border-ink-200', !topic.done);
  toggle.classList.toggle('dark:border-ink-400', !topic.done);
  toggle.classList.toggle('hover:border-sage', !topic.done);
  toggle.innerHTML = topic.done
    ? '<svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>'
    : '';

  title.classList.toggle('line-through', topic.done);
  title.classList.toggle('text-ink-400', topic.done);
  title.classList.toggle('dark:text-ink-200', topic.done);
  title.classList.toggle('text-ink-900', !topic.done);
  title.classList.toggle('dark:text-paper', !topic.done);
}

function addTopicRow(onAdd: (title: string) => void): HTMLElement {
  const row = document.createElement('li');
  row.className = 'rounded-lg border-2 border-dashed border-ink-100 dark:border-ink-600 px-4 py-3.5';

  row.innerHTML = `
    <form id="add-topic-form" class="flex items-center gap-3">
      <input
        type="text"
        name="title"
        placeholder="Add a topic..."
        class="flex-1 bg-transparent text-sm text-ink-900 dark:text-paper placeholder:text-ink-400 dark:placeholder:text-ink-200 focus:outline-none"
      />
      <button type="submit" class="text-xs font-medium accent hover:opacity-80 shrink-0">+ Add</button>
    </form>
  `;

  const form = requireElement(row.querySelector<HTMLFormElement>('#add-topic-form'), 'add-topic-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = requireElement(form.querySelector<HTMLInputElement>('input[name="title"]'), 'topic-title-input');
    const title = input.value.trim();
    if (!title) return;
    onAdd(title);
    input.value = '';
  });

  return row;
}

function celebrateCourseComplete(): void {
  document.querySelector('.completion-toast')?.remove();

  const toast = document.createElement('div');
  toast.className = 'completion-toast';
  toast.innerHTML = `
    <p class="font-hand text-2xl">Lecture finished</p>
    <p class="text-sm opacity-80 mt-1">Nice work. Every topic is checked off.</p>
  `;
  document.body.appendChild(toast);

  const colors = ['#E8C468', '#E0765E', '#8FAE8B', '#82AAFF', '#F2EFE6'];
  for (let i = 0; i < 22; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--confetti-color', colors[i % colors.length]);
    piece.style.setProperty('--x', `${Math.round((Math.random() - 0.5) * 420)}px`);
    piece.style.setProperty('--y', `${Math.round(120 + Math.random() * 220)}px`);
    piece.style.setProperty('--spin', `${Math.round(Math.random() * 180)}deg`);
    piece.style.setProperty('--delay', `${i * 14}ms`);
    document.body.appendChild(piece);
    window.setTimeout(() => piece.remove(), 1300);
  }

  window.setTimeout(() => toast.remove(), 3000);
}

export function renderCourseDetails(params: RouteParams): void {
  const app = getAppRoot();
  app.innerHTML = '';

  const course = getCourseById(params.id);

  if (!course) {
    const notFound = document.createElement('section');
    notFound.className = 'max-w-2xl mx-auto px-6 py-24 text-center';
    notFound.innerHTML = `
      <p class="font-hand text-2xl accent mb-3">page torn out</p>
      <h1 class="font-display text-4xl text-ink-900 dark:text-paper mb-4">Course not found</h1>
      <p class="text-sm surface-muted mb-8">That course doesn't exist, or it may have been removed.</p>
      <button type="button" id="back-to-courses" class="cta-primary rounded-md px-6 py-3 text-sm font-semibold hover:brightness-110 transition">Back to Courses</button>
    `;
    notFound.querySelector('#back-to-courses')?.addEventListener('click', () => navigate('/courses'));
    app.appendChild(notFound);
    return;
  }

  const selectedCourse = course;
  const section = document.createElement('section');
  section.className = 'animate-page max-w-4xl mx-auto px-6 py-12';
  app.appendChild(section);

  function syncProgress(): void {
    const progress = courseProgress(selectedCourse);
    const hours = courseTotalHours(selectedCourse);
    const doneCount = selectedCourse.topics.filter((t) => t.done).length;
    const metaHours = section.querySelector<HTMLElement>('#course-hours');
    const metaDone = section.querySelector<HTMLElement>('#course-done-count');
    const progressBar = section.querySelector<HTMLElement>('#course-progress-bar');
    const progressLabel = section.querySelector<HTMLElement>('#course-progress-label');

    if (metaHours) metaHours.textContent = `~${hours}h of material left`;
    if (metaDone) metaDone.textContent = `${doneCount}/${selectedCourse.topics.length} topics done`;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressLabel) progressLabel.textContent = `${progress}% complete`;
  }

  function renderContent(): void {
    section.innerHTML = '';

    const progress = courseProgress(selectedCourse);
    const hours = courseTotalHours(selectedCourse);
    const days = daysUntil(selectedCourse.examDate);
    const doneCount = selectedCourse.topics.filter((t) => t.done).length;

    const header = document.createElement('div');
    header.className = 'reveal-item mb-10';
    header.innerHTML = `
      <button type="button" id="back-link" class="text-xs font-mono surface-muted hover:accent mb-5 inline-flex items-center gap-1.5">
        ← back to courses
      </button>
      <p class="font-hand text-2xl accent mb-1">${selectedCourse.subject}</p>
      <h1 class="font-display text-5xl text-ink-900 dark:text-paper mb-4">${selectedCourse.title}</h1>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm surface-muted">
        <span>${formatExamDate(selectedCourse.examDate)}${days !== null && days >= 0 ? ` · ${days}d away` : ''}</span>
        <span id="course-hours">~${hours}h of material left</span>
        <span id="course-done-count">${doneCount}/${selectedCourse.topics.length} topics done</span>
      </div>
      <div class="mt-5 max-w-md">
        <div class="w-full h-2.5 rounded-full bg-ink-50 dark:bg-ink-900 overflow-hidden">
          <div id="course-progress-bar" class="progress-fill h-full bg-sage rounded-full transition-all duration-500" style="width: ${progress}%"></div>
        </div>
        <p id="course-progress-label" class="text-xs surface-muted mt-1.5">${progress}% complete</p>
      </div>
      <div class="flex flex-wrap gap-3 mt-6">
        <button type="button" id="action-upload-syllabus" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition">Upload syllabus</button>
        <button type="button" id="action-generate-plan" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition">Generate plan</button>
      </div>
    `;
    section.appendChild(header);

    requireElement(header.querySelector<HTMLButtonElement>('#back-link'), 'back-link')
      .addEventListener('click', () => navigate('/courses'));
    requireElement(header.querySelector<HTMLButtonElement>('#action-upload-syllabus'), 'action-upload-syllabus')
      .addEventListener('click', () => navigate('/syllabus-upload'));
    requireElement(header.querySelector<HTMLButtonElement>('#action-generate-plan'), 'action-generate-plan')
      .addEventListener('click', () => {
        // Planner route isn't built yet — flag it plainly rather than pretending to act.
        alert('Plan generation is coming soon — this will build a study schedule from your topics.');
      });

    const listWrap = document.createElement('div');
    listWrap.className = 'reveal-item';
    listWrap.style.setProperty('--delay', '120ms');
    listWrap.innerHTML = `<p class="font-hand text-xl accent mb-4">topics</p>`;
    const list = document.createElement('ul');
    list.className = 'flex flex-col gap-2.5';
    listWrap.appendChild(list);
    section.appendChild(listWrap);

    if (selectedCourse.topics.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-sm surface-muted italic mb-2.5';
      empty.textContent = 'No topics yet — add one below or upload a syllabus to generate a list.';
      list.appendChild(empty);
    }

    selectedCourse.topics.forEach((t, index) => {
      const row = topicRow(t, (topicRowEl, topic) => {
        const wasComplete = selectedCourse.topics.length > 0 && selectedCourse.topics.every((topic) => topic.done);
        toggleTopic(selectedCourse.id, topic.id);
        const isComplete = selectedCourse.topics.length > 0 && selectedCourse.topics.every((topic) => topic.done);
        syncTopicRow(topicRowEl, topic);
        syncProgress();
        if (!wasComplete && isComplete) {
          celebrateCourseComplete();
        }
      });
      row.classList.add('reveal-item');
      row.style.setProperty('--delay', `${180 + index * 55}ms`);
      list.appendChild(row);
    });

    const addRow = addTopicRow((title) => {
      addTopic(selectedCourse.id, title);
      renderContent();
    });
    addRow.classList.add('reveal-item');
    addRow.style.setProperty('--delay', `${220 + selectedCourse.topics.length * 55}ms`);
    list.appendChild(addRow);
  }

  renderContent();
}
