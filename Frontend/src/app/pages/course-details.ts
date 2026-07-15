import { Component, Input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StudyWiseApi } from '../services/studywise-api';
import { Course, courseProgress, courseTotalHours, type Topic } from '../../ts/data/courses';
import { showToast } from '../Toast/alerts';

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

interface ConfettiPiece {
  id: number;
  color: string;
  x: string;
  y: string;
  spin: string;
  delay: string;
}

@Component({
  standalone: true,
  template: `
    @if (course()) {
      <section class="animate-page max-w-4xl mx-auto px-6 py-12">
        <div class="reveal-item mb-10">
          <button type="button" class="text-xs font-mono surface-muted hover:accent mb-5 inline-flex items-center gap-1.5" (click)="backToCourses()">
            ← back to courses
          </button>
          <p class="font-hand text-2xl accent mb-1">{{ course()!.subject }}</p>
          <h1 class="font-display text-5xl text-ink-900 dark:text-paper mb-4">{{ course()!.title }}</h1>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm surface-muted">
            <span>{{ formatExamDate(course()!.examDate) }}{{ daysSuffix() }}</span>
            <span>~{{ totalHours() }}h of material left</span>
            <span>{{ doneCount() }}/{{ course()!.topics.length }} topics done</span>
          </div>
          <div class="mt-5 max-w-md">
            <div class="w-full h-2.5 rounded-full bg-ink-50 dark:bg-ink-900 overflow-hidden">
              <div class="progress-fill h-full bg-sage rounded-full transition-all duration-500" [style.width.%]="progress()"></div>
            </div>
            <p class="text-xs surface-muted mt-1.5">{{ progress() }}% complete</p>
          </div>
          <div class="flex flex-wrap gap-3 mt-6">
            <button type="button" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition" (click)="uploadSyllabus()">Upload syllabus</button>
          </div>
        </div>

        <div class="reveal-item" style="--delay: 120ms">
          <p class="font-hand text-xl accent mb-4">topics</p>
          <ul class="flex flex-col gap-2.5">
            @if (course()!.topics.length === 0) {
              <p class="text-sm surface-muted italic mb-2.5">No topics yet — add one below or upload a syllabus to generate a list.</p>
            }

            @for (topic of course()!.topics; track topic.id; let i = $index) {
              <li
                class="reveal-item flex items-center gap-4 rounded-lg border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 px-4 py-3.5 transition-colors"
                [style.--delay]="(180 + i * 55) + 'ms'"
              >
                <button
                  type="button"
                  class="topic-toggle shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                  [class.bg-sage]="topic.done"
                  [class.border-sage]="topic.done"
                  [class.border-ink-200]="!topic.done"
                  [class.dark:border-ink-400]="!topic.done"
                  [class.hover:border-sage]="!topic.done"
                  [attr.aria-pressed]="topic.done"
                  [attr.aria-label]="topic.done ? 'Mark incomplete' : 'Mark complete'"
                  (click)="toggle(topic.id)"
                >
                  @if (topic.done) {
                    <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  }
                </button>
                <span
                  class="flex-1 text-sm"
                  [class.line-through]="topic.done"
                  [class.text-ink-400]="topic.done"
                  [class.dark:text-ink-200]="topic.done"
                  [class.text-ink-900]="!topic.done"
                  [class.dark:text-paper]="!topic.done"
                >{{ topic.title }}</span>
                <span class="text-xs text-ink-400 dark:text-ink-200 shrink-0">{{ topic.estMinutes }} min</span>
              </li>
            }

            <li
              class="reveal-item rounded-lg border-2 border-dashed border-ink-100 dark:border-ink-600 px-4 py-3.5"
              [style.--delay]="(220 + course()!.topics.length * 55) + 'ms'"
            >
              <form class="flex items-center gap-3" (submit)="submitAddTopic($event)">
                <input
                  type="text"
                  name="title"
                  placeholder="Add a topic..."
                  class="flex-1 bg-transparent text-sm text-ink-900 dark:text-paper placeholder:text-ink-400 dark:placeholder:text-ink-200 focus:outline-none"
                />
                <button type="submit" class="text-xs font-medium accent hover:opacity-80 shrink-0">+ Add</button>
              </form>
            </li>
          </ul>
        </div>
      </section>
    } @else {
      <section class="max-w-2xl mx-auto px-6 py-24 text-center">
        <p class="font-hand text-2xl accent mb-3">{{ loading() ? 'opening notes' : 'page torn out' }}</p>
        <h1 class="font-display text-4xl text-ink-900 dark:text-paper mb-4">{{ loading() ? 'Loading course' : 'Course not found' }}</h1>
        <p class="text-sm surface-muted mb-8">{{ error() || "That course doesn't exist, or it may have been removed." }}</p>
        <button type="button" class="cta-primary rounded-md px-6 py-3 text-sm font-semibold hover:brightness-110 transition" (click)="backToCourses()">Back to Courses</button>
      </section>
    }

    @if (showToast()) {
      <div class="completion-toast">
        <p class="font-hand text-2xl">Lecture finished</p>
        <p class="text-sm opacity-80 mt-1">Nice work. Every topic is checked off.</p>
      </div>
    }

    @for (piece of confetti(); track piece.id) {
      <span
        class="confetti-piece"
        [style.--confetti-color]="piece.color"
        [style.--x]="piece.x"
        [style.--y]="piece.y"
        [style.--spin]="piece.spin"
        [style.--delay]="piece.delay"
      ></span>
    }
  `,
})
export class CourseDetailsPage {
  course = signal<Course | undefined>(undefined);
  loading = signal(true);
  error = signal<string | null>(null);
  showToast = signal(false);
  confetti = signal<ConfettiPiece[]>([]);

