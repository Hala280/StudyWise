// views/courses.ts
// Courses page: search/filter grid of course cards, a "create course" modal
// (local state only — no backend yet), and an empty state when no courses
// match or exist. Renders into the shared #app mount point.

import { getAppRoot, navigate } from '../router';
import { getCourses, createCourse, courseProgress, courseTotalHours, type Course } from '../data/courses';

function requireElement<T extends Element>(element: T | null, id: string): T {
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element;
}

const SUBJECT_STYLES: Record<Course['color'], { chip: string; bar: string }> = {
  amber: { chip: 'bg-amber-light/40 text-amber-dark dark:bg-amber/20 dark:text-amber-light', bar: 'bg-amber' },
  sage: { chip: 'bg-sage-light/30 text-sage dark:bg-sage/20 dark:text-sage-light', bar: 'bg-sage' },
  coral: { chip: 'bg-[#E0765E]/15 text-[#C15A3F] dark:text-[#E0765E]', bar: 'bg-[#E0765E]' },
  ink: { chip: 'bg-ink-50 text-ink-600 dark:bg-ink-600 dark:text-ink-100', bar: 'bg-ink-400' },
};

function formatExamDate(iso: string | null): string {
  if (!iso) return 'No exam date set';
  const date = new Date(iso + 'T00:00:00');
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return `Exam was ${formatted}`;
  if (daysLeft === 0) return `Exam today · ${formatted}`;
  return `Exam in ${daysLeft}d · ${formatted}`;
}

