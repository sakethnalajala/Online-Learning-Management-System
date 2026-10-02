import { useState } from 'react';
import clsx from 'clsx';
import {
  AlignLeft,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  FileType,
  Image as ImageIcon,
  Paperclip,
  Video,
  Youtube,
} from 'lucide-react';
import { assetUrl } from '../../api/client';
import { formatBytes, youtubeEmbed } from '../../utils/format';

const ICONS = {
  youtube: Youtube,
  video: Video,
  pdf: FileText,
  document: FileType,
  image: ImageIcon,
  text: AlignLeft,
  link: ExternalLink,
};

const LABELS = {
  youtube: 'Video',
  video: 'Video',
  pdf: 'PDF',
  document: 'Document',
  image: 'Image',
  text: 'Notes',
  link: 'Link',
};

/** Text and image resources render inline; everything else opens or downloads. */
function ResourceBody({ resource }) {
  if (resource.type === 'text') {
    return (
      <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-ink-700 bg-ink-900/70 p-4 font-sans text-sm leading-relaxed text-slate-300">
        {resource.textContent}
      </pre>
    );
  }

  if (resource.type === 'image') {
    return (
      <a
        href={assetUrl(resource.url)}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-3 block overflow-hidden rounded-xl border border-ink-700"
      >
        <img src={assetUrl(resource.url)} alt={resource.title} loading="lazy" className="w-full" />
      </a>
    );
  }

  if (resource.type === 'youtube') {
    const embed = youtubeEmbed(resource.url);
    if (!embed) return null;
    return (
      <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-ink-700">
        <iframe
          src={embed}
          title={resource.title}
          allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  if (resource.type === 'pdf' && resource.isUploaded) {
    return (
      <object
        data={assetUrl(resource.url)}
        type="application/pdf"
        className="mt-3 h-[28rem] w-full rounded-xl border border-ink-700"
      >
        <p className="p-4 text-sm text-slate-400">
          Your browser cannot display this PDF inline.{' '}
          <a
            href={assetUrl(resource.url)}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-violet-300"
          >
            Open it in a new tab
          </a>
          .
        </p>
      </object>
    );
  }

  return null;
}

export default function ResourceList({ resources = [] }) {
  const [open, setOpen] = useState(() => new Set());

  if (resources.length === 0) return null;

  const toggle = (id) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section>
      <h2 className="mb-3.5 flex items-center gap-2 text-lg">
        <Paperclip className="h-4 w-4 text-violet-400" aria-hidden="true" />
        Lesson resources
        <span className="text-sm font-normal text-slate-500">({resources.length})</span>
      </h2>

      <ul className="space-y-2.5">
        {resources.map((resource) => {
          const Icon = ICONS[resource.type] || Paperclip;
          const expandable = ['text', 'image', 'youtube'].includes(resource.type) ||
            (resource.type === 'pdf' && resource.isUploaded);
          const expanded = open.has(resource._id);
          const href = assetUrl(resource.url);

          return (
            <li key={resource._id} className="surface overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-violet-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{resource.title}</p>
                    <span className="badge-slate">{LABELS[resource.type]}</span>
                    {resource.fileSize > 0 && (
                      <span className="text-2xs text-slate-600">{formatBytes(resource.fileSize)}</span>
                    )}
                  </div>
                  {resource.description && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{resource.description}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {expandable && (
                    <button
                      type="button"
                      onClick={() => toggle(resource._id)}
                      aria-expanded={expanded}
                      aria-label={expanded ? 'Collapse' : 'Expand'}
                      className="btn-icon"
                    >
                      <ChevronDown
                        className={clsx('h-4 w-4 transition-transform', expanded && 'rotate-180')}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                  {resource.type !== 'text' && href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      {...(resource.isUploaded && resource.isDownloadable ? { download: resource.fileName } : {})}
                      className="btn-icon"
                      aria-label={`Open ${resource.title}`}
                    >
                      {resource.isUploaded && resource.isDownloadable ? (
                        <Download className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      )}
                    </a>
                  )}
                </div>
              </div>

              {expanded && (
                <div className="border-t border-ink-700/70 px-4 pb-4">
                  <ResourceBody resource={resource} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