  private confettiCounter = 0;

  @Input()
  set id(value: string) {
    this.loadCourse(value);
  }

  constructor(
    private router: Router,
    private api: StudyWiseApi
  ) {}

  progress(): number {
    const c = this.course();
    return c ? courseProgress(c) : 0;
  }

  totalHours(): number {
    const c = this.course();
    return c ? courseTotalHours(c) : 0;
  }

  doneCount(): number {
    return this.course()?.topics.filter((t) => t.done).length ?? 0;
  }

  daysSuffix(): string {
    const c = this.course();
    if (!c) return '';
    const days = daysUntil(c.examDate);
    return days !== null && days >= 0 ? ` · ${days}d away` : '';
  }

  formatExamDate(iso: string | null): string {
    return formatExamDate(iso);
  }

  backToCourses(): void {
    this.router.navigate(['/courses']);
  }

  uploadSyllabus(): void {
    const c = this.course();
    this.router.navigate(['/upload'], c ? { queryParams: { courseId: c.id } } : undefined);
  }

  generatePlan(): void {
    showToast('Plan generation is coming soon — this will build a study schedule from your topics.');
  }

  toggle(topicId: string): void {
    const c = this.course();
    if (!c) return;

    const topic = c.topics.find((t) => t.id === topicId);
    if (!topic) return;

    const wasComplete = c.topics.length > 0 && c.topics.every((t) => t.done);
    const nextTopic = { ...topic, done: !topic.done };
    this.api.updateTopic(c.id, nextTopic).subscribe({
      next: (updatedTopic) => {
        const updatedCourse = {
          ...c,
          topics: c.topics.map((t) => (t.id === topicId ? updatedTopic : t)),
        };
        this.course.set(updatedCourse);
        const isComplete = updatedCourse.topics.length > 0 && updatedCourse.topics.every((t) => t.done);
        if (!wasComplete && isComplete) this.celebrate();
      },
      error: () => this.error.set('Could not update the topic. Please try again.'),
    });
  }

  submitAddTopic(event: SubmitEvent): void {
    event.preventDefault();
    const c = this.course();
    if (!c) return;

    const form = event.currentTarget as HTMLFormElement;
    const input = form.querySelector<HTMLInputElement>('input[name="title"]');
    const title = input?.value.trim();
    if (!title) return;

    this.api.createTopic(c.id, title).subscribe({
      next: (topic) => {
        this.course.set({ ...c, topics: [...c.topics, topic] });
        form.reset();
      },
      error: () => this.error.set('Could not add the topic. Please try again.'),
    });
  }

  private loadCourse(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getCourse(id).subscribe({
      next: (course) => {
        this.course.set(course);
        this.loading.set(false);
      },
      error: () => {
        this.course.set(undefined);
        this.error.set('Could not load this course. Log in, then try again.');
        this.loading.set(false);
      },
    });
  }

  private celebrate(): void {
    this.showToast.set(true);
    window.setTimeout(() => this.showToast.set(false), 3000);

    const colors = ['#E8C468', '#E0765E', '#8FAE8B', '#82AAFF', '#F2EFE6'];
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 22; i++) {
      const id = this.confettiCounter++;
      pieces.push({
        id,
        color: colors[i % colors.length],
        x: `${Math.round((Math.random() - 0.5) * 420)}px`,
        y: `${Math.round(120 + Math.random() * 220)}px`,
        spin: `${Math.round(Math.random() * 180)}deg`,
        delay: `${i * 14}ms`,
      });
    }
    this.confetti.set(pieces);
    window.setTimeout(() => this.confetti.set([]), 1300);
  }
}
