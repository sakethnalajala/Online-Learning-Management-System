import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  ChevronDown,
  CircleCheck,
  FileText,
  HelpCircle,
  Lock,
  Play,
  PlayCircle,
} from 'lucide-react';
import { formatDuration } from '../../utils/format';

/**
 * Read-only curriculum outline for the course detail page.
 * Locked lessons still show their title and duration — the outline is a selling
 * point — but only preview lessons are clickable before enrolment.
 */
export default function Curriculum({ curriculum = [], isEnrolled = false, courseId, completedIds = [] }) {
  // First module open by default; a single-module course opens fully.
  const [open, setOpen] = useState(() => new Set(curriculum.slice(0, 1).map((m) => m._id)));

  const toggle = (id) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const done = new Set(completedIds.map(String));

  if (!curriculum.length) {
    return (
      <p className="rounded-xl border border-dashed border-ink-600 px-4 py-8 text-center text-sm text-slate-500">
        The instructor has not published any content yet.
      </p>
    );
  }

  const totalLessons = curriculum.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const totalMinutes = curriculum.reduce(
    (sum, m) => sum + (m.lessons || []).reduce((s, l) => s + (l.durationMinutes || 0), 0),
    0
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          {curriculum.length} module{curriculum.length === 1 ? '' : 's'} · {totalLessons} lesson
          {totalLessons === 1 ? '' : 's'} · {formatDuration(totalMinutes)} total
        </p>
        <button
          type="button"
          onClick={() =>
            setOpen((current) =>
              current.size === curriculum.length ? new Set() : new Set(curriculum.map((m) => m._id))
            )
          }
          className="font-semibold text-violet-300 hover:text-violet-200"
        >
          {open.size === curriculum.length ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="space-y-2.5">
        {curriculum.map((module, moduleIndex) => {
          const expanded = open.has(module._id);
          const lessons = module.lessons || [];
          const minutes = lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
          const completedHere = lessons.filter((l) => done.has(String(l._id))).length;

          return (
            <div key={module._id} className="overflow-hidden rounded-xl border border-ink-700 bg-ink-850/50">
              <button
                type="button"
                onClick={() => toggle(module._id)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ink-800/60"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-xs font-bold text-violet-300">
                  {moduleIndex + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{module.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {lessons.length} lesson{lessons.length === 1 ? '' : 's'} · {formatDuration(minutes)}
                    {isEnrolled && completedHere > 0 && (
                      <span className="ml-1.5 text-accent-emerald">· {completedHere} done</span>
                    )}
                  </span>
                </span>
                <ChevronDown
                  className={clsx(
                    'h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200',
                    expanded && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>

              {expanded && (
                <ul className="border-t border-ink-700/70">
                  {lessons.length === 0 && (
                    <li className="px-4 py-3 text-xs text-slate-600">No lessons in this module yet.</li>
                  )}
                  {lessons.map((lesson) => {
                    const accessible = isEnrolled || lesson.isPreview;
                    const isDone = done.has(String(lesson._id));
                    const Icon = isDone
                      ? CircleCheck
                      : accessible
                        ? lesson.type === 'article'
                          ? FileText
                          : Play
                        : Lock;

                    const row = (
                      <>
                        <Icon
                          className={clsx(
                            'h-4 w-4 shrink-0',
                            isDone ? 'text-accent-emerald' : accessible ? 'text-violet-400' : 'text-slate-600'
                          )}
                          aria-hidden="true"
                        />
                        <span
                          className={clsx(
                            'min-w-0 flex-1 truncate text-sm',
                            accessible ? 'text-slate-300' : 'text-slate-500'
                          )}
                        >
                          {lesson.title}
                        </span>

                        {lesson.hasQuiz && (
                          <span
                            className="flex shrink-0 items-center gap-1 text-2xs font-semibold text-amber-300"
                            title="This lesson has a quiz"
                          >
                            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Quiz
                          </span>
                        )}
                        {lesson.isPreview && !isEnrolled && (
                          <span className="badge-cyan shrink-0">Preview</span>
                        )}
                        <span className="shrink-0 text-xs tabular-nums text-slate-600">
                          {formatDuration(lesson.durationMinutes)}
                        </span>
                      </>
                    );

                    return (
                      <li key={lesson._id} className="border-b border-ink-800/60 last:border-0">
                        {accessible && courseId ? (
                          <Link
                            to={`/learn/${courseId}?lesson=${lesson._id}`}
                            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-violet-600/[0.07]"
                          >
                            {row}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3">{row}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {!isEnrolled && (
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <PlayCircle className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
          Preview lessons are free to watch. Enrol to unlock the rest.
        </p>
      )}
    </div>
  );
}
