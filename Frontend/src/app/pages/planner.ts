import { Component, ElementRef, QueryList, ViewChildren, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getCourses, type Course } from '../../ts/data/courses';
import {
  getStudyBlocksByCourse,
  findConflictingBlockIds,
  courseColorFor,
  createStudyBlock,
  updateStudyBlock,
  deleteStudyBlock,
  isOvernightBlock,
  overflowMinutes,
  MINUTES_PER_DAY,
  type StudyBlock,
} from '../../ts/data/planner';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_START_MIN = 0;
const DAY_END_MIN = 24 * 60;
const PX_PER_MIN = 1.1;
const GRID_HEIGHT = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN;
const SNAP_MIN = 15;
const MIN_BLOCK_PX = 40;
const DRAG_THRESHOLD_PX = 6;
const TAIL_ID_PREFIX = '__tail__:';

const BLOCK_STYLES: Record<Course['color'], { bg: string; border: string; text: string; solid: string }> = {
  amber: {
    bg: 'bg-amber-light/50 dark:bg-amber/25',
    border: 'border-amber-dark/50 dark:border-amber/60',
    text: 'text-amber-dark dark:text-amber-light',
    solid: 'bg-amber',
  },
  sage: {
    bg: 'bg-sage-light/40 dark:bg-sage/25',
    border: 'border-sage/50 dark:border-sage/60',
    text: 'text-sage dark:text-sage-light',
    solid: 'bg-sage',
  },
  coral: {
    bg: 'bg-[#E0765E]/20 dark:bg-[#E0765E]/25',
    border: 'border-[#E0765E]/50 dark:border-[#E0765E]/60',
    text: 'text-[#C15A3F] dark:text-[#E0765E]',
    solid: 'bg-[#E0765E]',
  },
  ink: {
    bg: 'bg-ink-50 dark:bg-ink-600',
    border: 'border-ink-200 dark:border-ink-400',
    text: 'text-ink-600 dark:text-ink-100',
    solid: 'bg-ink-400',
  },
};

function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function minutesToTimeInput(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

interface ColInfo {
  col: number;
  cols: number;
}

/** Groups same-day blocks into overlap clusters, assigning column index + column count so overlapping blocks render side-by-side. */
function layoutDay(blocks: StudyBlock[]): Map<string, ColInfo> {
  const layout = new Map<string, ColInfo>();
  const sorted = [...blocks].sort((a, b) => a.startMinutes - b.startMinutes);

  let cluster: StudyBlock[] = [];
  let clusterEnd = -Infinity;

  function flushCluster(): void {
    if (cluster.length === 0) return;
    const columns: number[] = [];
    const assigned: { block: StudyBlock; col: number }[] = [];

    cluster.forEach((b) => {
      const end = b.startMinutes + b.durationMinutes;
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= b.startMinutes) {
          columns[c] = end;
          assigned.push({ block: b, col: c });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push(end);
        assigned.push({ block: b, col: columns.length - 1 });
      }
    });

    const totalCols = columns.length;
    assigned.forEach(({ block, col }) => layout.set(block.id, { col, cols: totalCols }));
    cluster = [];
  }

  sorted.forEach((b) => {
    if (b.startMinutes >= clusterEnd) {
      flushCluster();
      clusterEnd = b.startMinutes + b.durationMinutes;
    } else {
      clusterEnd = Math.max(clusterEnd, b.startMinutes + b.durationMinutes);
    }
    cluster.push(b);
  });
  flushCluster();

  return layout;
}

interface SegmentOverride {
  top: number;
  height: number;
  interactive: boolean;
  continuesBefore?: boolean;
  continuesAfter?: boolean;
}

interface RenderCard {
  block: StudyBlock;
  day: number;
  hasConflict: boolean;
  colInfo: ColInfo;
  segment?: SegmentOverride;
  key: string;
}

