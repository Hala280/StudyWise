import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { register } from '../../ts/data/auth';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="animate-page max-w-md mx-auto px-6 py-16 sm:py-24">
      <p class="font-hand text-2xl accent mb-1">first day of class</p>
      <h1 class="font-display text-5xl text-ink-900 dark:text-paper mb-8">Create your account</h1>

      <form class="flex flex-col gap-5" (submit)="submit($event)" novalidate>
        <div class="flex flex-col gap-1.5">
          <label for="register-name" class="text-sm font-medium text-ink-900 dark:text-paper">Name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            autocomplete="name"
            required
            placeholder="Jordan Rivera"
            [class]="fieldClass()"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="register-email" class="text-sm font-medium text-ink-900 dark:text-paper">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@studywise.com"
            [class]="fieldClass()"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="register-password" class="text-sm font-medium text-ink-900 dark:text-paper">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            placeholder="At least 8 characters"
            [class]="fieldClass()"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="register-confirm" class="text-sm font-medium text-ink-900 dark:text-paper">Confirm password</label>
          <input
            id="register-confirm"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
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
          {{ submitting() ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="text-sm surface-muted mt-8">
        Already have an account?
        <a routerLink="/login" class="accent font-medium hover:opacity-80">Log in</a>
      </p>
    </section>
  `,
})
export class RegisterPage {
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
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const confirmPassword = String(data.get('confirmPassword') || '');

    if (!name || !email || !password || !confirmPassword) {
      this.error.set('Fill in every field to continue.');
      return;
    }

    if (password.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    const result = register(name, email, password);
    this.submitting.set(false);

    if (!result.ok) {
      this.error.set(result.error ?? 'Something went wrong. Try again.');
      return;
    }

    this.router.navigate(['/']);
  }
}
