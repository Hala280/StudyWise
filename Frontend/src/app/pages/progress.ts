import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StudyWiseApi } from '../services/studywise-api';
import { Course, courseProgress, courseTotalHours } from '../../ts/data/courses';

const SUBJECT_BAR: Record<Course['color'], string> = {
  amber: 'bg-amber',
  sage: 'bg-sage',
  coral: 'bg-[#E0765E]',
  ink: 'bg-ink-400',
};

const SUBJECT_CHIP: Record<Course['color'], string> = {
  amber: 'bg-amber-light/40 text-amber-dark dark:bg-amber/20 dark:text-amber-light',
  sage: 'bg-sage-light/30 text-sage dark:bg-sage/20 dark:text-sage-light',
  coral: 'bg-[#E0765E]/15 text-[#C15A3F] dark:text-[#E0765E]',
  ink: 'bg-ink-50 text-ink-600 dark:bg-ink-600 dark:text-ink-100',
};

interface DayStudied {
  label: string; // Mon, Tue, ...
  minutes: number;
}

interface DifficultTopic {
  id: string;
  title: string;
  courseTitle: string;
  color: Course['color'];
  missedReviews: number;
}

const EMPTY_WEEK: DayStudied[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({ label, minutes: 0 }));

@Component({
  standalone: true,
  template: `
    <section class="animate-page max-w-6xl mx-auto px-6 py-12">
      <div class="reveal-item mb-10">
        <p class="font-hand text-2xl accent mb-1">the report card</p>
        <h1 class="font-display text-5xl text-ink-900 dark:text-paper">Progress</h1>
      </div>

      <!-- Top row: streak + overall stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">

        <div class="reveal-item rounded-xl border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 p-6 flex flex-col justify-between" style="--delay: 60ms">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-200">Topics completed</p>
          <p class="font-display text-5xl text-ink-900 dark:text-paper mt-3">{{ totalDone() }}<span class="text-xl font-body font-normal surface-muted ml-1">/ {{ totalTopics() }}</span></p>
          <p class="text-xs surface-muted mt-2">Across {{ courses().length }} course{{ courses().length === 1 ? '' : 's' }}</p>
        </div>
      </div>

      <!-- Course completion widgets -->
      <div class="reveal-item mb-10" style="--delay: 60ms">
        <p class="font-hand text-xl accent mb-4">course completion</p>

        @if (courses().length === 0) {
          <div class="rounded-xl border-2 border-dashed border-ink-100 dark:border-ink-600 px-6 py-12 text-center">
            <p class="text-sm surface-muted">No courses yet — add one to start tracking progress.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (course of courses(); track course.id; let i = $index) {
              <button
                type="button"
                class="reveal-item text-left rounded-xl border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                [style.--delay]="(i * 70) + 'ms'"
                (click)="goToCourse(course.id)"
              >
                <div class="flex items-start justify-between gap-3 mb-3">
                  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" [class]="chipClass(course)">{{ course.subject }}</span>
                  <span class="font-display text-2xl text-ink-900 dark:text-paper shrink-0">{{ progress(course) }}%</span>
                </div>
                <h3 class="text-base font-semibold text-ink-900 dark:text-paper mb-3 leading-snug">{{ course.title }}</h3>
                <div class="w-full h-2 rounded-full bg-ink-50 dark:bg-ink-900 overflow-hidden">
                  <div class="progress-fill h-full rounded-full transition-all duration-500" [class]="barClass(course)" [style.width.%]="progress(course)"></div>
                </div>
                <p class="text-xs surface-muted mt-2">{{ doneCount(course) }}/{{ course.topics.length }} topics · ~{{ totalHours(course) }}h left</p>
              </button>
            }
          </div>
        }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <!-- Most difficult topics -->
        <div class="reveal-item lg:col-span-2 rounded-xl border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 p-6" style="--delay: 140ms">
          <p class="font-hand text-xl accent mb-1">toughest topics</p>
          <p class="text-xs surface-muted mb-5">Longest remaining topics</p>

          @if (difficultTopics().length === 0) {
            <div class="rounded-lg border-2 border-dashed border-ink-100 dark:border-ink-600 px-4 py-8 text-center">
              <p class="text-sm surface-muted">No unfinished topics to review.</p>
            </div>
          } @else {
            <ul class="flex flex-col gap-3">
              @for (topic of difficultTopics(); track topic.id; let i = $index) {
              <li class="reveal-item flex items-center gap-3" [style.--delay]="(i * 60) + 'ms'">
                <span class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" [class]="chipClass2(topic.color)">
                  {{ i + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-ink-900 dark:text-paper truncate">{{ topic.title }}</p>
                  <p class="text-xs surface-muted truncate">{{ topic.courseTitle }}</p>
                </div>
                <span class="text-xs text-ink-400 dark:text-ink-200 shrink-0">~{{ topic.missedReviews }}m</span>
              </li>
              }
            </ul>
          }
        </div>
      </div>
    </section>
  `,
})
export class ProgressPage {
  courses = signal<Course[]>([]);

  streakDays = signal(0);
  bestStreak = signal(0);

  week = signal<DayStudied[]>(EMPTY_WEEK);
  difficultTopics = computed<DifficultTopic[]>(() =>
    this.courses()
      .flatMap((course) =>
        course.topics
          .filter((topic) => !topic.done)
          .map((topic) => ({
            id: topic.id,
            title: topic.title,
            courseTitle: course.title,
            color: course.color,
            missedReviews: topic.estMinutes,
          }))
      )
      .sort((a, b) => b.missedReviews - a.missedReviews)
      .slice(0, 5)
  );

  totalTopics = computed(() => this.courses().reduce((sum, c) => sum + c.topics.length, 0));
  totalDone = computed(() => this.courses().reduce((sum, c) => sum + c.topics.filter((t) => t.done).length, 0));

  weekMinutesTotal = computed(() => this.week().reduce((sum, d) => sum + d.minutes, 0));
  weekHours = computed(() => Math.round((this.weekMinutesTotal() / 60) * 10) / 10);

  private maxDayMinutes = computed(() => Math.max(...this.week().map((d) => d.minutes), 1));

  constructor(
    private router: Router,
    private api: StudyWiseApi
  ) {
    this.api.getCourses().subscribe({
      next: (courses) => this.courses.set(courses),
      error: () => this.courses.set([]),
    });
  }

  progress(course: Course): number {
    return courseProgress(course);
  }

  totalHours(course: Course): number {
    return courseTotalHours(course);
  }

  doneCount(course: Course): number {
    return course.topics.filter((t) => t.done).length;
  }

  chipClass(course: Course): string {
    return SUBJECT_CHIP[course.color];
  }

  barClass(course: Course): string {
    return SUBJECT_BAR[course.color];
  }

  chipClass2(color: Course['color']): string {
    return SUBJECT_CHIP[color];
  }

  barHeight(minutes: number): number {
    if (minutes === 0) return 3; // sliver so the "no study" day is still visible
    return Math.max(6, Math.round((minutes / this.maxDayMinutes()) * 100));
  }

  weekComparisonLabel(): string {
    const total = this.weekMinutesTotal();
    if (total === 0) return 'No sessions logged yet';
    return 'Based on completed study sessions';
  }

  goToCourse(id: string): void {
    this.router.navigate(['/courses', id]);
  }
}
