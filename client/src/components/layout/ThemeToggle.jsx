import clsx from 'clsx';
import { Moon, Sun } from 'lucide-react';
import { useTheme, THEMES } from '../../context/ThemeContext';

/**
 * Two-position theme switch. Both options stay visible so the control reads as
 * a choice rather than a mystery button, and the active side is obvious.
 */
export default function ThemeToggle({ className, compact = false }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: THEMES.LIGHT, icon: Sun, label: 'Light theme' },
    { value: THEMES.DARK, icon: Moon, label: 'Dark theme' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={clsx(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full border border-ink-600 bg-ink-800/80 p-0.5',
        className
      )}
    >
      {options.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => setTheme(option.value)}
            className={clsx(
              'grid place-items-center rounded-full transition-all duration-200 ease-premium',
              compact ? 'h-7 w-7' : 'h-8 w-8',
              active
                ? 'text-on-accent bg-violet-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <option.icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