function courseCard(course: Course): HTMLElement {
  const progress = courseProgress(course);
  const hours = courseTotalHours(course);
  const styles = SUBJECT_STYLES[course.color];

  const card = document.createElement('button');
  card.type = 'button';
  card.className =
    'group text-left rounded-xl border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3';
  card.addEventListener('click', () => navigate(`/courses/${course.id}`));

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles.chip}">${course.subject}</span>
      <span class="text-xs text-ink-400 dark:text-ink-200 shrink-0">${course.topics.length} topic${course.topics.length === 1 ? '' : 's'}</span>
    </div>
    <h3 class="font-display text-2xl leading-tight text-ink-900 dark:text-paper group-hover:underline decoration-2 underline-offset-4 decoration-amber">
      ${course.title}
    </h3>
    <p class="text-xs text-ink-400 dark:text-ink-200">${formatExamDate(course.examDate)} · ~${hours}h left</p>
    <div class="mt-1">
      <div class="w-full h-2 rounded-full bg-ink-50 dark:bg-ink-900 overflow-hidden">
        <div class="h-full ${styles.bar} rounded-full transition-all duration-500" style="width: ${progress}%"></div>
      </div>
      <p class="text-xs text-ink-400 dark:text-ink-200 mt-1.5">${progress}% complete</p>
    </div>
  `;

  return card;
}

function emptyState(hasFilter: boolean, onClearFilter: () => void, onCreate: () => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className =
    'col-span-full flex flex-col items-center text-center gap-4 py-20 px-6 rounded-xl border-2 border-dashed border-ink-100 dark:border-ink-600';

  wrap.innerHTML = `
    <p class="font-hand text-2xl accent">${hasFilter ? 'no matches on the board' : 'the board is empty'}</p>
    <p class="text-sm surface-muted max-w-sm">
      ${hasFilter
        ? "Nothing matches that search or filter. Try a different subject, or clear it and start fresh."
        : "You haven't added any courses yet. Create one to start building flashcards and a study plan."}
    </p>
    <div class="flex gap-3 mt-1">
      ${hasFilter ? '<button type="button" id="empty-clear" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition">Clear filters</button>' : ''}
      <button type="button" id="empty-create" class="cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition">Create course</button>
    </div>
  `;

  wrap.querySelector('#empty-clear')?.addEventListener('click', onClearFilter);
  wrap.querySelector('#empty-create')?.addEventListener('click', onCreate);

  return wrap;
}

function createCourseModal(onCreated: (course: Course) => void): { el: HTMLElement; open: () => void } {
  const overlay = document.createElement('div');
  overlay.className =
    'fixed inset-0 z-50 hidden items-center justify-center bg-ink-900/50 backdrop-blur-sm px-4';
  overlay.id = 'create-course-overlay';

  overlay.innerHTML = `
    <div class="w-full max-w-md rounded-xl bg-paper dark:bg-ink-600 border border-ink-100 dark:border-ink-400 shadow-xl p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="flex items-start justify-between mb-5">
        <div>
          <p class="font-hand text-xl accent">new entry</p>
          <h2 id="modal-title" class="font-display text-3xl text-ink-900 dark:text-paper">Create a course</h2>
        </div>
        <button type="button" id="modal-close" aria-label="Close" class="text-ink-400 dark:text-ink-200 hover:text-ink-900 dark:hover:text-paper text-xl leading-none">&times;</button>
      </div>
      <form id="create-course-form" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="course-title" class="text-sm font-medium text-ink-900 dark:text-paper">Course title</label>
          <input id="course-title" name="title" type="text" required placeholder="e.g. Organic Chemistry"
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="course-subject" class="text-sm font-medium text-ink-900 dark:text-paper">Subject</label>
          <input id="course-subject" name="subject" type="text" required placeholder="e.g. Chemistry"
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="course-exam-date" class="text-sm font-medium text-ink-900 dark:text-paper">Exam date <span class="text-ink-400 dark:text-ink-200 font-normal">(optional)</span></label>
          <input id="course-exam-date" name="examDate" type="date"
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
        </div>
        <div class="flex gap-3 mt-2">
          <button type="submit" class="flex-1 cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition">Create course</button>
          <button type="button" id="modal-cancel" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition">Cancel</button>
        </div>
      </form>
    </div>
  `;

  function close(): void {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }

  function open(): void {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    requireElement(overlay.querySelector<HTMLInputElement>('#course-title'), 'course-title').focus();
  }

  overlay.querySelector('#modal-close')?.addEventListener('click', close);
  overlay.querySelector('#modal-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const form = requireElement(overlay.querySelector<HTMLFormElement>('#create-course-form'), 'create-course-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const subject = String(data.get('subject') || '').trim();
    const examDate = String(data.get('examDate') || '').trim() || null;

    if (!title || !subject) return;

    const course = createCourse({ title, subject, examDate });
    form.reset();
    close();
    onCreated(course);
  });

  return { el: overlay, open };
}

export function renderCourses(): void {
  const app = getAppRoot();
  app.innerHTML = '';

  let query = '';
  let subjectFilter = 'all';

  const section = document.createElement('section');
  section.className = 'max-w-6xl mx-auto px-6 py-12';

  section.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
      <div>
        <p class="font-hand text-2xl accent mb-1">your shelf</p>
        <h1 class="font-display text-5xl text-ink-900 dark:text-paper">Courses</h1>
      </div>
      <button type="button" id="open-create-course" class="cta-primary rounded-md px-5 py-3 text-sm font-semibold hover:brightness-110 transition self-start sm:self-auto">
        + Create course
      </button>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mb-8">
      <input
        id="course-search"
        type="text"
        placeholder="Search courses..."
        class="flex-1 rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-600 px-4 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150"
      />
      <select
        id="subject-filter"
        class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-600 px-4 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150"
      >
        <option value="all">All subjects</option>
      </select>
    </div>

    <div id="courses-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"></div>
  `;

  app.appendChild(section);

  const grid = requireElement(section.querySelector<HTMLElement>('#courses-grid'), 'courses-grid');
  const searchInput = requireElement(section.querySelector<HTMLInputElement>('#course-search'), 'course-search');
  const subjectSelect = requireElement(section.querySelector<HTMLSelectElement>('#subject-filter'), 'subject-filter');
  const openCreateBtn = requireElement(section.querySelector<HTMLButtonElement>('#open-create-course'), 'open-create-course');

  function populateSubjectOptions(): void {
    const subjects = Array.from(new Set(getCourses().map((c) => c.subject))).sort();
    const current = subjectSelect.value;
    subjectSelect.innerHTML = '<option value="all">All subjects</option>' +
      subjects.map((s) => `<option value="${s}">${s}</option>`).join('');
    subjectSelect.value = subjects.includes(current) ? current : 'all';
  }

  function renderGrid(): void {
    grid.innerHTML = '';
    const all = getCourses();
    const filtered = all.filter((c) => {
      const matchesQuery = query.trim().length === 0 || c.title.toLowerCase().includes(query.toLowerCase());
      const matchesSubject = subjectFilter === 'all' || c.subject === subjectFilter;
      return matchesQuery && matchesSubject;
    });

    if (filtered.length === 0) {
      grid.appendChild(
        emptyState(
          all.length > 0,
          () => {
            query = '';
            subjectFilter = 'all';
            searchInput.value = '';
            subjectSelect.value = 'all';
            renderGrid();
          },
          () => modal.open()
        )
      );
      return;
    }

    filtered.forEach((course) => grid.appendChild(courseCard(course)));
  }

  const modal = createCourseModal((course) => {
    populateSubjectOptions();
    renderGrid();
    navigate(`/courses/${course.id}`);
  });
  app.appendChild(modal.el);

  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    renderGrid();
  });
  subjectSelect.addEventListener('change', () => {
    subjectFilter = subjectSelect.value;
    renderGrid();
  });
  openCreateBtn.addEventListener('click', () => modal.open());

  populateSubjectOptions();
  renderGrid();
}
