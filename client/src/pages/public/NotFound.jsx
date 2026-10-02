import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-extrabold text-gradient sm:text-8xl">404</p>
      <h1 className="mt-5 text-2xl sm:text-3xl">This page does not exist</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        The link may be broken, or the course or page it pointed at may have been removed.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back home
        </Link>
        <Link to="/courses" className="btn-secondary">
          <Search className="h-4 w-4" aria-hidden="true" />
          Browse courses
        </Link>
      </div>

      <Compass className="mt-12 h-10 w-10 text-ink-600" aria-hidden="true" />
    </div>
  );
}
