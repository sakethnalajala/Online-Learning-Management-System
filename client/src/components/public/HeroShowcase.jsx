import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Award, BookOpen, CheckCircle2, GraduationCap, ListChecks, PlayCircle } from 'lucide-react';

/**
 * The homepage hero visual: a layered depiction of this LMS rather than a
 * generic play button or a stock photo.
 *
 * It shows what the product actually does — a lesson inside a course, the
 * progress computed from completed lessons, a quiz result, and the certificate
 * that follows — so the picture and the claim beside it agree.
 *
 * Animation is layered depth plus a gentle pointer parallax. It is built from
 * transforms only (no layout or paint thrash), is capped at a few degrees so it
 * reads as depth rather than a toy, and switches off entirely for coarse
 * pointers and for `prefers-reduced-motion`.
 */
export default function HeroShowcase() {
  const frameRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    // Parallax is a pointer affordance: skip it on touch, and honour the
    // reduced-motion preference rather than animating anyway.
    const fine = window.matchMedia('(pointer: fine)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    const decide = () => setInteractive(fine.matches && !calm.matches);
    decide();

    fine.addEventListener('change', decide);
    calm.addEventListener('change', decide);
    return () => {
      fine.removeEventListener('change', decide);
      calm.removeEventListener('change', decide);
    };
  }, []);

  useEffect(() => {
    if (!interactive) return undefined;

    const node = frameRef.current;
    if (!node) return undefined;

    let frame = 0;

    const onMove = (event) => {
      // Coalesce to one update per frame; pointermove fires far more often.
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = node.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: px, y: py });
      });
    };

    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      setTilt({ x: 0, y: 0 });
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [interactive]);

  // Each layer moves a different amount, which is what sells the depth.
  const layer = (depth) => ({
    transform: `translate3d(${tilt.x * depth}px, ${tilt.y * depth}px, 0)`,
  });

  const lessons = [
    { title: 'Why React exists', done: true },
    { title: 'JSX and components in depth', done: true },
    { title: 'useState: batching and stale values', done: true },
    { title: 'useEffect: synchronisation', done: false, active: true },
  ];

  return (
    <div
      ref={frameRef}
      className="group relative mx-auto w-full max-w-xl select-none [perspective:1600px]"
    >
      {/* Ambient glow behind the whole scene. */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-violet-gradient opacity-20 blur-3xl transition-opacity duration-700 group-hover:opacity-30"
        aria-hidden="true"
      />

      <div
        className="relative transition-transform duration-500 ease-premium will-change-transform"
        style={{
          transform: `rotateY(${tilt.x * 7}deg) rotateX(${-tilt.y * 7}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ── Main card: a lesson inside a course ───────────────────────── */}
        <div
          className="surface-raised relative animate-fade-up overflow-hidden"
          style={layer(10)}
        >
          {/* Window chrome, so it reads as the product and not a photo. */}
          <div className="flex items-center gap-2 border-b border-ink-700/70 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-rose/70" aria-hidden="true" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent-amber/70" aria-hidden="true" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent-emerald/70" aria-hidden="true" />
            <span className="ml-2 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              <BookOpen className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">Modern React from Scratch · Lesson 4 of 7</span>
            </span>
          </div>

          {/* Lesson stage. A sheen sweeps across it on hover. */}
          <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-violet-900/45 via-ink-850 to-ink-900">
            {/* Faint schematic of a lesson: title bar, body lines, code block. */}
            <div className="absolute inset-0 p-5" aria-hidden="true">
              <div className="h-2 w-28 rounded-full bg-violet-400/40" />
              <div className="mt-4 space-y-2">
                <div className="h-1.5 w-full rounded-full bg-white/10" />
                <div className="h-1.5 w-[86%] rounded-full bg-white/10" />
                <div className="h-1.5 w-[72%] rounded-full bg-white/10" />
              </div>
              <div className="mt-5 space-y-1.5 rounded-lg border border-violet-500/20 bg-ink-950/40 p-3">
                <div className="h-1.5 w-[55%] rounded-full bg-accent-cyan/40" />
                <div className="ml-4 h-1.5 w-[70%] rounded-full bg-violet-400/35" />
                <div className="ml-4 h-1.5 w-[48%] rounded-full bg-accent-amber/30" />
                <div className="h-1.5 w-[30%] rounded-full bg-accent-cyan/40" />
              </div>
            </div>

            {/* Play affordance, now clearly part of a lesson rather than the
                whole picture. */}
            <div className="absolute inset-0 grid place-items-center">
              <span className="relative grid h-16 w-16 place-items-center rounded-full bg-violet-600/90 shadow-glow backdrop-blur-sm transition-transform duration-500 ease-premium group-hover:scale-110">
                <span
                  className="absolute inset-0 animate-pulse-ring rounded-full bg-violet-500/40"
                  aria-hidden="true"
                />
                <PlayCircle className="text-on-accent relative h-8 w-8" aria-hidden="true" />
              </span>
            </div>

            {/* Moving highlight. */}
            <div
              className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-all duration-1000 ease-premium group-hover:left-full"
              aria-hidden="true"
            />
          </div>

          {/* Progress and curriculum — the part that is genuinely this product. */}
          <div className="space-y-4 p-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-400">Course progress</span>
                <span className="font-bold text-violet-300">57%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-violet-gradient transition-[width] duration-1000 ease-premium"
                  style={{ width: '57%' }}
                />
              </div>
            </div>

            <ul className="space-y-2">
              {lessons.map((lesson) => (
                <li
                  key={lesson.title}
                  className={clsx(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                    lesson.active && 'bg-violet-600/15 ring-1 ring-inset ring-violet-500/30'
                  )}
                >
                  {lesson.done ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-accent-emerald"
                      aria-hidden="true"
                    />
                  ) : (
                    <PlayCircle className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
                  )}
                  <span
                    className={clsx(
                      'truncate',
                      lesson.done ? 'text-slate-500' : 'text-slate-200'
                    )}
                  >
                    {lesson.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Floating card: a graded quiz ──────────────────────────────── */}
        <div
          className="surface-raised absolute -left-6 top-[42%] hidden animate-fade-up items-center gap-3 p-3.5 pr-5 [animation-delay:260ms] sm:flex"
          style={layer(26)}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-accent-emerald ring-1 ring-inset ring-emerald-500/25">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-display text-lg font-bold leading-none text-accent-emerald">
              92%
            </span>
            <span className="mt-1 block text-2xs text-slate-500">Quiz passed</span>
          </span>
        </div>

        {/* ── Floating card: the certificate that follows completion ────── */}
        <div
          className="surface-raised absolute -right-5 -top-5 hidden animate-fade-up items-center gap-3 p-3.5 pr-5 [animation-delay:420ms] sm:flex"
          style={layer(34)}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-accent-amber ring-1 ring-inset ring-amber-500/25">
            <Award className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-bold leading-none text-white">Certificate</span>
            <span className="mt-1 block font-mono text-2xs text-violet-300">LMS-2026-8FK2QD</span>
          </span>
        </div>

        {/* ── Floating chip: enrolled learners ──────────────────────────── */}
        <div
          className="surface-raised absolute -bottom-7 left-6 hidden animate-fade-up items-center gap-2.5 px-4 py-2.5 [animation-delay:560ms] md:flex"
          style={layer(20)}
        >
          <GraduationCap className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-300">Learning right now</span>
          <span className="flex -space-x-2" aria-hidden="true">
            {['from-violet-500 to-violet-700', 'from-cyan-500 to-cyan-700', 'from-pink-500 to-pink-700'].map(
              (gradient) => (
                <span
                  key={gradient}
                  className={clsx(
                    'h-5 w-5 rounded-full bg-gradient-to-br ring-2 ring-ink-850',
                    gradient
                  )}
                />
              )
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