interface DragState {
  block: StudyBlock;
  originDay: number;
  originStart: number;
  pointerOffsetY: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
  liveDay: number;
  liveStart: number;
}

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="animate-page max-w-6xl mx-auto px-6 py-12">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-6">
        <div>
          <p class="font-hand text-2xl accent mb-1">this week</p>
          <h1 class="font-display text-5xl text-ink-900 dark:text-paper">Planner</h1>
        </div>
        <div class="flex items-center gap-3">
          <select
            [ngModel]="courseFilter()"
            (ngModelChange)="onFilterChange($event)"
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-600 px-4 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150"
          >
            <option value="all">All courses</option>
            @for (course of courses(); track course.id) {
              <option [value]="course.id">{{ course.title }}</option>
            }
          </select>
          <button
            type="button"
            (click)="openAddModal()"
            class="cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition whitespace-nowrap"
          >
            + Add block
          </button>
        </div>
      </div>

      @if (conflictIds().size > 0) {
        <div class="reveal-item mb-4 rounded-lg border border-[#E0765E]/40 bg-[#E0765E]/10 px-4 py-3 text-sm text-[#C15A3F] dark:text-[#E0765E] flex items-center gap-2">
          <span>⚠</span>
          <span>{{ conflictBannerText() }}</span>
        </div>
      }

      <div class="flex items-center gap-2 mb-4 text-xs surface-muted">
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span>Click a block to view or edit it, or drag it to a new day or time. Resizing and auto conflict-resolution aren't built yet — overlaps are allowed and flagged.</span>
      </div>

      <div class="rounded-xl border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 overflow-hidden">
        <div class="overflow-x-auto">
          <div class="grid min-w-[880px]" style="grid-template-columns: 60px repeat(7, 1fr);">
            <div class="border-b border-r border-ink-100 dark:border-ink-600"></div>
            @for (label of dayLabels; track label) {
              <div class="border-b border-l border-ink-100 dark:border-ink-600 px-2 py-3 text-center text-xs font-semibold text-ink-600 dark:text-ink-100">
                {{ label }}
              </div>
            }

            <div class="relative border-r border-ink-100 dark:border-ink-600" [style.height.px]="gridHeight">
              @for (m of hourMarks; track m) {
                <div
                  class="absolute -translate-y-1/2 text-[10px] text-ink-400 dark:text-ink-200 pr-2 w-full text-right"
                  [style.top.px]="m * pxPerMin"
                >
                  {{ formatTime(m) }}
                </div>
              }
            </div>

            @for (day of dayIndices; track day) {
              <div
                #dayColumn
                class="relative border-l last:border-r border-ink-100 dark:border-ink-600"
                [style.height.px]="gridHeight"
                [attr.data-day]="day"
              >
                @for (m of hourMarks; track m) {
                  <div class="absolute left-0 right-0 border-t border-ink-50 dark:border-ink-900 pointer-events-none" [style.top.px]="m * pxPerMin"></div>
                }

                @for (card of cardsForDay(day); track card.key) {
                  <div
                    class="study-block group absolute border px-2.5 py-2 overflow-hidden select-none shadow-sm hover:shadow-md hover:z-20 transition-shadow"
                    [class]="cardClasses(card)"
                    [style.top.px]="cardTop(card)"
                    [style.height.px]="cardHeight(card)"
                    [style.left]="cardLeft(card)"
                    [style.width]="cardWidth(card)"
                    style="touch-action: none;"
                    [title]="cardTitle(card)"
                    (pointerdown)="card.segment?.interactive === false ? null : onPointerDown($event, card)"
                  >
                    <div class="flex items-start justify-between gap-1">
                      <span class="w-1.5 h-1.5 rounded-full shrink-0 mt-1" [class]="blockStyles(card.block).solid"></span>
                      <div class="min-w-0 flex-1">
                        <p class="text-[10.5px] font-semibold uppercase tracking-wide truncate leading-tight">{{ courseTitle(card.block.courseId) }}</p>
                        @if (!isCompact(card)) {
                          <p class="text-xs font-medium leading-snug mt-0.5 truncate">{{ card.block.topicTitle }}</p>
                        }
                      </div>
                      @if (card.segment?.interactive !== false) {
                        <button
                          type="button"
                          class="remove-block shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none w-4 h-4 flex items-center justify-center hover:opacity-70"
                          aria-label="Remove study block"
                          (pointerdown)="$event.stopPropagation()"
                          (click)="removeBlock($event, card.block.id)"
                        >&times;</button>
                      }
                    </div>
                    @if (!isCompact(card)) {
                      <p class="text-[10px] opacity-75 mt-1 truncate">
                        {{ segmentTimeLabel(card) }}{{ card.hasConflict ? ' · ⚠ conflict' : '' }}
                      </p>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </section>

    @if (addModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm px-4" (click)="onOverlayClick($event, closeAddModal.bind(this))">
        <div class="animate-page w-full max-w-md rounded-xl bg-paper dark:bg-ink-600 border border-ink-100 dark:border-ink-400 shadow-xl p-6" role="dialog" aria-modal="true">
          <div class="flex items-start justify-between mb-5">
            <div>
              <p class="font-hand text-xl accent">new block</p>
              <h2 class="font-display text-3xl text-ink-900 dark:text-paper">Add study block</h2>
            </div>
            <button type="button" aria-label="Close" class="text-ink-400 dark:text-ink-200 hover:text-ink-900 dark:hover:text-paper text-xl leading-none" (click)="closeAddModal()">&times;</button>
          </div>
          <form class="flex flex-col gap-4" (submit)="submitAddForm($event)">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-ink-900 dark:text-paper">Course</label>
              <select name="courseId" required class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150">
                @for (course of courses(); track course.id) {
                  <option [value]="course.id">{{ course.title }}</option>
                }
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-ink-900 dark:text-paper">Topic</label>
              <input name="topicTitle" type="text" required placeholder="e.g. Review chapter 4" class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-ink-900 dark:text-paper">Day</label>
                <select name="day" required class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150">
                  @for (label of dayLabels; track label; let i = $index) {
                    <option [value]="i">{{ label }}</option>
                  }
                </select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-ink-900 dark:text-paper">Start time</label>
                <input name="start" type="time" required value="09:00" class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-ink-900 dark:text-paper">Duration (minutes)</label>
              <input name="duration" type="number" min="10" step="5" required value="45" class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
            </div>
            <div class="flex gap-3 mt-2">
              <button type="submit" class="flex-1 cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition">Add block</button>
              <button type="button" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition" (click)="closeAddModal()">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (editModalOpen() && editingBlock()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm px-4" (click)="onOverlayClick($event, closeEditModal.bind(this))">
        <div class="animate-page w-full max-w-md rounded-xl bg-paper dark:bg-ink-600 border border-ink-100 dark:border-ink-400 shadow-xl p-6" role="dialog" aria-modal="true">
          <div class="flex items-start justify-between mb-5">
            <div>
              <p class="font-hand text-xl accent">study block</p>
              <h2 class="font-display text-3xl text-ink-900 dark:text-paper">Edit block</h2>
            </div>
            <button type="button" aria-label="Close" class="text-ink-400 dark:text-ink-200 hover:text-ink-900 dark:hover:text-paper text-xl leading-none" (click)="closeEditModal()">&times;</button>
          </div>
          <form class="flex flex-col gap-4" (submit)="submitEditForm($event)">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-ink-900 dark:text-paper">Course</label>
              <select name="courseId" required [value]="editingBlock()!.courseId" class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150">
                @for (course of courses(); track course.id) {
                  <option [value]="course.id">{{ course.title }}</option>
                }
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-ink-900 dark:text-paper">Topic</label>
              <input name="topicTitle" type="text" required [value]="editingBlock()!.topicTitle" class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-ink-900 dark:text-paper">Day</label>
                <select name="day" required [value]="editingBlock()!.day" class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150">
                  @for (label of dayLabels; track label; let i = $index) {
                    <option [value]="i">{{ label }}</option>
                  }
                </select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-ink-900 dark:text-paper">Start time</label>
                <input name="start" type="time" required [value]="minutesToTimeInput(editingBlock()!.startMinutes)" class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-ink-900 dark:text-paper">Duration (minutes)</label>
              <input name="duration" type="number" min="10" step="5" required [value]="editingBlock()!.durationMinutes" class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
            </div>
            <div class="flex gap-3 mt-2">
              <button type="submit" class="flex-1 cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition">Save changes</button>
              <button type="button" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition" (click)="closeEditModal()">Cancel</button>
            </div>
            <button type="button" class="text-xs font-medium text-[#C15A3F] dark:text-[#E0765E] hover:opacity-75 transition self-center mt-1" (click)="deleteEditingBlock()">
              Delete this study block
            </button>
          </form>
        </div>
      </div>
    }
  `,
})
export class PlannerPage {
  @ViewChildren('dayColumn') dayColumnEls!: QueryList<ElementRef<HTMLElement>>;

  readonly dayLabels = DAY_LABELS;
  readonly dayIndices = [0, 1, 2, 3, 4, 5, 6];
  readonly hourMarks = (() => {
    const marks: number[] = [];
    for (let m = DAY_START_MIN; m < DAY_END_MIN; m += 60) marks.push(m);
    return marks;
  })();
  readonly gridHeight = GRID_HEIGHT;
  readonly pxPerMin = PX_PER_MIN;

  courses = signal<Course[]>(getCourses());
  courseFilter = signal<string>('all');
  blocksVersion = signal(0); // bump to force recompute after mutations

  addModalOpen = signal(false);
  editModalOpen = signal(false);
  editingBlock = signal<StudyBlock | null>(null);

  private drag: DragState | null = null;

  visibleBlocks(): StudyBlock[] {
    this.blocksVersion();
    return getStudyBlocksByCourse(this.courseFilter() as 'all' | string);
  }

  conflictIds(): Set<string> {
    return findConflictingBlockIds(this.visibleBlocks());
  }

  conflictBannerText(): string {
    const count = this.conflictIds().size;
    if (count === 2) return '2 study blocks overlap in time. Drag one to a free slot to clear the conflict.';
    return `${count} study blocks overlap in time. Drag them to free slots to clear the conflicts.`;
  }

  cardsForDay(day: number): RenderCard[] {
    const visibleBlocks = this.visibleBlocks();
    const conflictIds = this.conflictIds();
    const overnightBlocks = visibleBlocks.filter((b) => isOvernightBlock(b));

    const dayBlocks = visibleBlocks.filter((b) => b.day === day);
    const incomingTails = overnightBlocks
      .filter((b) => (b.day + 1) % 7 === day)
      .map((b) => ({
        id: `${TAIL_ID_PREFIX}${b.id}`,
        courseId: b.courseId,
        topicTitle: b.topicTitle,
        day,
        startMinutes: DAY_START_MIN,
        durationMinutes: overflowMinutes(b),
      }));

    const dayLayout = layoutDay([...dayBlocks, ...incomingTails]);
    const cards: RenderCard[] = [];

    dayBlocks.forEach((b) => {
      // Drag preview: show the block at its live (uncommitted) position while dragging.
      const isDragging = this.drag && this.drag.block.id === b.id && this.drag.moved;
      if (isDragging && this.drag!.liveDay !== day) return; // rendered under its live day's column instead

      const overnight = isOvernightBlock(b);
      const colInfo = dayLayout.get(b.id) ?? { col: 0, cols: 1 };
      cards.push({
        block: isDragging ? { ...b, day: this.drag!.liveDay, startMinutes: this.drag!.liveStart } : b,
        day,
        hasConflict: conflictIds.has(b.id),
        colInfo: isDragging ? { col: 0, cols: 1 } : colInfo,
        segment:
          overnight && !isDragging
            ? {
                top: (b.startMinutes - DAY_START_MIN) * PX_PER_MIN,
                height: (DAY_END_MIN - b.startMinutes) * PX_PER_MIN,
                interactive: true,
                continuesAfter: true,
              }
            : undefined,
        key: b.id,
      });
    });

    // A block currently being dragged onto this day (from elsewhere) renders live here too.
    if (this.drag && this.drag.moved && this.drag.liveDay === day && !dayBlocks.some((b) => b.id === this.drag!.block.id)) {
      cards.push({
        block: { ...this.drag.block, day: this.drag.liveDay, startMinutes: this.drag.liveStart },
        day,
        hasConflict: conflictIds.has(this.drag.block.id),
        colInfo: { col: 0, cols: 1 },
        key: this.drag.block.id,
      });
    }

    incomingTails.forEach((tail) => {
      const original = overnightBlocks.find((b) => `${TAIL_ID_PREFIX}${b.id}` === tail.id);
      if (!original) return;
      if (this.drag && this.drag.moved && this.drag.block.id === original.id) return; // being dragged, skip static tail
      const colInfo = dayLayout.get(tail.id) ?? { col: 0, cols: 1 };
      cards.push({
        block: original,
        day,
        hasConflict: conflictIds.has(original.id),
        colInfo,
        segment: {
          top: 0,
          height: overflowMinutes(original) * PX_PER_MIN,
          interactive: false,
          continuesBefore: true,
        },
        key: tail.id,
      });
    });

    return cards;
  }

  formatTime(m: number): string {
    return formatTime(m);
  }

  minutesToTimeInput(m: number): string {
    return minutesToTimeInput(m);
  }

  courseTitle(courseId: string): string {
    return this.courses().find((c) => c.id === courseId)?.title ?? 'Unknown course';
  }

  blockStyles(block: StudyBlock) {
    return BLOCK_STYLES[courseColorFor(block.courseId)];
  }

  isCompact(card: RenderCard): boolean {
    return this.cardHeight(card) < 56;
  }

  cardTop(card: RenderCard): number {
    if (card.segment) return card.segment.top;
    return (card.block.startMinutes - DAY_START_MIN) * PX_PER_MIN;
  }

  cardHeight(card: RenderCard): number {
    if (card.segment) return Math.max(card.segment.height, 18);
    return Math.max(card.block.durationMinutes * PX_PER_MIN, MIN_BLOCK_PX);
  }

  cardLeft(card: RenderCard): string {
    const gapPct = 3;
    const widthPct = 100 / card.colInfo.cols;
    const leftPct = card.colInfo.col * widthPct;
    return `calc(${leftPct}% + ${card.colInfo.col > 0 ? gapPct / 2 : 0}px)`;
  }

  cardWidth(card: RenderCard): string {
    const gapPct = 3;
    const widthPct = 100 / card.colInfo.cols;
    return `calc(${widthPct}% - ${card.colInfo.cols > 1 ? gapPct : 0}px)`;
  }

  cardTitle(card: RenderCard): string {
    const fullRangeLabel = `${formatTime(card.block.startMinutes)}–${formatTime(
      isOvernightBlock(card.block) ? overflowMinutes(card.block) : card.block.startMinutes + card.block.durationMinutes
    )}${isOvernightBlock(card.block) ? ' (+1 day)' : ''}`;
    return `${this.courseTitle(card.block.courseId)} — ${card.block.topicTitle}\n${fullRangeLabel}`;
  }

  segmentTimeLabel(card: RenderCard): string {
    if (card.segment?.continuesBefore) return `⋯ continues from ${formatTime(card.block.startMinutes)} yesterday`;
    if (card.segment?.continuesAfter) return `${formatTime(card.block.startMinutes)}–12AM, continues ⋯`;
    return `${formatTime(card.block.startMinutes)}–${formatTime(card.block.startMinutes + card.block.durationMinutes)}`;
  }

  cardClasses(card: RenderCard): string {
    const styles = this.blockStyles(card.block);
    const interactive = card.segment ? card.segment.interactive : true;
    const roundedClasses = card.segment?.continuesBefore
      ? 'rounded-b-lg rounded-t-none'
      : card.segment?.continuesAfter
        ? 'rounded-t-lg rounded-b-none'
        : 'rounded-lg';
    return [
      roundedClasses,
      interactive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
      styles.bg,
      styles.border,
      styles.text,
      card.hasConflict ? 'ring-2 ring-offset-1 ring-[#C15A3F] dark:ring-[#E0765E] dark:ring-offset-ink-600' : '',
      card.segment?.continuesBefore ? 'border-dashed border-t-2' : '',
      card.segment?.continuesAfter ? 'border-dashed border-b-2' : '',
      this.drag && this.drag.moved && this.drag.block.id === card.block.id ? 'z-30 opacity-90 shadow-lg' : '',
    ].join(' ');
  }

  onFilterChange(value: string): void {
    this.courseFilter.set(value);
  }

  removeBlock(event: Event, blockId: string): void {
    event.stopPropagation();
    event.preventDefault();
    deleteStudyBlock(blockId);
    this.blocksVersion.update((v) => v + 1);
  }

  onPointerDown(event: PointerEvent, card: RenderCard): void {
    if ((event.target as HTMLElement).closest('.remove-block')) return;
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.drag = {
      block: card.block,
      originDay: card.block.day,
      originStart: card.block.startMinutes,
      pointerOffsetY: event.clientY - rect.top,
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false,
      liveDay: card.block.day,
      liveStart: card.block.startMinutes,
    };
    target.setPointerCapture(event.pointerId);

    const onMove = (e: PointerEvent) => this.handlePointerMove(e);
    const onUp = (e: PointerEvent) => {
      this.handlePointerUp(e, target);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.drag) return;

    if (!this.drag.moved) {
      const dx = e.clientX - this.drag.startClientX;
      const dy = e.clientY - this.drag.startClientY;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      this.drag.moved = true;
    }

    const columns = this.dayColumnEls.toArray().map((c) => c.nativeElement);
    let targetDay = this.drag.liveDay;
    let targetCol: HTMLElement | undefined;
    for (let i = 0; i < columns.length; i++) {
      const rect = columns[i].getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX < rect.right) {
        targetDay = i;
        targetCol = columns[i];
        break;
      }
    }
    if (!targetCol) targetCol = columns[targetDay];

    const colRect = targetCol.getBoundingClientRect();
    const rawY = e.clientY - colRect.top - this.drag.pointerOffsetY;
    const rawMinutes = DAY_START_MIN + rawY / PX_PER_MIN;
    const snapped = Math.round(rawMinutes / SNAP_MIN) * SNAP_MIN;
    const clampedStart = clamp(snapped, DAY_START_MIN, DAY_END_MIN - SNAP_MIN);

    this.drag.liveDay = targetDay;
    this.drag.liveStart = clampedStart;
    this.blocksVersion.update((v) => v + 1); // trigger re-render for live drag preview
  }

  private handlePointerUp(e: PointerEvent, target: HTMLElement): void {
    if (!this.drag) return;
    target.releasePointerCapture(e.pointerId);

    if (this.drag.moved) {
      const changed = this.drag.liveDay !== this.drag.originDay || this.drag.liveStart !== this.drag.originStart;
      if (changed) {
        updateStudyBlock(this.drag.block.id, { day: this.drag.liveDay, startMinutes: this.drag.liveStart });
      }
      this.drag = null;
      this.blocksVersion.update((v) => v + 1);
    } else {
      const openedBlock = this.drag.block;
      this.drag = null;
      this.editingBlock.set(openedBlock);
      this.editModalOpen.set(true);
    }
  }

  onOverlayClick(event: MouseEvent, close: () => void): void {
    if (event.target === event.currentTarget) close();
  }

  openAddModal(): void {
    if (this.courses().length === 0) {
      alert('Create a course first — study blocks need a course to belong to.');
      return;
    }
    this.addModalOpen.set(true);
  }

  closeAddModal(): void {
    this.addModalOpen.set(false);
  }

  submitAddForm(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const courseId = String(data.get('courseId') || '');
    const topicTitle = String(data.get('topicTitle') || '').trim();
    const day = Number(data.get('day'));
    const duration = Number(data.get('duration'));
    const startRaw = String(data.get('start') || '09:00');
    const [hh, mm] = startRaw.split(':').map(Number);

    if (!courseId || !topicTitle || Number.isNaN(day) || Number.isNaN(duration)) return;

    createStudyBlock({
      courseId,
      topicTitle,
      day,
      startMinutes: hh * 60 + mm,
      durationMinutes: duration,
    });

    form.reset();
    this.courses.set(getCourses());
    this.blocksVersion.update((v) => v + 1);
    this.closeAddModal();
  }

  closeEditModal(): void {
    this.editModalOpen.set(false);
    this.editingBlock.set(null);
  }

  submitEditForm(event: SubmitEvent): void {
    event.preventDefault();
    const current = this.editingBlock();
    if (!current) return;

    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const courseId = String(data.get('courseId') || '');
    const topicTitle = String(data.get('topicTitle') || '').trim();
    const day = Number(data.get('day'));
    const duration = Number(data.get('duration'));
    const startRaw = String(data.get('start') || '09:00');
    const [hh, mm] = startRaw.split(':').map(Number);

    if (!courseId || !topicTitle || Number.isNaN(day) || Number.isNaN(duration)) return;

    updateStudyBlock(current.id, {
      courseId,
      topicTitle,
      day,
      startMinutes: hh * 60 + mm,
      durationMinutes: duration,
    });

    this.blocksVersion.update((v) => v + 1);
    this.closeEditModal();
  }

  deleteEditingBlock(): void {
    const current = this.editingBlock();
    if (!current) return;
    if (!confirm("Delete this study block? This can't be undone.")) return;
    deleteStudyBlock(current.id);
    this.blocksVersion.update((v) => v + 1);
    this.closeEditModal();
  }
}