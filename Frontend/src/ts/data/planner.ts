// data/planner.ts
// In-memory mock data store for the weekly planner. Mirrors the pattern in
// data/courses.ts: a module-level array acting as the single source of
// truth, read/written by the Planner view. Study blocks reference a course
// by id so the UI can pull title/color/subject from the courses store.

import { getCourseById } from './courses';

export interface StudyBlock {
  id: string;
  courseId: string;
  topicTitle: string;
  day: number; // 0 = Monday ... 6 = Sunday
  startMinutes: number; // minutes from midnight, e.g. 9:30am = 570
  durationMinutes: number;
}

let idCounter = 100;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function block(courseId: string, topicTitle: string, day: number, startMinutes: number, durationMinutes: number): StudyBlock {
  return { id: nextId('block'), courseId, topicTitle, day, startMinutes, durationMinutes };
}

const store: StudyBlock[] = [
  block('course-1', 'Cell membrane transport', 0, 9 * 60, 45),
  block('course-3', 'Eigenvalues and eigenvectors', 0, 14 * 60, 60),
  block('course-2', 'Cuban Missile Crisis', 1, 10 * 60 + 30, 40),
  block('course-1', 'Mitosis vs meiosis', 2, 9 * 60, 50),
  block('course-3', 'Linear transformations', 2, 9 * 60 + 30, 45), // deliberately overlaps the block above
  block('course-2', 'Détente and arms control', 3, 15 * 60, 35),
  block('course-1', 'Cellular respiration overview', 4, 11 * 60, 35),
  block('course-3', 'Diagonalization', 5, 10 * 60, 45),
];

export function getStudyBlocks(): StudyBlock[] {
  return store;
}

export function getStudyBlocksByCourse(courseId: string | 'all'): StudyBlock[] {
  if (courseId === 'all') return store;
  return store.filter((b) => b.courseId === courseId);
}

export function createStudyBlock(input: Omit<StudyBlock, 'id'>): StudyBlock {
  const b: StudyBlock = { ...input, id: nextId('block') };
  store.push(b);
  return b;
}

export function updateStudyBlock(id: string, patch: Partial<Omit<StudyBlock, 'id'>>): StudyBlock | undefined {
  const b = store.find((x) => x.id === id);
  if (!b) return undefined;
  Object.assign(b, patch);
  return b;
}

export function deleteStudyBlock(id: string): void {
  const idx = store.findIndex((x) => x.id === id);
  if (idx !== -1) store.splice(idx, 1);
}

/**
 * Minutes past midnight where a block ends, unbounded — a block starting at
 * 23:30 (1410) for 90 minutes ends at 1500, i.e. 60 minutes into the next
 * calendar day. Callers that need "minutes into the day it spills onto" can
 * subtract MINUTES_PER_DAY themselves; kept raw here so duration math stays
 * simple everywhere else.
 */
export const MINUTES_PER_DAY = 24 * 60;

export function blockEndMinutes(b: StudyBlock): number {
  return b.startMinutes + b.durationMinutes;
}

/** True if a block runs past midnight into the following calendar day. */
export function isOvernightBlock(b: StudyBlock): boolean {
  return blockEndMinutes(b) > MINUTES_PER_DAY;
}

/**
 * How far the block spills into the next day, in minutes past that next
 * midnight. 0 for blocks that don't spill over.
 */
export function overflowMinutes(b: StudyBlock): number {
  return Math.max(0, blockEndMinutes(b) - MINUTES_PER_DAY);
}

/**
 * Two blocks conflict if their time ranges overlap on a shared calendar day.
 * This now accounts for overnight blocks: a block that runs past midnight
 * occupies the start of the *next* day too, so it's checked against
 * same-day blocks on both its origin day and (mod 7) the following day.
 */
export function blocksConflict(a: StudyBlock, b: StudyBlock): boolean {
  if (a.id === b.id) return false;

  const aEnd = blockEndMinutes(a);
  const bEnd = blockEndMinutes(b);

  // Same-day overlap on their origin day, using raw (possibly >1440) end
  // times — this still works normally since a same-day comparison only
  // needs both start times anchored to the same origin day.
  if (a.day === b.day && a.startMinutes < bEnd && b.startMinutes < aEnd) {
    return true;
  }

  // a spills into the day after a.day; check that spillover window against
  // b if b lives on that next day.
  const aNextDay = (a.day + 1) % 7;
  if (isOvernightBlock(a) && b.day === aNextDay) {
    const aSpillEnd = overflowMinutes(a); // 0..aSpillEnd on b.day
    if (0 < bEnd && b.startMinutes < aSpillEnd) return true;
  }

  // Symmetric case: b spills into a.day.
  const bNextDay = (b.day + 1) % 7;
  if (isOvernightBlock(b) && a.day === bNextDay) {
    const bSpillEnd = overflowMinutes(b);
    if (0 < aEnd && a.startMinutes < bSpillEnd) return true;
  }

  return false;
}

/** Returns the set of block ids that overlap with at least one other block. */
export function findConflictingBlockIds(blocks: StudyBlock[]): Set<string> {
  const conflicting = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocksConflict(blocks[i], blocks[j])) {
        conflicting.add(blocks[i].id);
        conflicting.add(blocks[j].id);
      }
    }
  }
  return conflicting;
}

export function courseColorFor(courseId: string): 'amber' | 'sage' | 'coral' | 'ink' {
  return getCourseById(courseId)?.color ?? 'ink';
}