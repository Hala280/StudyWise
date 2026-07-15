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

/** Two blocks conflict if they're on the same day and their time ranges overlap. */
export function blocksConflict(a: StudyBlock, b: StudyBlock): boolean {
  if (a.id === b.id || a.day !== b.day) return false;
  const aEnd = a.startMinutes + a.durationMinutes;
  const bEnd = b.startMinutes + b.durationMinutes;
  return a.startMinutes < bEnd && b.startMinutes < aEnd;
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
