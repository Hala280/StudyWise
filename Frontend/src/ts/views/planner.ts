// views/planner.ts
// Planner page: weekly timeline of study blocks, filterable by course, with
// drag-to-reschedule and a conflict warning banner when two blocks overlap.
// Renders into the shared #app mount point, same pattern as courses.ts /
// course-details.ts.
//
// Scheduling is local-state only (see data/planner.ts) — there's no backend
// and no real calendar sync yet. "Generate plan" / auto-scheduling from
// course-details.ts is still a placeholder; this view just gives you a
// place to see and hand-place study blocks once that exists.
//
// Drag behavior: pointer-based (works for mouse + touch), snaps to 15-minute
// increments vertically and whole days horizontally. Dropping onto a time
// that's already occupied is allowed — it just gets flagged as a conflict,
// same as if you'd created it that way. Duration isn't resizable by drag;
// edit it via the modal instead.
//
// Click vs. drag: a pointerdown that never moves more than DRAG_THRESHOLD_PX
// is treated as a click and opens the edit modal (view/edit/delete a block);
// crossing that threshold commits to a drag-reschedule instead. This mirrors
// how most calendar UIs disambiguate "click to open" from "drag to move."

import { getAppRoot } from '../router';
import { getCourses, type Course } from '../data/courses';
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
} from '../data/planner';

