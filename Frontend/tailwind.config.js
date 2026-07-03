/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-appearance="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        board: { DEFAULT: '#1F3B32' },
        chalk: { DEFAULT: '#F2EFE6', dim: '#C9C4B4' },
        dust: { DEFAULT: '#E8C468' },
        coral: { DEFAULT: '#E0765E' },
        editor: { DEFAULT: '#1E1E2E', panel: '#181825' },
        syn: {
          keyword: '#C792EA',
          string: '#C3E88D',
          func: '#82AAFF',
          comment: '#6C7086',
          number: '#F78C6C',
          type: '#FFCB6B',
        },
        ink: {
          DEFAULT: '#14213D',
          50: '#F4F6FA',
          100: '#E4E8F1',
          200: '#C3CADD',
          400: '#5C6A8C',
          600: '#2C3B5E',
          900: '#0E1729',
        },
        paper: {
          DEFAULT: '#FBFAF7',
          dim: '#F2F0EA',
        },
        amber: {
          DEFAULT: '#E8A33D',
          light: '#F4C97A',
          dark: '#C9822A',
        },
        sage: {
          DEFAULT: '#5C7A5C',
          light: '#8FAE8B',
        },
      },
      fontFamily: {
        display: ['"Shadows Into Light"', 'cursive'],
        hand: ['"Patrick Hand"', 'cursive'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        fillLine: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        fillLine: 'fillLine 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
