import { Injectable } from '@angular/core';
import { defer, forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import type { Course, Topic } from '../../ts/data/courses';
import type { StudyBlock } from '../../ts/data/planner';

const API_BASE_URL = 'http://localhost:5098';
const COLORS: Course['color'][] = ['amber', 'sage', 'coral', 'ink'];

interface CourseDto {
  id: number;
  title: string;
  description: string | null;
  examDate: string | null;
  estimatedTotalHours: number;
  createdAt: string;
  topicsCount: number;
}

interface TopicDto {
  id: number;
  courseId: number;
  title: string;
  estimatedHours: number;
  orderIndex: number;
  isCompleted: boolean;
  createdAt: string;
}

interface SyllabusParseResponse {
  message: string;
  topics: TopicDto[];
}

interface StudyBlockDto {
  id: number;
  topicId: number;
  courseId: number;
  topicTitle: string;
  courseTitle: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isCompleted: boolean;
  isMissed: boolean;
}

@Injectable({ providedIn: 'root' })
export class StudyWiseApi {
  getCourses(): Observable<Course[]> {
    return this.get<CourseDto[]>('/api/courses')
      .pipe(
        switchMap((courses) => {
          if (courses.length === 0) return of([]);
          return forkJoin(courses.map((course) => this.getTopicsForCourseDto(course)));
        })
      );
  }

  getCourse(id: string): Observable<Course | undefined> {
    return this.get<CourseDto>(`/api/courses/${id}`)
      .pipe(switchMap((course) => this.getTopicsForCourseDto(course)));
  }

  createCourse(input: {
    title: string;
    subject: string;
    examDate: string | null;
  }): Observable<Course> {
    return this.post<CourseDto>('/api/courses', {
          title: input.title,
          description: input.subject,
          examDate: input.examDate,
          estimatedTotalHours: 0,
    }).pipe(map((course) => this.mapCourse(course, [])));
  }

  createTopic(courseId: string, title: string, estMinutes = 60): Observable<Topic> {
    return this.post<TopicDto>(`/api/courses/${courseId}/topics`, {
          title,
          estimatedHours: Math.max(1, Math.round(estMinutes / 60)),
          orderIndex: 0,
    }).pipe(map((topic) => this.mapTopic(topic)));
  }

  updateTopic(courseId: string, topic: Topic): Observable<Topic> {
    return this.put<TopicDto>(`/api/courses/${courseId}/topics/${topic.id}`, {
          title: topic.title,
          estimatedHours: Math.max(1, Math.round(topic.estMinutes / 60)),
          orderIndex: 0,
          isCompleted: topic.done,
    }).pipe(map((updated) => this.mapTopic(updated)));
  }

  parseSyllabus(courseId: string, file: File): Observable<SyllabusParseResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<SyllabusParseResponse>(`/api/courses/${courseId}/syllabus/parse`, {
      method: 'POST',
      body: formData,
    });
  }

  getStudyBlocks(startDate: string, endDate: string): Observable<StudyBlock[]> {
    return this.get<StudyBlockDto[]>(`/api/studyblocks?startDate=${startDate}&endDate=${endDate}`)
      .pipe(map((blocks) => blocks.map((block) => this.mapStudyBlock(block))));
  }

  createStudyBlock(input: {
    topicId: string;
    scheduledDate: string;
    startMinutes: number;
    durationMinutes: number;
  }): Observable<StudyBlock> {
    return this.post<StudyBlockDto>('/api/studyblocks', {
      topicId: Number(input.topicId),
      scheduledDate: input.scheduledDate,
      startTime: this.minutesToApiTime(input.startMinutes),
      durationMinutes: input.durationMinutes,
    }).pipe(map((block) => this.mapStudyBlock(block)));
  }

  updateStudyBlock(block: StudyBlock, scheduledDate: string): Observable<StudyBlock> {
    return this.put<StudyBlockDto>(`/api/studyblocks/${block.id}`, {
      topicId: Number(block.topicId),
      scheduledDate,
      startTime: this.minutesToApiTime(block.startMinutes),
      durationMinutes: block.durationMinutes,
      isCompleted: false,
      isMissed: false,
    }).pipe(map((updated) => this.mapStudyBlock(updated)));
  }

  deleteStudyBlock(id: string): Observable<void> {
    return this.requestVoid(`/api/studyblocks/${id}`, { method: 'DELETE' });
  }

  private getTopicsForCourseDto(course: CourseDto): Observable<Course> {
    return this.get<TopicDto[]>(`/api/courses/${course.id}/topics`)
      .pipe(map((topics) => this.mapCourse(course, topics)));
  }

  private get<T>(path: string): Observable<T> {
    return this.request<T>(path);
  }

  private post<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private put<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private request<T>(path: string, init: RequestInit = {}): Observable<T> {
    return defer(() => from(this.fetchJson<T>(path, init)));
  }

  private requestVoid(path: string, init: RequestInit = {}): Observable<void> {
    return defer(() => from(this.fetchVoid(path, init)));
  }

  private async fetchJson<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      throw { error: text || response.statusText, status: response.status };
    }

    return (await response.json()) as T;
  }

  private async fetchVoid(path: string, init: RequestInit): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      throw { error: text || response.statusText, status: response.status };
    }
  }

  private mapCourse(course: CourseDto, topics: TopicDto[]): Course {
    return {
      id: String(course.id),
      title: course.title,
      subject: course.description?.trim() || 'General',
      examDate: course.examDate ? course.examDate.slice(0, 10) : null,
      color: COLORS[Math.abs(course.id) % COLORS.length],
      topics: topics.map((topic) => this.mapTopic(topic)),
    };
  }

  private mapTopic(topic: TopicDto): Topic {
    return {
      id: String(topic.id),
      title: topic.title,
      done: topic.isCompleted,
      estMinutes: topic.estimatedHours * 60,
    };
  }

  private mapStudyBlock(block: StudyBlockDto): StudyBlock {
    return {
      id: String(block.id),
      topicId: String(block.topicId),
      courseId: String(block.courseId),
      topicTitle: block.topicTitle,
      day: this.dayIndexFromIsoDate(block.scheduledDate),
      startMinutes: this.apiTimeToMinutes(block.startTime),
      durationMinutes: block.durationMinutes,
    };
  }

  private minutesToApiTime(minutes: number): string {
    const normalized = ((minutes % 1440) + 1440) % 1440;
    const h = String(Math.floor(normalized / 60)).padStart(2, '0');
    const m = String(normalized % 60).padStart(2, '0');
    return `${h}:${m}:00`;
  }

  private apiTimeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private dayIndexFromIsoDate(iso: string): number {
    const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
    return (date.getDay() + 6) % 7;
  }
}
