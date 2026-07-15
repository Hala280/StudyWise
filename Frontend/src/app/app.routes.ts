import { Routes } from '@angular/router';
import { HomePage } from './pages/home';
import { CoursesPage } from './pages/courses';
import { CourseDetailsPage } from './pages/course-details';
import { PlannerPage } from './pages/planner';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'StudyWise' },
  { path: 'courses', component: CoursesPage, title: 'StudyWise | Courses' },
  { path: 'courses/:id', component: CourseDetailsPage, title: 'StudyWise | Course Details' },
  { path: 'planner', component: PlannerPage, title: 'StudyWise | Planner' },
  { path: '**', redirectTo: '' },
];