function requireElement<T extends Element>(element: T | null, id: string): T {
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Full 24h grid (00:00 up to but not including the next 00:00). Using the
// whole day removes the old 7am–10pm ceiling that clipped anything late,
// and avoids the ambiguity of a shortened window: with a full day there's
// no gap where "after 10pm" would have to be reinterpreted as "tomorrow."
// Blocks that run past midnight are a separate concern, handled by
// splitting them into two rendered segments — see renderGrid().
const DAY_START_MIN = 0; // 12:00am
const DAY_END_MIN = 24 * 60; // 12:00am the next day (exclusive upper bound)
const PX_PER_MIN = 1.1;
const GRID_HEIGHT = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN;
const SNAP_MIN = 15;
const MIN_BLOCK_PX = 40;

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

function courseTitle(courseId: string): string {
  return getCourses().find((c) => c.id === courseId)?.title ?? 'Unknown course';
}

function hourMarks(): number[] {
  const marks: number[] = [];
  // DAY_END_MIN (1440) is the midnight boundary, not a visible row — using
  // `<` instead of `<=` avoids drawing a duplicate "12AM" line under the
  // one already at the top of the grid.
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += 60) marks.push(m);
  return marks;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Groups same-day blocks into overlap clusters, then assigns each block a
 * column index + column count within its cluster so overlapping blocks
 * render side-by-side instead of stacked on top of each other.
 */
function layoutDay(blocks: StudyBlock[]): Map<string, { col: number; cols: number }> {
  const layout = new Map<string, { col: number; cols: number }>();
  const sorted = [...blocks].sort((a, b) => a.startMinutes - b.startMinutes);

  let cluster: StudyBlock[] = [];
  let clusterEnd = -Infinity;

  function flushCluster(): void {
    if (cluster.length === 0) return;
    // Greedy column assignment within the cluster.
    const columns: number[] = []; // columns[i] = end time of last block in column i
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

interface DragState {
  block: StudyBlock;
  card: HTMLElement;
  originDay: number;
  originStart: number;
  pointerOffsetY: number;
  columns: HTMLElement[];
  startClientX: number;
  startClientY: number;
  moved: boolean;
}

/** Below this pixel distance, a pointerdown→pointerup is treated as a click (open editor), not a drag (reschedule). */
const DRAG_THRESHOLD_PX = 6;

export function renderPlanner(): void {
  const app = getAppRoot();
  app.innerHTML = '';

  let courseFilter: string = 'all';
  let drag: DragState | null = null;

  const section = document.createElement('section');
  section.className = 'animate-page max-w-6xl mx-auto px-6 py-12';

  section.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-6">
      <div>
        <p class="font-hand text-2xl accent mb-1">this week</p>
        <h1 class="font-display text-5xl text-ink-900 dark:text-paper">Planner</h1>
      </div>
      <div class="flex items-center gap-3">
        <select
          id="planner-course-filter"
          class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-600 px-4 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150"
        >
          <option value="all">All courses</option>
        </select>
        <button type="button" id="open-add-block" class="cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition whitespace-nowrap">
          + Add block
        </button>
      </div>
    </div>

    <div id="conflict-banner" class="hidden reveal-item mb-4 rounded-lg border border-[#E0765E]/40 bg-[#E0765E]/10 px-4 py-3 text-sm text-[#C15A3F] dark:text-[#E0765E] flex items-center gap-2">
      <span>⚠</span>
      <span id="conflict-banner-text"></span>
    </div>

    <div class="flex items-center gap-2 mb-4 text-xs surface-muted">
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      <span>Click a block to view or edit it, or drag it to a new day or time. Resizing and auto conflict-resolution aren't built yet — overlaps are allowed and flagged.</span>
    </div>

    <div class="rounded-xl border border-ink-100 dark:border-ink-600 bg-white dark:bg-ink-600 overflow-hidden">
      <div class="overflow-x-auto">
        <div id="planner-grid" class="grid min-w-[880px]" style="grid-template-columns: 60px repeat(7, 1fr);"></div>
      </div>
    </div>
  `;

  app.appendChild(section);

  const grid = requireElement(section.querySelector<HTMLElement>('#planner-grid'), 'planner-grid');
  const filterSelect = requireElement(section.querySelector<HTMLSelectElement>('#planner-course-filter'), 'planner-course-filter');
  const openAddBtn = requireElement(section.querySelector<HTMLButtonElement>('#open-add-block'), 'open-add-block');
  const conflictBanner = requireElement(section.querySelector<HTMLElement>('#conflict-banner'), 'conflict-banner');
  const conflictBannerText = requireElement(section.querySelector<HTMLElement>('#conflict-banner-text'), 'conflict-banner-text');

  function populateCourseOptions(): void {
    const courses = getCourses();
    const current = filterSelect.value;
    filterSelect.innerHTML =
      '<option value="all">All courses</option>' +
      courses.map((c) => `<option value="${c.id}">${c.title}</option>`).join('');
    filterSelect.value = courses.some((c) => c.id === current) ? current : 'all';
  }

  function syncConflictBanner(conflictIds: Set<string>): void {
    const count = conflictIds.size;
    if (count === 0) {
      conflictBanner.classList.add('hidden');
      return;
    }
    conflictBannerText.textContent =
      count === 2
        ? '2 study blocks overlap in time. Drag one to a free slot to clear the conflict.'
        : `${count} study blocks overlap in time. Drag them to free slots to clear the conflicts.`;
    conflictBanner.classList.remove('hidden');
  }

  /**
   * Optional override for rendering a block as a clipped segment rather
   * than its natural full extent — used for overnight blocks, which are
   * drawn as two pieces: a "head" segment (today, from its real start
   * down to midnight) and a "tail" segment (tomorrow, from midnight down
   * to where it actually ends). `interactive: false` renders the tail as
   * a visual-only continuation strip — no drag, no click-to-edit, no
   * remove button — so all real interaction funnels through the head,
   * which is the only segment carrying the block's true identity.
   */
  interface SegmentOverride {
    top: number;
    height: number;
    interactive: boolean;
    continuesBefore?: boolean; // true for a tail: "this started yesterday"
    continuesAfter?: boolean; // true for a head that spills into tomorrow
  }

  function buildCard(
    blockItem: StudyBlock,
    hasConflict: boolean,
    colInfo: { col: number; cols: number },
    columns: HTMLElement[],
    onOpen: (block: StudyBlock) => void,
    segment?: SegmentOverride
  ): HTMLElement {
    const color = courseColorFor(blockItem.courseId);
    const styles = BLOCK_STYLES[color];
    const top = segment ? segment.top : (blockItem.startMinutes - DAY_START_MIN) * PX_PER_MIN;
    const naturalHeight = Math.max(blockItem.durationMinutes * PX_PER_MIN, MIN_BLOCK_PX);
    const height = segment ? Math.max(segment.height, 18) : naturalHeight;
    const interactive = segment ? segment.interactive : true;

    const gapPct = 3;
    const widthPct = 100 / colInfo.cols;
    const leftPct = colInfo.col * widthPct;

    const card = document.createElement('div');
    const roundedClasses = segment?.continuesBefore
      ? 'rounded-b-lg rounded-t-none'
      : segment?.continuesAfter
        ? 'rounded-t-lg rounded-b-none'
        : 'rounded-lg';
    card.className = [
      'study-block group absolute border px-2.5 py-2 overflow-hidden select-none',
      roundedClasses,
      interactive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
      'shadow-sm hover:shadow-md hover:z-20 transition-shadow',
      styles.bg,
      styles.border,
      styles.text,
      hasConflict ? 'ring-2 ring-offset-1 ring-[#C15A3F] dark:ring-[#E0765E] dark:ring-offset-ink-600' : '',
      // Overnight segments get a dashed edge on the side that's "cut" by
      // midnight, so it visually reads as continuing rather than ending.
      // `border-dashed` sets style for all sides, but only the relevant
      // side has a nonzero width here, so only that edge renders dashed.
      segment?.continuesBefore ? 'border-dashed border-t-2' : '',
      segment?.continuesAfter ? 'border-dashed border-b-2' : '',
    ].join(' ');
    card.style.top = `${top}px`;
    card.style.height = `${height}px`;
    card.style.left = `calc(${leftPct}% + ${colInfo.col > 0 ? gapPct / 2 : 0}px)`;
    card.style.width = `calc(${widthPct}% - ${colInfo.cols > 1 ? gapPct : 0}px)`;
    card.style.touchAction = 'none';
    card.dataset.blockId = blockItem.id;
    const fullRangeLabel = `${formatTime(blockItem.startMinutes)}–${formatTime(
      isOvernightBlock(blockItem) ? overflowMinutes(blockItem) : blockItem.startMinutes + blockItem.durationMinutes
    )}${isOvernightBlock(blockItem) ? ' (+1 day)' : ''}`;
    card.title = `${courseTitle(blockItem.courseId)} — ${blockItem.topicTitle}\n${fullRangeLabel}`;

    const compact = height < 56;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-1">
        <span class="w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${styles.solid}"></span>
        <div class="min-w-0 flex-1">
          <p class="text-[10.5px] font-semibold uppercase tracking-wide truncate leading-tight">${courseTitle(blockItem.courseId)}</p>
          ${!compact ? `<p class="text-xs font-medium leading-snug mt-0.5 truncate">${blockItem.topicTitle}</p>` : ''}
        </div>
        ${interactive ? `<button
          type="button"
          class="remove-block shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none w-4 h-4 flex items-center justify-center hover:opacity-70"
          aria-label="Remove study block"
        >&times;</button>` : ''}
      </div>
      ${!compact ? `<p class="text-[10px] opacity-75 mt-1 truncate">${
        segment?.continuesBefore
          ? `⋯ continues from ${formatTime(blockItem.startMinutes)} yesterday`
          : segment?.continuesAfter
            ? `${formatTime(blockItem.startMinutes)}–12AM, continues ⋯`
            : `${formatTime(blockItem.startMinutes)}–${formatTime(blockItem.startMinutes + blockItem.durationMinutes)}`
      }${hasConflict ? ' · ⚠ conflict' : ''}</p>` : ''}
    `;

    if (!interactive) {
      // Tail segments are display-only: no remove button, no drag, no
      // click-to-open. Returning early skips wiring up all pointer
      // handlers below, which all assume they own the block's identity.
      return card;
    }

    card.querySelector('.remove-block')?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      deleteStudyBlock(blockItem.id);
      renderGrid();
    });

    card.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.remove-block')) return;
      e.preventDefault();
      const rect = card.getBoundingClientRect();
      drag = {
        block: blockItem,
        card,
        originDay: blockItem.day,
        originStart: blockItem.startMinutes,
        pointerOffsetY: e.clientY - rect.top,
        columns,
        startClientX: e.clientX,
        startClientY: e.clientY,
        moved: false,
      };
      card.setPointerCapture(e.pointerId);
    });

    card.addEventListener('pointermove', (e) => {
      if (!drag || drag.card !== card) return;
      if (!drag.moved) {
        const dx = e.clientX - drag.startClientX;
        const dy = e.clientY - drag.startClientY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        // Movement just crossed the threshold — this is now a real drag, not a click.
        drag.moved = true;
        card.classList.add('z-30', 'opacity-90', 'shadow-lg');
      }
      handleDragMove(e);
    });

    card.addEventListener('pointerup', (e) => {
      if (!drag || drag.card !== card) return;
      card.releasePointerCapture(e.pointerId);
      if (drag.moved) {
        handleDragEnd();
      } else {
        // Never crossed the drag threshold — treat as a click to open the editor.
        const openedBlock = drag.block;
        drag = null;
        onOpen(openedBlock);
      }
    });

    card.addEventListener('pointercancel', () => {
      if (!drag || drag.card !== card) return;
      if (drag.moved) handleDragEnd();
      else drag = null;
    });

    return card;
  }

  function handleDragMove(e: PointerEvent): void {
    if (!drag) return;
    const { columns, card, pointerOffsetY } = drag;

    // Find which day column the pointer is currently over.
    let targetDay = drag.block.day;
    let targetCol: HTMLElement = columns[targetDay];
    for (let i = 0; i < columns.length; i++) {
      const rect = columns[i].getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX < rect.right) {
        targetDay = i;
        targetCol = columns[i];
        break;
      }
    }

    const colRect = targetCol.getBoundingClientRect();
    const rawY = e.clientY - colRect.top - pointerOffsetY;
    const rawMinutes = DAY_START_MIN + rawY / PX_PER_MIN;
    const snapped = Math.round(rawMinutes / SNAP_MIN) * SNAP_MIN;
    // Only clamp the start time to stay within the day it's being dropped
    // on (0..1439) — the block's duration is free to spill past midnight,
    // that spillover is rendered as a linked continuation segment on the
    // next day once the drag settles (see renderGrid).
    const clampedStart = clamp(snapped, DAY_START_MIN, DAY_END_MIN - SNAP_MIN);

    // Move the card visually into the target column during drag. While
    // actively dragging we show one unclipped rectangle following the
    // pointer for simplicity (it may visually run past the bottom of the
    // column for an overnight placement) — the accurate two-segment split
    // is what renders once the drag ends and the grid re-renders.
    if (card.parentElement !== targetCol) {
      targetCol.appendChild(card);
    }
    card.style.left = '2px';
    card.style.width = 'calc(100% - 4px)';
    card.style.top = `${(clampedStart - DAY_START_MIN) * PX_PER_MIN}px`;

    drag.block = { ...drag.block, day: targetDay, startMinutes: clampedStart };
  }

  function handleDragEnd(): void {
    if (!drag) return;
    const { block, card } = drag;
    card.classList.remove('z-30', 'opacity-90', 'shadow-lg');

    const changed = block.day !== drag.originDay || block.startMinutes !== drag.originStart;
    if (changed) {
      updateStudyBlock(block.id, { day: block.day, startMinutes: block.startMinutes });
    }
    drag = null;
    renderGrid();
  }

  function renderGrid(): void {
    grid.innerHTML = '';

    const gutterHeader = document.createElement('div');
    gutterHeader.className = 'border-b border-r border-ink-100 dark:border-ink-600';
    grid.appendChild(gutterHeader);

    DAY_LABELS.forEach((label) => {
      const header = document.createElement('div');
      header.className =
        'border-b border-l border-ink-100 dark:border-ink-600 px-2 py-3 text-center text-xs font-semibold text-ink-600 dark:text-ink-100';
      header.textContent = label;
      grid.appendChild(header);
    });

    const gutter = document.createElement('div');
    gutter.className = 'relative border-r border-ink-100 dark:border-ink-600';
    gutter.style.height = `${GRID_HEIGHT}px`;
    hourMarks().forEach((m) => {
      const label = document.createElement('div');
      label.className = 'absolute -translate-y-1/2 text-[10px] text-ink-400 dark:text-ink-200 pr-2 w-full text-right';
      label.style.top = `${(m - DAY_START_MIN) * PX_PER_MIN}px`;
      label.textContent = formatTime(m);
      gutter.appendChild(label);
    });
    grid.appendChild(gutter);

    const visibleBlocks = getStudyBlocksByCourse(courseFilter as 'all' | string);
    const conflictIds = findConflictingBlockIds(visibleBlocks);
    const columns: HTMLElement[] = [];

    for (let day = 0; day < 7; day++) {
      const col = document.createElement('div');
      col.className = 'relative border-l last:border-r border-ink-100 dark:border-ink-600';
      col.style.height = `${GRID_HEIGHT}px`;
      col.dataset.day = String(day);
      columns.push(col);
      grid.appendChild(col);
    }

    hourMarks().forEach((m) => {
      columns.forEach((col) => {
        const line = document.createElement('div');
        line.className = 'absolute left-0 right-0 border-t border-ink-50 dark:border-ink-900 pointer-events-none';
        line.style.top = `${(m - DAY_START_MIN) * PX_PER_MIN}px`;
        col.appendChild(line);
      });
    });

    // Overnight blocks (day D, spilling past midnight) need a "tail"
    // phantom entry folded into day D+1's own layout pass, so it correctly
    // reserves column space alongside that day's native blocks instead of
    // silently overlapping them. TAIL_ID_PREFIX can't collide with a real
    // block id since createStudyBlock's ids come from a numeric counter.
    const TAIL_ID_PREFIX = '__tail__:';
    const overnightBlocks = visibleBlocks.filter((b) => isOvernightBlock(b));

    for (let day = 0; day < 7; day++) {
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

      dayBlocks.forEach((b) => {
        const overnight = isOvernightBlock(b);
        const colInfo = dayLayout.get(b.id) ?? { col: 0, cols: 1 };
        const card = buildCard(
          b,
          conflictIds.has(b.id),
          colInfo,
          columns,
          (openedBlock) => editModal.open(openedBlock),
          overnight
            ? {
                // Head segment: clipped from its real start down to
                // midnight (the grid's own bottom edge), not its full
                // natural height.
                top: (b.startMinutes - DAY_START_MIN) * PX_PER_MIN,
                height: (DAY_END_MIN - b.startMinutes) * PX_PER_MIN,
                interactive: true,
                continuesAfter: true,
              }
            : undefined
        );
        columns[day].appendChild(card);
      });

      incomingTails.forEach((tail) => {
        const original = overnightBlocks.find((b) => `${TAIL_ID_PREFIX}${b.id}` === tail.id);
        if (!original) return;
        const colInfo = dayLayout.get(tail.id) ?? { col: 0, cols: 1 };
        const tailCard = buildCard(
          original,
          conflictIds.has(original.id),
          colInfo,
          columns,
          () => {},
          {
            top: 0,
            height: overflowMinutes(original) * PX_PER_MIN,
            interactive: false,
            continuesBefore: true,
          }
        );
        columns[day].appendChild(tailCard);
      });
    }

    syncConflictBanner(conflictIds);
  }

  const addModal = addBlockModal(() => {
    populateCourseOptions();
    renderGrid();
  });
  app.appendChild(addModal.el);

  const editModal = editBlockModal({
    onSaved: () => {
      populateCourseOptions();
      renderGrid();
    },
    onDeleted: () => {
      renderGrid();
    },
  });
  app.appendChild(editModal.el);

  filterSelect.addEventListener('change', () => {
    courseFilter = filterSelect.value;
    renderGrid();
  });
  openAddBtn.addEventListener('click', () => addModal.open());

  populateCourseOptions();
  renderGrid();
}

