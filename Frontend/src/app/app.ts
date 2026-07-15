import { Component, HostListener, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { currentUser, firstNameOf, initialOf, logout, refreshCurrentUser } from '../ts/data/auth';

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
        <a routerLink="/progress" routerLinkActive="accent" class="hover:opacity-80">Progress</a>
      </div>

      <div class="flex items-center gap-4">
        <!-- Modernized theme toggle button containing Sun/Moon SVG icons -->
        <button 
          type="button" 
          class="w-10 h-10 rounded-full flex items-center justify-center border border-[#9b59f7]/20 text-var(--color-white) hover:bg-[#9b59f7]/10 transition-all duration-200" 
          aria-label="Toggle light/dark mode" 
          (click)="toggleAppearance()"
        >
          @if (appearance === 'dark') {
            <!-- Sun Icon (Shows in dark mode to switch to light) -->
            <svg class="w-5 h-5 text-[#e3c376]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
            </svg>
          } @else {
            <!-- Moon Icon (Shows in light mode to switch to dark) -->
            <svg class="w-5 h-5 text-[#5b21b6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          }
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
                <a
                  routerLink="/progress"
                  class="block px-4 py-2 text-sm text-ink-900 dark:text-paper hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors"
                  role="menuitem"
                  (click)="closeMenu()"
                >
                  Progress
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
  appearance: 'light' | 'dark' = 'dark';
  user = currentUser;
  menuOpen = signal(false);

  constructor(private router: Router) {
    void refreshCurrentUser().catch(() => undefined);
    this.initializeTheme();
  }

  /**
   * Safe check during initialization to sync state with local storage 
   * and apply correct CSS classes before rendering.
   */
  private initializeTheme(): void {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to 'dark' matching your default preference if nothing saved
    const isDark = saved === 'dark' || (!saved && prefersDark) || (!saved && !prefersDark);
    
    this.appearance = isDark ? 'dark' : 'light';
    this.applyTheme(isDark);
  }

  /**
   * Handles the DOM mutation to cleanly toggle classes and datasets on document.documentElement
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset['appearance'] = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.dataset['appearance'] = 'light';
    }
  }

  name(): string {
    const u = this.user();
    return u ? firstNameOf(u) : '';
  }

  initial(): string {
    const u = this.user();
    return u ? initialOf(u) : '';
  }

  toggleAppearance(): void {
    const nextDark = this.appearance !== 'dark';
    this.appearance = nextDark ? 'dark' : 'light';
    
    this.applyTheme(nextDark);
    localStorage.setItem('theme', this.appearance);
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async onLogout(): Promise<void> {
    await logout().catch(() => undefined);
    this.closeMenu();
    this.router.navigate(['/']);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.menuOpen()) this.closeMenu();
  }
}