import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <nav class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between border-b hairline">
      <a routerLink="/" class="font-display text-3xl">
        <span>StudyWise</span>
      </a>

      <div class="hidden sm:flex items-center gap-8 text-sm font-hand text-lg surface-muted">
        <a routerLink="/" routerLinkActive="accent" [routerLinkActiveOptions]="{ exact: true }" class="hover:opacity-80">Home</a>
        <a routerLink="/courses" routerLinkActive="accent" class="hover:opacity-80">Courses</a>
        <a routerLink="/planner" routerLinkActive="accent" class="hover:opacity-80">Planner</a>
      </div>

      <button type="button" class="appearance-toggle" aria-label="Toggle light/dark" (click)="toggleAppearance()">
        <span>{{ appearance === 'dark' ? 'Light' : 'Dark' }}</span>
      </button>
    </nav>

    <main class="route-shell">
      <router-outlet />
    </main>

    <footer class="border-t hairline">
      <div class="max-w-6xl mx-auto px-6 py-8 text-sm surface-muted flex items-center justify-between font-body">
        <span>2026 StudyWise</span>
        <span class="font-hand text-lg accent classic-only-decor">class dismissed</span>
      </div>
    </footer>
  `,
})
export class AppComponent {
  appearance = document.documentElement.dataset['appearance'] ?? 'dark';

  toggleAppearance(): void {
    this.appearance = this.appearance === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset['appearance'] = this.appearance;
  }
}
