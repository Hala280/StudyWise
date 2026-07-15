import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { login } from '../../ts/data/auth';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="animate-page max-w-md mx-auto px-6 py-16 sm:py-24">
      <p class="font-hand text-2xl accent mb-1">welcome back</p>
      <h1 class="font-display text-5xl text-ink-900 dark:text-paper mb-8">Log in</h1>

      <form class="flex flex-col gap-5" (submit)="submit($event)" novalidate>
        <div class="flex flex-col gap-1.5">
          <label for="login-email" class="text-sm font-medium text-ink-900 dark:text-paper">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@studywise.com"
            [class]="fieldClass()"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="login-password" class="text-sm font-medium text-ink-900 dark:text-paper">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            [class]="fieldClass()"
          />
        </div>

        @if (error()) {
          <p class="text-sm text-[#C15A3F] dark:text-[#E0765E]" role="alert">{{ error() }}</p>
        }

        <button
          type="submit"
          [disabled]="submitting()"
          class="cta-primary rounded-md px-5 py-3 text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        >
          {{ submitting() ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <p class="text-sm surface-muted mt-8">
        New to StudyWise?
        <a routerLink="/register" class="accent font-medium hover:opacity-80">Create an account</a>
      </p>

      <p class="text-xs surface-muted mt-10 border-t hairline pt-5">
        Demo account: <span class="font-mono">demo&#64;studywise.com</span> / <span class="font-mono">password123</span>
      </p>
    </section>
  `,
})
export class LoginPage {
  error = signal<string | null>(null);
  submitting = signal(false);

  constructor(private router: Router) {}

  fieldClass(): string {
    return 'rounded-lg border border-ink-200 dark:border-ink-400 bg-white dark:bg-ink-600 px-3.5 py-2.5 text-sm text-ink-900 dark:text-paper placeholder:text-ink-200 dark:placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-amber transition-shadow duration-150';
  }

  submit(event: SubmitEvent): void {
    event.preventDefault();
    this.error.set(null);

    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');

    if (!email || !password) {
      this.error.set('Enter your email and password.');
      return;
    }

    this.submitting.set(true);
    const result = login(email, password);
    this.submitting.set(false);

    if (!result.ok) {
      this.error.set(result.error ?? 'Something went wrong. Try again.');
      return;
    }

    this.router.navigate(['/']);
  }
}
