import { Link } from 'react-router-dom';
import clsx from 'clsx';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Lumina';

export function BrandMark({ className = 'h-9 w-9' }) {
  return (
    <span
      className={clsx(
        'grid shrink-0 place-items-center rounded-xl bg-violet-gradient shadow-lg shadow-violet-900/40',
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]" fill="none">
        <path d="M12 3.5 21 8l-9 4.5L3 8l9-4.5Z" fill="white" fillOpacity="0.95" />
        <path
          d="M6 10.2v4.4c0 .5.28.95.73 1.17l4.5 2.25c.48.24 1.06.24 1.54 0l4.5-2.25c.45-.22.73-.67.73-1.17v-4.4L12 13.2 6 10.2Z"
          fill="white"
          fillOpacity="0.6"
        />
      </svg>
    </span>
  );
}

export default function Brand({ to = '/', compact = false, className }) {
  return (
    <Link
      to={to}
      className={clsx('group flex items-center gap-2.5', className)}
      aria-label={`${APP_NAME} home`}
    >
      <BrandMark className="h-9 w-9 transition-transform duration-300 group-hover:scale-105" />
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight text-white">
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}

export { APP_NAME };
