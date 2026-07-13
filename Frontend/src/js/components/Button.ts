// Button.ts
// Usage: import { createButton } from './components/Button';
//        container.appendChild(createButton({ label: 'Start studying', variant: 'primary' }));

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOptions {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-paper hover:bg-ink-600 dark:bg-amber dark:text-ink-900 dark:hover:bg-amber-light',
  secondary:
    'bg-transparent border border-ink-200 text-ink dark:border-ink-400 dark:text-paper hover:bg-ink-50 dark:hover:bg-ink-600',
  accent: 'bg-amber text-ink-900 hover:bg-amber-dark',
  ghost: 'bg-transparent text-ink dark:text-paper hover:bg-ink-50 dark:hover:bg-ink-600',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export function createButton({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: ButtonOptions): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.disabled = disabled;
  btn.className = [
    'rounded-lg font-medium transition-colors duration-150',
    VARIANTS[variant],
    SIZES[size],
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
  ].join(' ');

  if (onClick && !disabled) {
    btn.addEventListener('click', onClick);
  }

  return btn;
}