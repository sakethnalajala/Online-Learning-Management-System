import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { BadgeCheck, Clock, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { certificateApi } from '../../api/endpoints';
import { Button, Field, InlineAlert, Input, SectionHeading } from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { formatDate } from '../../utils/format';

/**
 * Public certificate lookup. No authentication, because the point is that a
 * third party (an employer) can confirm a certificate without an account.
 */
export default function VerifyCertificate() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState(codeParam || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verify = async (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      setError('Enter a certificate ID or verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      setResult(await certificateApi.verify(trimmed));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when the page is opened with a code in the URL.
  useEffect(() => {
    if (codeParam) verify(codeParam);
  }, [codeParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (event) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed && trimmed !== codeParam) navigate(`/verify/${encodeURIComponent(trimmed)}`);
    else verify(trimmed);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-20">
      <div className="text-center">
        <span className="mb-6 inline-grid h-16 w-16 place-items-center rounded-2xl bg-violet-soft ring-1 ring-inset ring-violet-500/25">
          <ShieldCheck className="h-8 w-8 text-violet-300" aria-hidden="true" />
        </span>
      </div>

      <PageHeader
        backTo="/"
        title="Verify a certificate"
        description="Enter the certificate ID printed on the certificate (for example LMS-2026-8FK2QD) or the long verification code to confirm it is genuine."
        className="justify-center text-center [&>div]:mx-auto [&>div]:text-center"
      />

      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Certificate ID or verification code" error={error}>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <Input
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError('');
              }}
              placeholder="LMS-2026-XXXXXX"
              className="pl-10 font-mono"
              error={error}
            />
          </div>
        </Field>

        <Button type="submit" loading={loading} className="w-full" size="lg" icon={ShieldCheck}>
          Verify certificate
        </Button>
      </form>

      {result && (
        <div className="mt-8 animate-fade-up">
          {result.valid ? (
            <div className="surface-raised overflow-hidden">
              <div className="flex items-center gap-3 border-b border-emerald-500/25 bg-emerald-500/10 px-5 py-4">
                <BadgeCheck className="h-6 w-6 shrink-0 text-accent-emerald" aria-hidden="true" />
                <div>
                  <p className="font-bold text-accent-emerald">Certificate verified</p>
                  <p className="text-xs text-emerald-200/70">
                    This certificate was issued by Lumina and has not been revoked.
                  </p>
                </div>
              </div>

              <dl className="divide-y divide-ink-800">
                {[
                  { label: 'Certificate ID', value: result.certificateId, mono: true },
                  { label: 'Awarded to', value: result.studentName, strong: true },
                  { label: 'Course', value: result.courseTitle, strong: true },
                  { label: 'Instructor', value: result.instructorName || '—' },
                  { label: 'Issued on', value: formatDate(result.issuedAt) },
                  { label: 'Lessons completed', value: result.totalLessons || '—' },
                  {
                    label: 'Content length',
                    value: result.hoursOfContent ? `${result.hoursOfContent} hours` : '—',
                  },
                ].map((row) => (
                  <div key={row.label} className="flex flex-wrap items-baseline gap-2 px-5 py-3.5">
                    <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {row.label}
                    </dt>
                    <dd
                      className={clsx(
                        'min-w-0 flex-1 text-sm',
                        row.mono && 'font-mono',
                        row.strong ? 'font-semibold text-white' : 'text-slate-300'
                      )}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <InlineAlert tone="rose" icon={ShieldAlert} title="No matching certificate">
              We could not find a valid certificate for that code. Check the ID for typos — it is case
              insensitive but every character matters. A revoked certificate also reports as invalid.
            </InlineAlert>
          )}
        </div>
      )}

      <div className="mt-10 flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-850/50 p-4">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-slate-500">
          Certificates are issued automatically when a student completes every published lesson in a
          course. Each one carries a unique ID and a separate long verification code, either of which
          works here.{' '}
          <Link to="/courses" className="font-semibold text-violet-300 hover:text-violet-200">
            Browse courses
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
