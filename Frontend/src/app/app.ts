import { Component, HostListener, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { currentUser, firstNameOf, initialOf, logout } from '../ts/data/auth';

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
        <a routerLink="/upload" routerLinkActive="accent" class="hover:opacity-80">Upload syllabus</a>
      </div>

      <div class="flex items-center gap-4">
        <button type="button" class="appearance-toggle" aria-label="Toggle light/dark" (click)="toggleAppearance()">
          <span>{{ appearance === 'dark' ? 'Light' : 'Dark' }}</span>
        </button>

        @if (user(); as u) {
          <div class="relative">
            <button
              type="button"
              class="w-10 h-10 rounded-full cta-primary font-display text-lg flex items-center justify-center hover:brightness-110 transition"
              [attr.aria-expanded]="menuOpen()"
              aria-haspopup="true"
              [attr.aria-label]="'Account menu for ' + name()"
              (click)="toggleMenu($event)"
            >
              {{ initial() }}
            </button>

            @if (menuOpen()) {
              <div
                class="animate-page absolute right-0 top-12 z-50 w-52 rounded-xl border border-ink-100 dark:border-ink-400 bg-paper dark:bg-ink-600 shadow-lg py-2"
                role="menu"
              >
                <div class="px-4 py-2 border-b hairline mb-1">
                  <p class="text-sm font-semibold text-ink-900 dark:text-paper">{{ name() }}</p>
                  <p class="text-xs surface-muted truncate">{{ u.email }}</p>
                </div>
                <a
                  routerLink="/courses"
                  class="block px-4 py-2 text-sm text-ink-900 dark:text-paper hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors"
                  role="menuitem"
                  (click)="closeMenu()"
                >
                  My courses
                </a>
                <a
                  routerLink="/planner"
                  class="block px-4 py-2 text-sm text-ink-900 dark:text-paper hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors"
                  role="menuitem"
                  (click)="closeMenu()"
                >
                  Planner
                </a>
                <a
                  routerLink="/upload"
                  class="block px-4 py-2 text-sm text-ink-900 dark:text-paper hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors"
                  role="menuitem"
                  (click)="closeMenu()"
                >
                  Upload syllabus
                </a>
                <button
                  type="button"
                  class="w-full text-left px-4 py-2 text-sm text-[#C15A3F] dark:text-[#E0765E] hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors"
                  role="menuitem"
                  (click)="onLogout()"
                >
                  Log out
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="hidden sm:flex items-center gap-3">
            <a routerLink="/login" class="text-sm font-medium surface-muted hover:accent transition-colors">Log in</a>
            <a routerLink="/register" class="cta-primary rounded-md px-4 py-2 text-sm font-semibold hover:brightness-110 transition">Sign up</a>
          </div>
        }
      </div>
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
  user = currentUser;
  menuOpen = signal(false);

  constructor(private router: Router) {}

  name(): string {
    const u = this.user();
    return u ? firstNameOf(u) : '';
  }

  initial(): string {
    const u = this.user();
    return u ? initialOf(u) : '';
  }

  toggleAppearance(): void {
    this.appearance = this.appearance === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset['appearance'] = this.appearance;
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onLogout(): void {
    logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.menuOpen()) this.closeMenu();
  }
}