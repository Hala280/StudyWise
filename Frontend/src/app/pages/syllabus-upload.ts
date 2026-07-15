import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudyWiseApi } from '../services/studywise-api';
import { Course } from '../../ts/data/courses';

type UploadStatus = 'idle' | 'uploading' | 'parsed' | 'failed';

interface ParsedTopic {
  id: string;
  title: string;
  estMinutes: number;
  include: boolean;
}

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="animate-page max-w-3xl mx-auto px-6 py-12">
      <div class="reveal-item mb-10">
        <p class="font-hand text-2xl accent mb-1">new material</p>
        <h1 class="font-display text-5xl text-ink-900 dark:text-paper mb-4">Upload a syllabus</h1>
        <p class="text-sm surface-muted max-w-lg leading-relaxed">
          Drop in a PDF syllabus and we'll pull out a topic list straight into the selected course.
        </p>
      </div>

      <div class="reveal-item flex flex-col gap-1.5 mb-6" style="--delay: 60ms">
        <label for="target-course" class="text-sm font-medium text-ink-900 dark:text-paper">Add topics to</label>
        <select
          id="target-course"
          [ngModel]="courseId()"
          (ngModelChange)="courseId.set($event)"
          [disabled]="status() === 'uploading'"
          class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-600 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150 disabled:opacity-50"
        >
          @if (courses().length === 0) {
            <option value="" disabled>No courses yet — create one first</option>
          }
          @for (course of courses(); track course.id) {
            <option [value]="course.id">{{ course.title }}</option>
          }
        </select>
      </div>

      <div
        class="reveal-item"
        style="--delay: 110ms"
      >
        <div
          class="relative rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors duration-150"
          [class.border-ink-100]="!dragOver() && status() === 'idle'"
          [class.dark:border-ink-600]="!dragOver() && status() === 'idle'"
          [class.border-amber]="dragOver()"
          [class.bg-amber-light/10]="dragOver()"
          [class.border-ink-100]="status() !== 'idle' && !dragOver()"
          [class.dark:border-ink-600]="status() !== 'idle'"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          @switch (status()) {
            @case ('idle') {
              <svg class="w-10 h-10 mx-auto mb-4 text-ink-400 dark:text-ink-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3.75 3.75 0 014.133 5.02A4.5 4.5 0 0117.25 19.5H6.75z" />
              </svg>
              <p class="text-sm font-medium text-ink-900 dark:text-paper mb-1">Drag and drop a file here</p>
              <p class="text-xs surface-muted mb-5">PDF only — up to 10MB</p>
              <label class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition inline-block cursor-pointer">
                Choose a file
                <input type="file" class="sr-only" (change)="onFileChosen($event)" />
              </label>
            }
            @case ('uploading') {
              <div class="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-ink-100 dark:border-ink-600 border-t-amber animate-spin"></div>
              <p class="text-sm font-medium text-ink-900 dark:text-paper mb-1">Uploading {{ fileName() }}…</p>
              <p class="text-xs surface-muted">Reading and parsing topics</p>
            }
            @case ('parsed') {
              <svg class="w-10 h-10 mx-auto mb-4 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm font-medium text-ink-900 dark:text-paper mb-1">{{ fileName() }} parsed</p>
              <p class="text-xs surface-muted mb-5">Found {{ parsedTopics().length }} topics — review them below</p>
              <button type="button" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition" (click)="reset()">Upload a different file</button>
            }
            @case ('failed') {
              <svg class="w-10 h-10 mx-auto mb-4 text-[#C15A3F] dark:text-[#E0765E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p class="text-sm font-medium text-ink-900 dark:text-paper mb-1">Upload failed</p>
              <p class="text-xs surface-muted mb-5">{{ error() || fileName() + " couldn't be parsed. Try again with a different file." }}</p>
              <button type="button" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition" (click)="reset()">Try again</button>
            }
          }
        </div>
      </div>

      @if (status() === 'parsed') {
        <div class="reveal-item mt-10" style="--delay: 60ms">
          <div class="flex items-center justify-between mb-4">
            <p class="font-hand text-xl accent">parsed topics</p>
            <button type="button" class="text-xs font-medium accent hover:opacity-80" (click)="toggleAll()">
              {{ allSelected() ? 'Deselect all' : 'Select all' }}
            </button>
          </div>

          <div class="rounded-xl border border-ink-100 dark:border-ink-600 overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b hairline bg-ink-50/50 dark:bg-ink-900/40">
                  <th class="w-10 py-3 pl-4"></th>
                  <th class="text-left py-3 pr-4 font-medium text-ink-400 dark:text-ink-200">Topic</th>
                  <th class="text-right py-3 pr-4 font-medium text-ink-400 dark:text-ink-200 w-28">Est. time</th>
                </tr>
              </thead>
              <tbody>
                @for (topic of parsedTopics(); track topic.id) {
                  <tr class="border-b hairline last:border-b-0">
                    <td class="py-3 pl-4">
                      <input
                        type="checkbox"
                        [checked]="topic.include"
                        (change)="toggleTopic(topic.id)"
                        class="w-4 h-4 rounded border-ink-200 dark:border-ink-400 text-amber focus:ring-amber cursor-pointer"
                      />
                    </td>
                    <td
                      class="py-3 pr-4"
                      [class.text-ink-900]="topic.include"
                      [class.dark:text-paper]="topic.include"
                      [class.text-ink-400]="!topic.include"
                      [class.dark:text-ink-200]="!topic.include"
                    >
                      {{ topic.title }}
                    </td>
                    <td class="py-3 pr-4 text-right text-ink-400 dark:text-ink-200">{{ topic.estMinutes }} min</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between mt-6">
            <p class="text-xs surface-muted">{{ selectedCount() }} of {{ parsedTopics().length }} selected</p>
            <div class="flex gap-3">
              <button type="button" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition" (click)="reset()">Cancel</button>
              <button
                type="button"
                [disabled]="parsedTopics().length === 0 || !courseId()"
                class="cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                (click)="confirmAddTopics()"
              >
                Open course
              </button>
            </div>
          </div>
        </div>
      }
    </section>

    @if (confirmedToast()) {
      <div class="completion-toast">
        <p class="font-hand text-2xl">Topics added</p>
        <p class="text-sm opacity-80 mt-1">{{ confirmedCount() }} topic{{ confirmedCount() === 1 ? '' : 's' }} added to {{ confirmedCourseTitle() }}.</p>
      </div>
    }
  `,
})
export class SyllabusUploadPage {
  courses = signal<Course[]>([]);
  courseId = signal<string>('');

  status = signal<UploadStatus>('idle');
  dragOver = signal(false);
  fileName = signal('');
  error = signal<string | null>(null);

  parsedTopics = signal<ParsedTopic[]>([]);

  confirmedToast = signal(false);
  confirmedCount = signal(0);
  confirmedCourseTitle = signal('');

  selectedCount = computed(() => this.parsedTopics().filter((t) => t.include).length);
  allSelected = computed(() => this.parsedTopics().length > 0 && this.parsedTopics().every((t) => t.include));

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: StudyWiseApi
  ) {
    this.api.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        const requestedCourseId = this.route.snapshot.queryParamMap.get('courseId');
        const target = courses.find((course) => course.id === requestedCourseId) ?? courses[0];
        if (target) this.courseId.set(target.id);
      },
      error: () => {
        this.error.set('Could not load courses. Log in, then try again.');
        this.status.set('failed');
      },
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.status() === 'idle') this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    if (this.status() !== 'idle') return;

    const file = event.dataTransfer?.files?.[0];
    this.startUpload(file);
  }

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.startUpload(file);
  }

  private startUpload(file?: File): void {
    if (!file || !this.courseId()) return;

    this.fileName.set(file.name);
    this.error.set(null);
    this.status.set('uploading');

    this.api.parseSyllabus(this.courseId(), file).subscribe({
      next: (result) => {
        this.parsedTopics.set(
          result.topics.map((t) => ({
            id: String(t.id),
            title: t.title,
            estMinutes: t.estimatedHours * 60,
            include: true,
          }))
        );
        this.status.set('parsed');
      },
      error: (err) => {
        this.error.set(typeof err.error === 'string' ? err.error : 'The backend could not parse this PDF.');
        this.status.set('failed');
      },
    });
  }

  toggleTopic(id: string): void {
    this.parsedTopics.update((topics) =>
      topics.map((t) => (t.id === id ? { ...t, include: !t.include } : t))
    );
  }

  toggleAll(): void {
    const next = !this.allSelected();
    this.parsedTopics.update((topics) => topics.map((t) => ({ ...t, include: next })));
  }

  reset(): void {
    this.status.set('idle');
    this.fileName.set('');
    this.error.set(null);
    this.parsedTopics.set([]);
  }

  confirmAddTopics(): void {
    const id = this.courseId();
    const course = this.courses().find((c) => c.id === id);
    if (!course) return;

    const toAdd = this.parsedTopics().filter((t) => t.include);
    this.confirmedCount.set(toAdd.length);
    this.confirmedCourseTitle.set(course.title);
    this.confirmedToast.set(true);
    window.setTimeout(() => this.confirmedToast.set(false), 3000);

    this.reset();
    this.router.navigate(['/courses', course.id]);
  }
}