function addBlockModal(onCreated: () => void): { el: HTMLElement; open: () => void } {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-50 hidden items-center justify-center bg-ink-900/50 backdrop-blur-sm px-4';

  const courseOptions = () => getCourses().map((c) => `<option value="${c.id}">${c.title}</option>`).join('');

  overlay.innerHTML = `
    <div class="animate-page w-full max-w-md rounded-xl bg-paper dark:bg-ink-600 border border-ink-100 dark:border-ink-400 shadow-xl p-6" role="dialog" aria-modal="true" aria-labelledby="planner-modal-title">
      <div class="flex items-start justify-between mb-5">
        <div>
          <p class="font-hand text-xl accent">new block</p>
          <h2 id="planner-modal-title" class="font-display text-3xl text-ink-900 dark:text-paper">Add study block</h2>
        </div>
        <button type="button" id="planner-modal-close" aria-label="Close" class="text-ink-400 dark:text-ink-200 hover:text-ink-900 dark:hover:text-paper text-xl leading-none">&times;</button>
      </div>
      <form id="add-block-form" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="block-course" class="text-sm font-medium text-ink-900 dark:text-paper">Course</label>
          <select id="block-course" name="courseId" required
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150">
            ${courseOptions()}
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="block-topic" class="text-sm font-medium text-ink-900 dark:text-paper">Topic</label>
          <input id="block-topic" name="topicTitle" type="text" required placeholder="e.g. Review chapter 4"
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="block-day" class="text-sm font-medium text-ink-900 dark:text-paper">Day</label>
            <select id="block-day" name="day" required
              class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150">
              ${DAY_LABELS.map((d, i) => `<option value="${i}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="block-start" class="text-sm font-medium text-ink-900 dark:text-paper">Start time</label>
            <input id="block-start" name="start" type="time" required value="09:00"
              class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="block-duration" class="text-sm font-medium text-ink-900 dark:text-paper">Duration (minutes)</label>
          <input id="block-duration" name="duration" type="number" min="10" step="5" required value="45"
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
        </div>
        <div class="flex gap-3 mt-2">
          <button type="submit" class="flex-1 cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition">Add block</button>
          <button type="button" id="planner-modal-cancel" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition">Cancel</button>
        </div>
      </form>
    </div>
  `;

  function close(): void {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }

  function open(): void {
    if (getCourses().length === 0) {
      alert('Create a course first — study blocks need a course to belong to.');
      return;
    }
    const courseSelect = overlay.querySelector<HTMLSelectElement>('#block-course');
    if (courseSelect) courseSelect.innerHTML = courseOptions();
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    requireElement(overlay.querySelector<HTMLInputElement>('#block-topic'), 'block-topic').focus();
  }

  overlay.querySelector('#planner-modal-close')?.addEventListener('click', close);
  overlay.querySelector('#planner-modal-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const form = requireElement(overlay.querySelector<HTMLFormElement>('#add-block-form'), 'add-block-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
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
    close();
    onCreated();
  });

  return { el: overlay, open };
}

function minutesToTimeInput(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

interface EditModalCallbacks {
  onSaved: () => void;
  onDeleted: () => void;
}

/** View/edit panel for an existing study block — opened by clicking (not dragging) a block. */
function editBlockModal({ onSaved, onDeleted }: EditModalCallbacks): { el: HTMLElement; open: (block: StudyBlock) => void } {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-50 hidden items-center justify-center bg-ink-900/50 backdrop-blur-sm px-4';

  const courseOptions = () => getCourses().map((c) => `<option value="${c.id}">${c.title}</option>`).join('');

  overlay.innerHTML = `
    <div class="animate-page w-full max-w-md rounded-xl bg-paper dark:bg-ink-600 border border-ink-100 dark:border-ink-400 shadow-xl p-6" role="dialog" aria-modal="true" aria-labelledby="edit-block-title">
      <div class="flex items-start justify-between mb-5">
        <div>
          <p class="font-hand text-xl accent">study block</p>
          <h2 id="edit-block-title" class="font-display text-3xl text-ink-900 dark:text-paper">Edit block</h2>
        </div>
        <button type="button" id="edit-modal-close" aria-label="Close" class="text-ink-400 dark:text-ink-200 hover:text-ink-900 dark:hover:text-paper text-xl leading-none">&times;</button>
      </div>
      <form id="edit-block-form" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="edit-block-course" class="text-sm font-medium text-ink-900 dark:text-paper">Course</label>
          <select id="edit-block-course" name="courseId" required
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150">
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="edit-block-topic" class="text-sm font-medium text-ink-900 dark:text-paper">Topic</label>
          <input id="edit-block-topic" name="topicTitle" type="text" required
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="edit-block-day" class="text-sm font-medium text-ink-900 dark:text-paper">Day</label>
            <select id="edit-block-day" name="day" required
              class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150">
              ${DAY_LABELS.map((d, i) => `<option value="${i}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="edit-block-start" class="text-sm font-medium text-ink-900 dark:text-paper">Start time</label>
            <input id="edit-block-start" name="start" type="time" required
              class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="edit-block-duration" class="text-sm font-medium text-ink-900 dark:text-paper">Duration (minutes)</label>
          <input id="edit-block-duration" name="duration" type="number" min="10" step="5" required
            class="rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150" />
        </div>
        <div class="flex gap-3 mt-2">
          <button type="submit" class="flex-1 cta-primary rounded-md px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition">Save changes</button>
          <button type="button" id="edit-modal-cancel" class="cta-secondary box-border rounded-md px-5 py-2.5 text-sm transition">Cancel</button>
        </div>
        <button type="button" id="edit-modal-delete" class="text-xs font-medium text-[#C15A3F] dark:text-[#E0765E] hover:opacity-75 transition self-center mt-1">
          Delete this study block
        </button>
      </form>
    </div>
  `;

  let currentBlockId: string | null = null;

  function close(): void {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    currentBlockId = null;
  }

  function open(block: StudyBlock): void {
    currentBlockId = block.id;

    const courseSelect = requireElement(overlay.querySelector<HTMLSelectElement>('#edit-block-course'), 'edit-block-course');
    const topicInput = requireElement(overlay.querySelector<HTMLInputElement>('#edit-block-topic'), 'edit-block-topic');
    const daySelect = requireElement(overlay.querySelector<HTMLSelectElement>('#edit-block-day'), 'edit-block-day');
    const startInput = requireElement(overlay.querySelector<HTMLInputElement>('#edit-block-start'), 'edit-block-start');
    const durationInput = requireElement(overlay.querySelector<HTMLInputElement>('#edit-block-duration'), 'edit-block-duration');

    courseSelect.innerHTML = courseOptions();
    courseSelect.value = block.courseId;
    topicInput.value = block.topicTitle;
    daySelect.value = String(block.day);
    startInput.value = minutesToTimeInput(block.startMinutes);
    durationInput.value = String(block.durationMinutes);

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    topicInput.focus();
  }

  overlay.querySelector('#edit-modal-close')?.addEventListener('click', close);
  overlay.querySelector('#edit-modal-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector('#edit-modal-delete')?.addEventListener('click', () => {
    if (!currentBlockId) return;
    if (!confirm('Delete this study block? This can\'t be undone.')) return;
    deleteStudyBlock(currentBlockId);
    close();
    onDeleted();
  });

  const form = requireElement(overlay.querySelector<HTMLFormElement>('#edit-block-form'), 'edit-block-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentBlockId) return;

    const data = new FormData(form);
    const courseId = String(data.get('courseId') || '');
    const topicTitle = String(data.get('topicTitle') || '').trim();
    const day = Number(data.get('day'));
    const duration = Number(data.get('duration'));
    const startRaw = String(data.get('start') || '09:00');
    const [hh, mm] = startRaw.split(':').map(Number);

    if (!courseId || !topicTitle || Number.isNaN(day) || Number.isNaN(duration)) return;

    updateStudyBlock(currentBlockId, {
      courseId,
      topicTitle,
      day,
      startMinutes: hh * 60 + mm,
      durationMinutes: duration,
    });

    close();
    onSaved();
  });

  return { el: overlay, open };
}