import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Award, Check, Copy, Printer, ShieldCheck } from 'lucide-react';
import { certificateApi } from '../../api/endpoints';
import { Button, ErrorState, PageLoader } from '../../components/ui';
import { BrandMark } from '../../components/layout/Brand';
import BackButton from '../../components/layout/BackButton';
import { formatDate } from '../../utils/format';

/**
 * The renderable certificate. Printing is handled with a print stylesheet
 * rather than a PDF library, so what the student sees is exactly what prints.
 */
export default function CertificateView() {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    certificateApi
      .get(id)
      .then(setCertificate)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const copyLink = async () => {
    const url = `${window.location.origin}/verify/${certificate.certificateId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Verification link copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. The link is on the certificate itself.');
    }
  };

  if (loading) return <PageLoader label="Loading certificate" />;
  if (error || !certificate) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <ErrorState message={error || 'Certificate not found.'} />
        <div className="mt-6 text-center">
          <Link to="/student/certificates" className="btn-secondary">
            Back to my certificates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls — hidden when printing */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackButton to="/student/certificates" label="All certificates" subtle />

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={copied ? Check : Copy} onClick={copyLink}>
            {copied ? 'Copied' : 'Copy verify link'}
          </Button>
          <Button icon={Printer} onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* The certificate itself */}
      <div
        id="certificate"
        className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-8 shadow-glow-lg sm:p-12 print:border-slate-300 print:bg-white print:shadow-none"
      >
        {/* Ornamental corners and glow */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl print:hidden"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl print:hidden"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-4 rounded-xl border border-violet-500/15 print:border-slate-200"
          aria-hidden="true"
        />

        <div className="relative text-center">
          <div className="flex items-center justify-center gap-2.5">
            <BrandMark className="h-10 w-10" />
            <span className="font-display text-xl font-extrabold tracking-tight text-white print:text-slate-900">
              Lumina
            </span>
          </div>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.35em] text-violet-400 print:text-violet-700">
            Certificate of Completion
          </p>

          <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          <p className="mt-8 text-sm text-slate-400 print:text-slate-600">This certifies that</p>

          <h1 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl print:text-slate-900">
            {certificate.studentName}
          </h1>

          <p className="mt-6 text-sm text-slate-400 print:text-slate-600">
            has successfully completed all published lessons of
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl font-display text-xl font-bold leading-snug text-violet-200 sm:text-2xl print:text-violet-800">
            {certificate.courseTitle}
          </h2>

          {/* Achievement metrics */}
          <dl className="mx-auto mt-9 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
            {[
              { label: 'Lessons', value: certificate.totalLessons || '—' },
              {
                label: 'Content',
                value: certificate.hoursOfContent ? `${certificate.hoursOfContent} hrs` : '—',
              },
              {
                label: 'Quiz average',
                value: certificate.averageQuizScore ? `${certificate.averageQuizScore}%` : '—',
              },
              { label: 'Completion', value: `${certificate.completionPercentage}%` },
            ].map((item) => (
              <div key={item.label}>
                <dd className="font-display text-lg font-bold text-white print:text-slate-900">
                  {item.value}
                </dd>
                <dt className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500 print:text-slate-500">
                  {item.label}
                </dt>
              </div>
            ))}
          </dl>

          {/* Signatures row */}
          <div className="mt-12 flex flex-col items-center justify-between gap-8 border-t border-ink-700/70 pt-8 sm:flex-row print:border-slate-200">
            <div className="text-center sm:text-left">
              <p className="font-display text-base font-bold text-white print:text-slate-900">
                {certificate.instructorName || '—'}
              </p>
              <p className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                Course instructor
              </p>
            </div>

            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber-500/15 text-accent-amber ring-1 ring-inset ring-amber-500/30 print:bg-amber-100 print:text-amber-700">
              <Award className="h-7 w-7" aria-hidden="true" />
            </span>

            <div className="text-center sm:text-right">
              <p className="font-display text-base font-bold text-white print:text-slate-900">
                {formatDate(certificate.issuedAt)}
              </p>
              <p className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                Date issued
              </p>
            </div>
          </div>

          {/* Verification footer */}
          <div className="mt-8 flex flex-col items-center gap-1.5 border-t border-ink-700/70 pt-6 print:border-slate-200">
            <p className="flex items-center gap-1.5 font-mono text-xs text-violet-300 print:text-violet-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {certificate.certificateId}
            </p>
            <p className="text-2xs text-slate-500 print:text-slate-500">
              Verify this certificate at {window.location.origin}/verify/{certificate.certificateId}
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 print:hidden">
        Use your browser&rsquo;s print dialog and choose &ldquo;Save as PDF&rdquo; to keep a copy.
      </p>

      {/* Print rules: one page, certificate only. */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          #certificate, #certificate * { visibility: visible !important; }
          #certificate {
            position: absolute;
            inset: 0;
            margin: 0;
            max-width: none;
            width: 100%;
            color: #0f172a;
          }
        }
      `}</style>
    </div>
  );
}
