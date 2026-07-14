// data/courses.ts
// In-memory mock data store for courses/topics. No backend yet — this is the
// single source of truth the Courses and Course Details views both read from,
// so state (e.g. a newly created course, a toggled topic) persists as the
// user navigates between routes within the same session.

export interface Topic {
  id: string;
  title: string;
  done: boolean;
  estMinutes: number;
}

export interface Course {
  id: string;
  title: string;
  subject: string;
  examDate: string | null; // ISO date string, or null if not set
  color: 'amber' | 'sage' | 'coral' | 'ink';
  topics: Topic[];
}

let idCounter = 100;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function topic(title: string, done: boolean, estMinutes: number): Topic {
  return { id: nextId('topic'), title, done, estMinutes };
}

const store: Course[] = [
  {
    id: 'course-1',
    title: 'Cell Structure & Function',
    subject: 'Biology',
    examDate: '2026-08-14',
    color: 'sage',
    topics: [
      topic('Prokaryotic vs eukaryotic cells', true, 30),
      topic('Organelles and their functions', true, 45),
      topic('Cell membrane transport', false, 40),
      topic('Mitosis vs meiosis', false, 50),
      topic('Cellular respiration overview', false, 35),
    ],
  },
  {
    id: 'course-2',
    title: 'Cold War Timeline',
    subject: 'History',
    examDate: '2026-08-02',
    color: 'coral',
    topics: [
      topic('Origins: 1945–1947', false, 30),
      topic('Berlin Blockade & Airlift', false, 30),
      topic('Cuban Missile Crisis', false, 40),
      topic('Détente and arms control', false, 35),
    ],
  },
  {
    id: 'course-3',
    title: 'Linear Algebra Fundamentals',
    subject: 'Mathematics',
    examDate: null,
    color: 'amber',
    topics: [
      topic('Vectors and vector spaces', true, 40),
      topic('Matrix operations', true, 40),
      topic('Determinants', true, 25),
      topic('Eigenvalues and eigenvectors', false, 50),
      topic('Linear transformations', false, 45),
      topic('Diagonalization', false, 35),
    ],
  },
];

export function getCourses(): Course[] {
  return store;
}

export function getCourseById(id: string): Course | undefined {
  return store.find((c) => c.id === id);
}

export function createCourse(input: { title: string; subject: string; examDate: string | null }): Course {
  const colors: Course['color'][] = ['amber', 'sage', 'coral', 'ink'];
  const course: Course = {
    id: nextId('course'),
    title: input.title,
    subject: input.subject,
    examDate: input.examDate,
    color: colors[store.length % colors.length],
    topics: [],
  };
  store.push(course);
  return course;
}

export function addTopic(courseId: string, title: string, estMinutes = 30): Topic | undefined {
  const course = getCourseById(courseId);
  if (!course) return undefined;
  const t = topic(title, false, estMinutes);
  course.topics.push(t);
  return t;
}

export function toggleTopic(courseId: string, topicId: string): void {
  const course = getCourseById(courseId);
  const t = course?.topics.find((x) => x.id === topicId);
  if (t) t.done = !t.done;
}

export function courseProgress(course: Course): number {
  if (course.topics.length === 0) return 0;
  const done = course.topics.filter((t) => t.done).length;
  return Math.round((done / course.topics.length) * 100);
}

export function courseTotalHours(course: Course): number {
  const totalMinutes = course.topics.reduce((sum, t) => sum + t.estMinutes, 0);
  return Math.round((totalMinutes / 60) * 10) / 10;
}
