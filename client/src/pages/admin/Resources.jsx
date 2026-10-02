import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  AlignLeft,
  ExternalLink,
  FileText,
  FileType,
  HardDrive,
  Image as ImageIcon,
  Paperclip,
  Search,
  Trash2,
  Video,
  Youtube,
} from 'lucide-react';
import { resourceApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  PageLoader,
  Select,
  StatCard,
} from '../../components/ui';
import { PageHeader } from '../../components/layout/BackButton';
import { ChartCard, EmptyChart, MagnitudeBars } from '../../components/charts';
import { formatBytes, formatDate, timeAgo } from '../../utils/format';

const TYPE_META = {
  youtube: { label: 'YouTube', icon: Youtube },
  video: { label: 'Video', icon: Video },
  pdf: { label: 'PDF', icon: FileText },
  document: { label: 'Document', icon: FileType },
  image: { label: 'Image', icon: ImageIcon },
  text: { label: 'Notes', icon: AlignLeft },
  link: { label: 'Link', icon: ExternalLink },
};

export default function AdminResources() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (type = typeFilter) => {
    setLoading(true);
    setError('');
    try {
      setData(await resourceApi.adminAll(type !== 'all' ? { type } : {}));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(typeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  /** Platform-wide moderation: an admin may remove any lesson resource. */
  const remove = async () => {
    setDeleting(true);
    try {
      await resourceApi.remove(deleteTarget._id);
      toast.success('Resource removed from the lesson.');
      setDeleteTarget(null);
      await load(typeFilter);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data.resources;
    return data.resources.filter(
      (resource) =>
        resource.title?.toLowerCase().includes(term) ||
        resource.course?.title?.toLowerCase().includes(term) ||
        resource.lesson?.title?.toLowerCase().includes(term)
    );
  }, [data, search]);

  if (loading && !data) return <PageLoader label="Loading platform resources" />;
  if (error) return <ErrorState message={error} onRetry={() => load(typeFilter)} />;

  const uploadedCount = data.resources.filter((resource) => resource.isUploaded).length;

  return (
    <div className="space-y-7">
      <PageHeader
        backTo="/admin"
        eyebrow="Platform management"
        title="Learning resources"
        description="Every resource attached to a lesson across the platform: videos, PDFs, documents, images, notes and links."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total resources"
          value={data.resources.length}
          icon={Paperclip}
          tone="violet"
          hint="Showing the 200 most recent"
        />
        <StatCard
          label="Resource types in use"
          value={data.summary.length}
          icon={FileType}
          tone="cyan"
        />
        <StatCard
          label="Uploaded files"
          value={uploadedCount}
          icon={HardDrive}
          tone="amber"
          hint={`${data.resources.length - uploadedCount} external links`}
        />
        <StatCard
          label="Storage used"
          value={formatBytes(data.totalUploadedBytes)}
          icon={HardDrive}
          tone="emerald"
          hint="By uploaded files shown here"
        />
      </div>

      <ChartCard
        title="Resources by type"
        subtitle="What kinds of material instructors actually attach"
        height={Math.max(220, data.summary.length * 42)}
        tableData={data.summary.map((row) => ({
          type: TYPE_META[row.type]?.label || row.type,
          count: row.count,
        }))}
        tableColumns={[
          { key: 'type', label: 'Type' },
          { key: 'count', label: 'Resources', align: 'right' },
        ]}
      >
        {data.summary.length === 0 ? (
          <EmptyChart message="No resources yet" />
        ) : (
          <MagnitudeBars
            data={data.summary.map((row) => ({
              name: TYPE_META[row.type]?.label || row.type,
              value: row.count,
            }))}
            name="Resources"
            labelWidth={100}
          />
        )}
      </ChartCard>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by resource, lesson or course…"
            aria-label="Search resources"
            className="pl-10"
          />
        </div>

        <Select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filter by type"
          className="sm:w-48"
        >
          <option value="all">All types</option>
          {Object.entries(TYPE_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="surface-raised overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Paperclip}
            title="No resources match"
            description="Try a different type filter or search term."
          />
        ) : (
          <div className="table-wrap p-4 sm:p-5">
            <table className="table min-w-[780px]">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>Course</th>
                  <th>Lesson</th>
                  <th>Added by</th>
                  <th>Added</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((resource) => {
                  const meta = TYPE_META[resource.type] || TYPE_META.link;

                  return (
                    <tr key={resource._id}>
                      <td className="max-w-[16rem]">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-violet-300">
                            <meta.icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium text-white">{resource.title}</p>
                            {resource.fileSize > 0 && (
                              <p className="text-2xs text-slate-600">
                                {formatBytes(resource.fileSize)}
                                {resource.isUploaded && ' · uploaded'}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <Badge tone="slate">{meta.label}</Badge>
                      </td>

                      <td className="max-w-[13rem]">
                        {resource.course ? (
                          <Link
                            to={`/courses/${resource.course.slug || resource.course._id}`}
                            className="line-clamp-2 text-xs text-violet-300 hover:text-violet-200"
                          >
                            {resource.course.title}
                          </Link>
                        ) : (
                          <span className="text-2xs text-slate-600">—</span>
                        )}
                      </td>

                      <td className="max-w-[12rem]">
                        <span className="line-clamp-2 text-xs text-slate-400">
                          {resource.lesson?.title || '—'}
                        </span>
                      </td>

                      <td className="text-xs text-slate-400">{resource.uploadedBy?.name || '—'}</td>

                      <td className="whitespace-nowrap text-xs text-slate-400">
                        {timeAgo(resource.createdAt)}
                      </td>

                      <td>
                        <div className="flex items-center justify-end gap-0.5">
                          {resource.type !== 'text' && (
                            <a
                              href={assetUrl(resource.url)}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="btn-icon inline-grid"
                              aria-label={`Open ${resource.title}`}
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </a>
                          )}
                          <IconButton
                            icon={Trash2}
                            label={`Remove ${resource.title}`}
                            onClick={() => setDeleteTarget(resource)}
                            className="hover:text-accent-rose"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Remove this resource?"
        description={`"${deleteTarget?.title || ''}" will be detached from the lesson "${deleteTarget?.lesson?.title || ''}" and permanently deleted. The lesson itself is unaffected.`}
        confirmLabel="Remove resource"
      />
    </div>
  );
}
