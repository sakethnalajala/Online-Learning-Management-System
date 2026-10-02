/**
 * Dark + violet premium design system, with a light theme.
 *
 * The surface and text scales resolve to CSS custom properties rather than
 * fixed hex values, so `bg-ink-900`, `text-slate-400`, `border-ink-700` and so
 * on keep working unchanged while flipping with `[data-theme]` on <html>.
 * The variables themselves live in src/styles/theme.css.
 *
 * `<alpha-value>` is required for Tailwind's opacity modifiers (`bg-ink-800/70`)
 * to keep working, which is why the variables store bare `R G B` channels.
 */
const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces, darkest to lightest in dark mode; the light theme inverts
        // the ramp so the same token names still read "further from the page".
        ink: {
          950: withAlpha('--ink-950'),
          900: withAlpha('--ink-900'),
          850: withAlpha('--ink-850'),
          800: withAlpha('--ink-800'),
          750: withAlpha('--ink-750'),
          700: withAlpha('--ink-700'),
          600: withAlpha('--ink-600'),
          500: withAlpha('--ink-500'),
        },

        // Text ramp. `white` is the strongest content colour on the current
        // surface, not literal white — use `text-on-accent` for text that sits
        // on a violet/coloured fill and must stay white in both themes.
        white: withAlpha('--text-strong'),
        slate: {
          100: withAlpha('--text-strong'),
          200: withAlpha('--text-body'),
          300: withAlpha('--text-body-soft'),
          400: withAlpha('--text-muted'),
          500: withAlpha('--text-subtle'),
          600: withAlpha('--text-faint'),
        },

        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: withAlpha('--violet-200'),
          300: withAlpha('--violet-300'),
          400: withAlpha('--violet-400'),
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },

        // The -200 step of each accent is used for text on a tinted fill
        // (alerts, quiz answer review), so it has to flip with the theme.
        // Extend merges per key, leaving the rest of each scale intact.
        emerald: { 200: withAlpha('--emerald-200') },
        rose: { 200: withAlpha('--rose-200') },
        cyan: { 200: withAlpha('--cyan-200') },
        amber: { 200: withAlpha('--amber-200') },

        // Status / categorical accents. These shift a step darker in the light
        // theme so they keep 3:1 contrast against a pale surface.
        accent: {
          cyan: withAlpha('--accent-cyan'),
          pink: withAlpha('--accent-pink'),
          amber: withAlpha('--accent-amber'),
          emerald: withAlpha('--accent-emerald'),
          rose: withAlpha('--accent-rose'),
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Sora', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--ring-violet) / 0.28), 0 8px 32px -8px rgb(var(--shadow-violet) / 0.45)',
        'glow-lg': '0 0 0 1px rgb(var(--ring-violet) / 0.34), 0 24px 64px -16px rgb(var(--shadow-violet) / 0.55)',
        card: '0 1px 2px rgb(var(--shadow-base) / 0.32), 0 8px 24px -12px rgb(var(--shadow-base) / 0.5)',
        lift: '0 12px 40px -12px rgb(var(--shadow-violet) / 0.4), 0 2px 8px rgb(var(--shadow-base) / 0.3)',
      },
      backgroundImage: {
        'violet-gradient': 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 55%, #22d3ee 100%)',
        'violet-soft':
          'linear-gradient(135deg, rgb(var(--violet-wash) / 0.16) 0%, rgb(var(--cyan-wash) / 0.08) 100%)',
        'hero-glow':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgb(var(--violet-wash) / var(--hero-glow-alpha)) 0%, transparent 70%)',
        'card-sheen':
          'linear-gradient(135deg, rgb(var(--sheen) / 0.055) 0%, rgb(var(--sheen) / 0) 60%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
