import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Course, courseProgress, courseTotalHours, createCourse, getCourses } from '../../ts/data/courses';

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

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="animate-page max-w-6xl mx-auto px-6 py-12">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
        <div>
          <p class="font-hand text-2xl accent mb-1">your shelf</p>
          <h1 class="font-display text-5xl text-ink-900 dark:text-paper">Courses</h1>
        </div>
        <button
          type="button"
          (click)="openCreateModal()"
          class="cta-primary rounded-md px-5 py-3 text-sm font-semibold hover:brightness-110 transition self-start sm:self-auto"
        >
          + Create course
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search courses..."
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
          class="flex-1 rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-600 px-4 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150"
        />
        <select
          [ngModel]="subjectFilter()"
          (ngModelChange)="subjectFilter.set($event)"
          class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-600 px-4 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150"
        >
          <option value="all">All subjects</option>
          @for (subject of subjects(); track subject) {
            <option [value]="subject">{{ subject }}</option>
          }
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        @if (filteredCourses().length === 0) {
          <div class="reveal-item col-span-full flex flex-col items-center text-center gap-4 py-20 px-6 rounded-xl border-2 border-dashed border-ink-100 dark:border-ink-600">
            <p class="font-hand text-2xl accent">{{ courses().length > 0 ? 'no matches on the board' : 'the board is empty' }}</p>
            <p class="text-sm surface-muted max-w-sm">
              @if (courses().length > 0) {
                Nothing matches that search or filter. Try a different subject, or clear it and start fresh.
              } @else {
                You haven't added any courses yet. Create one to start building flashcards and a study plan.
              }
            </p>
            <div class="flex gap-3 mt-1">
              @if (courses().length > 0) {
                <button type="button" (click)="clearFilters()" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition">Clear filters</button>
              }
              <button type="button" (click)="openCreateModal()" class="cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition">Create course</button>
            </div>
          </div>
        } @else {
          @for (course of filteredCourses(); track course.id; let i = $index) {
            <button
              type="button"
              (click)="goToCourse(course.id)"
              class="reveal-item group text-left rounded-xl border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3"
              [style.--delay]="(i * 80) + 'ms'"
            >
              <div class="flex items-start justify-between gap-3">
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" [class]="subjectStyles(course).chip">{{ course.subject }}</span>
                <span class="text-xs text-ink-400 dark:text-ink-200 shrink-0">{{ course.topics.length }} topic{{ course.topics.length === 1 ? '' : 's' }}</span>
              </div>
              <h3 class="font-display text-2xl leading-tight text-ink-900 dark:text-paper group-hover:underline decoration-2 underline-offset-4 decoration-amber">
                {{ course.title }}
              </h3>
              <p class="text-xs text-ink-400 dark:text-ink-200">{{ formatExamDate(course.examDate) }} · ~{{ totalHours(course) }}h left</p>
              <div class="mt-1">
                <div class="w-full h-2 rounded-full bg-ink-50 dark:bg-ink-900 overflow-hidden">
                  <div class="progress-fill h-full rounded-full transition-all duration-500" [class]="subjectStyles(course).bar" [style.width.%]="progress(course)"></div>
                </div>
                <p class="text-xs text-ink-400 dark:text-ink-200 mt-1.5">{{ progress(course) }}% complete</p>
              </div>
            </button>
          }
        }
      </div>
    </section>

    @if (createModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm px-4" (click)="onOverlayClick($event)">
        <div class="animate-page w-full max-w-md rounded-xl bg-paper dark:bg-ink-600 border border-ink-100 dark:border-ink-400 shadow-xl p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="flex items-start justify-between mb-5">
            <div>
              <p class="font-hand text-xl accent">new entry</p>
              <h2 id="modal-title" class="font-display text-3xl text-ink-900 dark:text-paper">Create a course</h2>
            </div>
            <button type="button" aria-label="Close" class="text-ink-400 dark:text-ink-200 hover:text-ink-900 dark:hover:text-paper text-xl leading-none" (click)="closeCreateModal()">&times;</button>
          </div>
          <form class="flex flex-col gap-4" (submit)="submitCreateForm($event)">
            <div class="flex flex-col gap-1.5">
              <label for="course-title" class="text-sm font-medium text-ink-900 dark:text-paper">Course title</label>
              <input
                id="course-title"
                name="title"
                type="text"
                required
                placeholder="e.g. Organic Chemistry"
                class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="course-subject" class="text-sm font-medium text-ink-900 dark:text-paper">Subject</label>
              <input
                id="course-subject"
                name="subject"
                type="text"
                required
                placeholder="e.g. Chemistry"
                class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="course-exam-date" class="text-sm font-medium text-ink-900 dark:text-paper">
                Exam date <span class="text-ink-400 dark:text-ink-200 font-normal">(optional)</span>
              </label>
              <input
                id="course-exam-date"
                name="examDate"
                type="date"
                class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150"
              />
            </div>
            <div class="flex gap-3 mt-2">
              <button type="submit" class="flex-1 cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition">Create course</button>
              <button type="button" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition" (click)="closeCreateModal()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class CoursesPage {
  courses = signal<Course[]>(getCourses());
  query = signal('');
  subjectFilter = signal('all');
  createModalOpen = signal(false);

  subjects = computed(() => Array.from(new Set(this.courses().map((c) => c.subject))).sort());

  filteredCourses = computed(() => {
    const q = this.query().trim().toLowerCase();
    const subject = this.subjectFilter();
    return this.courses().filter((c) => {
      const matchesQuery = q.length === 0 || c.title.toLowerCase().includes(q);
      const matchesSubject = subject === 'all' || c.subject === subject;
      return matchesQuery && matchesSubject;
    });
  });

  constructor(private router: Router) {}

  subjectStyles(course: Course) {
    return SUBJECT_STYLES[course.color];
  }

  formatExamDate(iso: string | null): string {
    return formatExamDate(iso);
  }

  progress(course: Course): number {
    return courseProgress(course);
  }

  totalHours(course: Course): number {
    return courseTotalHours(course);
  }

  goToCourse(id: string): void {
    this.router.navigate(['/courses', id]);
  }

  clearFilters(): void {
    this.query.set('');
    this.subjectFilter.set('all');
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeCreateModal();
  }

  submitCreateForm(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const subject = String(data.get('subject') || '').trim();
    const examDate = String(data.get('examDate') || '').trim() || null;

    if (!title || !subject) return;

    const course = createCourse({ title, subject, examDate });
    form.reset();
    this.courses.set(getCourses());
    this.closeCreateModal();
    this.router.navigate(['/courses', course.id]);
  }
}