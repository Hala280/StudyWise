import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { AppComponent } from './app/app';
import { routes } from './app/app.routes';
import './styles.css';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withComponentInputBinding())],
}).catch((error) => console.error(error));