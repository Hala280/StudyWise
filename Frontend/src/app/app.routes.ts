import { Routes } from '@angular/router';
import { HomePage } from './pages/home';
import { CoursesPage } from './pages/courses';
import { CourseDetailsPage } from './pages/course-details';
import { PlannerPage } from './pages/planner';
import { SyllabusUploadPage } from './pages/syllabus-upload';
import { ProgressPage } from './pages/progress';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'StudyWise' },
  { path: 'courses', component: CoursesPage, title: 'StudyWise | Courses' },
  { path: 'courses/:id', component: CourseDetailsPage, title: 'StudyWise | Course Details' },
  { path: 'planner', component: PlannerPage, title: 'StudyWise | Planner' },
  { path: 'upload', component: SyllabusUploadPage, title: 'StudyWise | Upload Syllabus' },
  { path: 'progress', component: ProgressPage, title: 'StudyWise | Progress' },
  { path: 'login', component: LoginPage, title: 'StudyWise | Log in' },
  { path: 'register', component: RegisterPage, title: 'StudyWise | Register' },
  { path: '**', redirectTo: '' },
];