import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
    title: 'StudyWise — Master Your Time, Powered by AI',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then((m) => m.AboutComponent),
    title: 'About StudyWise | Revolutionizing Student Productivity',
  },
  {
    path: 'ai-syllabus-parser',
    loadComponent: () =>
      import('./pages/parser-landing/parser-landing').then((m) => m.ParserLandingComponent),
    title: 'AI Syllabus Parser | StudyWise',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
    title: 'StudyWise — Dashboard',
  },
  { path: '**', redirectTo: '' },
];
