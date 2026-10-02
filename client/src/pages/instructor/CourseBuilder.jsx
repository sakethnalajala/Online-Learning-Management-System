import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  BookOpen,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Megaphone,
  Paperclip,
  Pencil,
  Plus,
  Save,
  Send,
  Settings2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  categoryApi,
  courseApi,
  lessonApi,
  moduleApi,
  quizApi,
  resourceApi,
} from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  InlineAlert,
  Input,
  Modal,
  PageLoader,
  Select,
  Tabs,
  Textarea,
  Toggle,
} from '../../components/ui';
import BackButton from '../../components/layout/BackButton';
import { COURSE_STATUS_META, formatDuration, formatPrice } from '../../utils/format';

const TABS = [
  { id: 'curriculum', label: 'Curriculum', icon: Layers },
  { id: 'details', label: 'Course details', icon: Settings2 },
];

const RESOURCE_TYPES = [
  { value: 'youtube', label: 'YouTube video' },
  { value: 'video', label: 'Video URL' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'link', label: 'External link' },
  { value: 'text', label: 'Text notes' },
];

const EMPTY_LESSON = {
  title: '',
  summary: '',
  content: '',
  videoUrl: '',
  durationMinutes: 10,
  isPreview: false,
  isPublished: true,
};

const EMPTY_RESOURCE = {
  title: '',
  description: '',
  type: 'link',
  url: '',
  textContent: '',
  isDownloadable: true,
};

const EMPTY_QUESTION = {
  text: '',
  type: 'single',
  explanation: '',
  points: 1,
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ],
};

export default function CourseBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('curriculum');
  const [expanded, setExpanded] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  /* ── Modals ───────────────────────────────────────────────────────────── */
  const [moduleModal, setModuleModal] = useState(null); // { mode, module }
  const [lessonModal, setLessonModal] = useState(null); // { mode, moduleId, lesson }
  const [resourceModal, setResourceModal] = useState(null); // { lesson }
  const [quizModal, setQuizModal] = useState(null); // { lesson }
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { title, description, onConfirm }

  /* ── Load ─────────────────────────────────────────────────────────────── */

  const load = useCallback(async () => {
    try {
      const [detail, moduleList] = await Promise.all([
        courseApi.get(id),
        moduleApi.listByCourse(id),
      ]);
      setCourse(detail.course);
      setModules(moduleList);
      // Keep the first module open so the page is not a wall of collapsed rows.
      setExpanded((current) =>
        current.size === 0 && moduleList[0] ? new Set([moduleList[0]._id]) : current
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    categoryApi
      .list()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [load]);

  if (loading) return <PageLoader label="Loading course" />;
  if (error || !course) {
    return (
      <div className="py-10">
        <ErrorState message={error || 'Course not found.'} onRetry={load} />
        <div className="mt-6 text-center">
          <Link to="/instructor/courses" className="btn-secondary">
            Back to my courses
          </Link>
        </div>
      </div>
    );
  }

  const statusMeta = COURSE_STATUS_META[course.status];
  const totalLessons = modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);

  const toggleModule = (moduleId) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  /* ── Lifecycle actions ────────────────────────────────────────────────── */

  const runLifecycle = async (action) => {
    setBusy(true);
    try {
      if (action === 'submit') {
        await courseApi.submit(course._id);
        toast.success('Submitted for admin review.');
      } else if (action === 'publish') {
        await courseApi.publish(course._id);
        toast.success('Course is live.');
      } else if (action === 'unpublish') {
        await courseApi.unpublish(course._id);
        toast.success('Course unpublished.');
      }
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ── Module CRUD ──────────────────────────────────────────────────────── */

  const saveModule = async (payload, mode, moduleId) => {
    if (mode === 'edit') {
      await moduleApi.update(moduleId, payload);
      toast.success('Module updated.');
    } else {
      const created = await moduleApi.create(course._id, payload);
      toast.success('Module added.');
      setExpanded((current) => new Set([...current, created._id]));
    }
    setModuleModal(null);
    await load();
  };

  const deleteModule = (module) =>
    setConfirm({
      title: 'Delete this module?',
      description: `"${module.title}" and its ${module.lessons?.length || 0} lesson(s), along with their resources and quizzes, will be permanently deleted.`,
      confirmLabel: 'Delete module',
      onConfirm: async () => {
        await moduleApi.remove(module._id);
        toast.success('Module deleted.');
        setConfirm(null);
        await load();
      },
    });

  const moveModule = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;

    const order = modules.map((module) => module._id);
    [order[index], order[target]] = [order[target], order[index]];

    setBusy(true);
    try {
      await moduleApi.reorder(course._id, order);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ── Lesson CRUD ──────────────────────────────────────────────────────── */

  const saveLesson = async (payload, mode, context) => {
    if (mode === 'edit') {
      await lessonApi.update(context.lesson._id, payload);
      toast.success('Lesson updated.');
    } else {
      await lessonApi.create(context.moduleId, payload);
      toast.success('Lesson added. Enrolled students were notified.');
    }
    setLessonModal(null);
    await load();
  };

  const deleteLesson = (lesson) =>
    setConfirm({
      title: 'Delete this lesson?',
      description: `"${lesson.title}" and its resources and quiz will be permanently deleted. Student progress is recalculated afterwards.`,
      confirmLabel: 'Delete lesson',
      onConfirm: async () => {
        await lessonApi.remove(lesson._id);
        toast.success('Lesson deleted.');
        setConfirm(null);
        await load();
      },
    });

  const moveLesson = async (module, index, direction) => {
    const lessons = module.lessons || [];
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;

    const order = lessons.map((lesson) => lesson._id);
    [order[index], order[target]] = [order[target], order[index]];

    setBusy(true);
    try {
      await lessonApi.reorder(module._id, order);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleLessonPublished = async (lesson) => {
    setBusy(true);
    try {
      await lessonApi.update(lesson._id, { isPublished: !lesson.isPublished });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <BackButton to="/instructor/courses" label="My courses" className="mb-4" />

        <div className="surface-raised p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                {assetUrl(course.thumbnail) ? (
                  <img src={assetUrl(course.thumbnail)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center bg-gradient-to-br from-violet-900/50 to-ink-850">
                    <BookOpen className="h-5 w-5 text-violet-500/60" aria-hidden="true" />
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {statusMeta && <span className={statusMeta.className}>{statusMeta.label}</span>}
                  <span className="badge-slate">{formatPrice(course)}</span>
                  {course.category?.name && <span className="badge-slate">{course.category.name}</span>}
                </div>

                <h1 className="text-xl leading-snug sm:text-2xl">{course.title}</h1>

                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{modules.length} modules</span>
                  <span>{totalLessons} lessons</span>
                  <span>{formatDuration(course.totalDurationMinutes)}</span>
                  <span>{course.enrollmentCount} students</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {course.status === 'published' && (
                <Link to={`/courses/${course.slug}`} className="btn-secondary btn-sm">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  View live
                </Link>
              )}

              <Link to={`/instructor/courses/${course._id}/students`} className="btn-secondary btn-sm">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                Students
              </Link>

              {course.enrollmentCount > 0 && (
                <Button variant="secondary" size="sm" icon={Megaphone} onClick={() => setAnnounceOpen(true)}>
                  Announce
                </Button>
              )}

              {['draft', 'rejected'].includes(course.status) && (
                <Button size="sm" icon={Send} loading={busy} onClick={() => runLifecycle('submit')}>
                  Submit for review
                </Button>
              )}

              {['approved', 'unpublished'].includes(course.status) && (
                <Button variant="success" size="sm" icon={Eye} loading={busy} onClick={() => runLifecycle('publish')}>
                  Publish
                </Button>
              )}

              {course.status === 'published' && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={EyeOff}
                  loading={busy}
                  onClick={() => runLifecycle('unpublish')}
                >
                  Unpublish
                </Button>
              )}
            </div>
          </div>

          {course.status === 'rejected' && course.rejectionReason && (
            <InlineAlert tone="rose" icon={AlertTriangle} title="An admin requested changes" className="mt-5">
              {course.rejectionReason}
            </InlineAlert>
          )}

          {course.status === 'pending' && (
            <InlineAlert tone="amber" className="mt-5">
              This course is waiting on an admin review. You can keep editing it while it is in the
              queue, but it will not appear to students until it is approved and published.
            </InlineAlert>
          )}

          {course.status === 'draft' && totalLessons === 0 && (
            <InlineAlert tone="violet" className="mt-5">
              Add at least one module with a published lesson, then submit the course for review.
            </InlineAlert>
          )}
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'curriculum' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg">Curriculum</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Course → module → lesson → resources and quiz. Use the arrows to reorder.
              </p>
            </div>
            <Button icon={Plus} onClick={() => setModuleModal({ mode: 'create' })}>
              Add module
            </Button>
          </div>

          {modules.length === 0 ? (
            <div className="surface-raised">
              <EmptyState
                icon={Layers}
                title="No modules yet"
                description="A course is organised into modules, each holding an ordered list of lessons. Start with your first module."
                action={
                  <Button icon={Plus} onClick={() => setModuleModal({ mode: 'create' })}>
                    Add the first module
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((module, moduleIndex) => {
                const open = expanded.has(module._id);
                const lessons = module.lessons || [];

                return (
                  <section key={module._id} className="surface-raised overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => toggleModule(module._id)}
                        aria-expanded={open}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-xs font-bold text-violet-300">
                          {moduleIndex + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-bold text-white">{module.title}</span>
                            {!module.isPublished && <Badge tone="slate">Hidden</Badge>}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {lessons.length} lesson{lessons.length === 1 ? '' : 's'} ·{' '}
                            {formatDuration(
                              lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0)
                            )}
                          </span>
                        </span>
                        <ChevronDown
                          className={clsx(
                            'h-4 w-4 shrink-0 text-slate-500 transition-transform',
                            open && 'rotate-180'
                          )}
                          aria-hidden="true"
                        />
                      </button>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <IconButton
                          icon={ArrowUp}
                          label="Move module up"
                          disabled={moduleIndex === 0 || busy}
                          onClick={() => moveModule(moduleIndex, -1)}
                        />
                        <IconButton
                          icon={ArrowDown}
                          label="Move module down"
                          disabled={moduleIndex === modules.length - 1 || busy}
                          onClick={() => moveModule(moduleIndex, 1)}
                        />
                        <IconButton
                          icon={Pencil}
                          label="Edit module"
                          onClick={() => setModuleModal({ mode: 'edit', module })}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Delete module"
                          onClick={() => deleteModule(module)}
                          className="hover:text-accent-rose"
                        />
                      </div>
                    </div>

                    {open && (
                      <div className="border-t border-ink-700/70 bg-ink-900/40 p-4">
                        {module.description && (
                          <p className="mb-4 text-xs leading-relaxed text-slate-500">{module.description}</p>
                        )}

                        {lessons.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-xs text-slate-500">
                            No lessons in this module yet.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {lessons.map((lesson, lessonIndex) => (
                              <li
                                key={lesson._id}
                                className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-700 bg-ink-850/70 p-3"
                              >
                                <GripVertical className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />

                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={clsx(
                                        'truncate text-sm font-medium',
                                        lesson.isPublished ? 'text-white' : 'text-slate-500'
                                      )}
                                    >
                                      {lessonIndex + 1}. {lesson.title}
                                    </span>
                                    {lesson.isPreview && <Badge tone="cyan">Preview</Badge>}
                                    {!lesson.isPublished && <Badge tone="slate">Draft</Badge>}
                                    {lesson.hasQuiz && (
                                      <Badge tone="amber" icon={HelpCircle}>
                                        Quiz
                                      </Badge>
                                    )}
                                    {lesson.resourceCount > 0 && (
                                      <Badge tone="violet" icon={Paperclip}>
                                        {lesson.resourceCount}
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="mt-0.5 block text-2xs text-slate-600">
                                    {formatDuration(lesson.durationMinutes)} · {lesson.type}
                                  </span>
                                </span>

                                <div className="flex shrink-0 flex-wrap items-center gap-0.5">
                                  <IconButton
                                    icon={ArrowUp}
                                    label="Move lesson up"
                                    disabled={lessonIndex === 0 || busy}
                                    onClick={() => moveLesson(module, lessonIndex, -1)}
                                  />
                                  <IconButton
                                    icon={ArrowDown}
                                    label="Move lesson down"
                                    disabled={lessonIndex === lessons.length - 1 || busy}
                                    onClick={() => moveLesson(module, lessonIndex, 1)}
                                  />
                                  <IconButton
                                    icon={lesson.isPublished ? Eye : EyeOff}
                                    label={lesson.isPublished ? 'Unpublish lesson' : 'Publish lesson'}
                                    onClick={() => toggleLessonPublished(lesson)}
                                    className={lesson.isPublished ? 'text-accent-emerald' : ''}
                                  />
                                  <IconButton
                                    icon={Paperclip}
                                    label="Manage resources"
                                    onClick={() => setResourceModal({ lesson })}
                                  />
                                  <IconButton
                                    icon={ListChecks}
                                    label="Manage quiz"
                                    onClick={() => setQuizModal({ lesson })}
                                  />
                                  <IconButton
                                    icon={Pencil}
                                    label="Edit lesson"
                                    onClick={() => setLessonModal({ mode: 'edit', lesson })}
                                  />
                                  <IconButton
                                    icon={Trash2}
                                    label="Delete lesson"
                                    onClick={() => deleteLesson(lesson)}
                                    className="hover:text-accent-rose"
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Plus}
                          className="mt-3"
                          onClick={() => setLessonModal({ mode: 'create', moduleId: module._id })}
                        >
                          Add lesson to this module
                        </Button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <CourseDetailsForm course={course} categories={categories} onSaved={load} />
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {moduleModal && (
        <ModuleModal
          mode={moduleModal.mode}
          module={moduleModal.module}
          onClose={() => setModuleModal(null)}
          onSave={saveModule}
        />
      )}

      {lessonModal && (
        <LessonModal
          mode={lessonModal.mode}
          lesson={lessonModal.lesson}
          moduleId={lessonModal.moduleId}
          onClose={() => setLessonModal(null)}
          onSave={saveLesson}
        />
      )}

      {resourceModal && (
        <ResourceModal lesson={resourceModal.lesson} onClose={() => setResourceModal(null)} onChanged={load} />
      )}

      {quizModal && (
        <QuizModal lesson={quizModal.lesson} onClose={() => setQuizModal(null)} onChanged={load} />
      )}

      {announceOpen && (
        <AnnounceModal course={course} onClose={() => setAnnounceOpen(false)} />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          try {
            await confirm.onConfirm();
          } catch (err) {
            toast.error(err.message);
            setConfirm(null);
          }
        }}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
      />
    </div>
  );
}

/* ══ Course details form ════════════════════════════════════════════════ */

function CourseDetailsForm({ course, categories, onSaved }) {
  const [form, setForm] = useState({
    title: course.title || '',
    subtitle: course.subtitle || '',
    description: course.description || '',
    category: course.category?._id || course.category || '',
    level: course.level || 'beginner',
    language: course.language || 'English',
    promoVideoUrl: course.promoVideoUrl || '',
    tags: course.tags || [],
    whatYouWillLearn: course.whatYouWillLearn?.length ? course.whatYouWillLearn : [''],
    requirements: course.requirements?.length ? course.requirements : [''],
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const setList = (field, index, value) => {
    const next = [...form[field]];
    next[index] = value;
    setForm({ ...form, [field]: next });
  };

  const addListItem = (field) => setForm({ ...form, [field]: [...form[field], ''] });

  const removeListItem = (field, index) =>
    setForm({ ...form, [field]: form[field].filter((_, i) => i !== index) });

  const save = async (event) => {
    event.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        category: form.category,
        level: form.level,
        language: form.language.trim(),
        promoVideoUrl: form.promoVideoUrl.trim(),
        isFree: true,
        price: 0,
        discountPrice: 0,
        tags: form.tags,
        // Blank rows are the form's, not the data's.
        whatYouWillLearn: form.whatYouWillLearn.map((s) => s.trim()).filter(Boolean),
        requirements: form.requirements.map((s) => s.trim()).filter(Boolean),
      };

      await courseApi.update(course._id, payload);
      toast.success('Course details saved.');
      await onSaved();
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadThumbnail = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file.');
      return;
    }

    setUploading(true);
    try {
      await courseApi.uploadThumbnail(course._id, file);
      toast.success('Thumbnail updated.');
      await onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const addTag = () => {
    const value = tagInput.trim().toLowerCase();
    if (!value || form.tags.includes(value)) {
      setTagInput('');
      return;
    }
    setForm({ ...form, tags: [...form.tags, value] });
    setTagInput('');
  };

  return (
    <form onSubmit={save} className="space-y-5">
      {/* Thumbnail */}
      <div className="surface-raised p-5 sm:p-6">
        <h3 className="mb-4 text-base">Course thumbnail</h3>
        <div className="flex flex-wrap items-center gap-5">
          <div className="aspect-video w-56 shrink-0 overflow-hidden rounded-xl bg-ink-800">
            {assetUrl(course.thumbnail) ? (
              <img src={assetUrl(course.thumbnail)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full place-items-center bg-gradient-to-br from-violet-900/50 to-ink-850">
                <ImageIcon className="h-6 w-6 text-violet-500/60" aria-hidden="true" />
              </span>
            )}
          </div>

          <div>
            <Button
              variant="secondary"
              icon={Upload}
              loading={uploading}
              onClick={() => fileInput.current?.click()}
            >
              Upload image
            </Button>
            <input ref={fileInput} type="file" accept="image/*" onChange={uploadThumbnail} className="sr-only" />
            <p className="mt-2 text-xs text-slate-500">16:9 works best. JPG, PNG or WebP.</p>
          </div>
        </div>
      </div>

      {/* Basics */}
      <div className="surface-raised space-y-5 p-5 sm:p-6">
        <h3 className="text-base">Basics</h3>

        <Field label="Course title" required error={errors.title}>
          <Input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
            error={errors.title}
          />
        </Field>

        <Field label="Subtitle" error={errors.subtitle}>
          <Input
            value={form.subtitle}
            onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
            maxLength={220}
            error={errors.subtitle}
          />
        </Field>

        <Field
          label="Description"
          required
          hint={`${form.description.length}/6000 characters`}
          error={errors.description}
        >
          <Textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={7}
            maxLength={6000}
            required
            error={errors.description}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category" required error={errors.category}>
            <Select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              required
              error={errors.category}
            >
              <option value="">Choose…</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Level" error={errors.level}>
            <Select
              value={form.level}
              onChange={(event) => setForm({ ...form, level: event.target.value })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </Field>

          <Field label="Language" error={errors.language}>
            <Input
              value={form.language}
              onChange={(event) => setForm({ ...form, language: event.target.value })}
              error={errors.language}
            />
          </Field>
        </div>

        <Field
          label="Promo video URL"
          hint="A YouTube link shown on the course page before enrolment"
          error={errors.promoVideoUrl}
        >
          <Input
            value={form.promoVideoUrl}
            onChange={(event) => setForm({ ...form, promoVideoUrl: event.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
            error={errors.promoVideoUrl}
          />
        </Field>
      </div>

      {/* Pricing — every course on Lumina is free, so there is nothing to set. */}
      <div className="surface-raised p-5 sm:p-6">
        <h3 className="mb-2 text-base">Pricing</h3>
        <p className="text-sm font-semibold text-accent-emerald">This course is free</p>
        <p className="mt-1 text-xs text-slate-400">
          Every course on Lumina is free. Students enrol in one click and the content unlocks
          immediately, so there is no price, discount or payment step to configure.
        </p>
      </div>

      {/* Outcomes */}
      <div className="surface-raised space-y-6 p-5 sm:p-6">
        <div>
          <h3 className="mb-1.5 text-base">What students will learn</h3>
          <p className="mb-3 text-xs text-slate-500">
            Concrete outcomes, shown as a checklist on the course page.
          </p>
          <ListEditor
            items={form.whatYouWillLearn}
            placeholder="e.g. Debug re-renders instead of guessing at them"
            onChange={(index, value) => setList('whatYouWillLearn', index, value)}
            onAdd={() => addListItem('whatYouWillLearn')}
            onRemove={(index) => removeListItem('whatYouWillLearn', index)}
          />
        </div>

        <div>
          <h3 className="mb-1.5 text-base">Requirements</h3>
          <p className="mb-3 text-xs text-slate-500">
            What a student needs before starting. Be honest — it saves refunds and bad reviews.
          </p>
          <ListEditor
            items={form.requirements}
            placeholder="e.g. Comfortable with HTML and CSS"
            onChange={(index, value) => setList('requirements', index, value)}
            onAdd={() => addListItem('requirements')}
            onRemove={(index) => removeListItem('requirements', index)}
          />
        </div>

        <div>
          <h3 className="mb-1.5 text-base">Topic tags</h3>
          <p className="mb-3 text-xs text-slate-500">Used by search and the catalogue filters.</p>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="e.g. react"
              maxLength={40}
            />
            <Button variant="secondary" icon={Plus} onClick={addTag}>
              Add
            </Button>
          </div>
          {form.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span key={tag} className="badge-violet gap-1.5">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" icon={Save} loading={saving} size="lg">
          Save course details
        </Button>
      </div>
    </form>
  );
}

function ListEditor({ items, placeholder, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(event) => onChange(index, event.target.value)}
            placeholder={placeholder}
            maxLength={200}
          />
          <IconButton
            icon={Trash2}
            label="Remove item"
            onClick={() => onRemove(index)}
            disabled={items.length === 1}
            className="hover:text-accent-rose"
          />
        </div>
      ))}
      <Button variant="ghost" size="sm" icon={Plus} onClick={onAdd}>
        Add another
      </Button>
    </div>
  );
}

/* ══ Module modal ═══════════════════════════════════════════════════════ */

function ModuleModal({ mode, module, onClose, onSave }) {
  const [form, setForm] = useState({
    title: module?.title || '',
    description: module?.description || '',
    isPublished: module?.isPublished ?? true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event?.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await onSave(
        { title: form.title.trim(), description: form.description.trim(), isPublished: form.isPublished },
        mode,
        module?._id
      );
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'edit' ? 'Edit module' : 'Add a module'}
      description="A module groups related lessons into a section of the course."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} icon={Save}>
            {mode === 'edit' ? 'Save module' : 'Add module'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Module title" required error={errors.title}>
          <Input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Foundations of React"
            required
            autoFocus
            error={errors.title}
          />
        </Field>

        <Field label="Description" hint="Optional — a line on what this section covers" error={errors.description}>
          <Textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={3}
            maxLength={1000}
            error={errors.description}
          />
        </Field>

        <Toggle
          label="Visible to students"
          description="Hidden modules and their lessons are excluded from progress calculations."
          checked={form.isPublished}
          onChange={(value) => setForm({ ...form, isPublished: value })}
        />
      </form>
    </Modal>
  );
}

/* ══ Lesson modal ═══════════════════════════════════════════════════════ */

function LessonModal({ mode, lesson, moduleId, onClose, onSave }) {
  const [form, setForm] = useState(
    lesson
      ? {
          title: lesson.title || '',
          summary: lesson.summary || '',
          content: lesson.content || '',
          videoUrl: lesson.videoUrl || '',
          durationMinutes: lesson.durationMinutes ?? 10,
          isPreview: lesson.isPreview ?? false,
          isPublished: lesson.isPublished ?? true,
        }
      : EMPTY_LESSON
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [full, setFull] = useState(lesson || null);

  // The list view carries a trimmed lesson; fetch the body when editing.
  useEffect(() => {
    if (mode !== 'edit' || !lesson?._id || lesson.content !== undefined) return;
    lessonApi
      .get(lesson._id)
      .then((payload) => {
        setFull(payload.lesson);
        setForm((current) => ({
          ...current,
          content: payload.lesson.content || '',
          summary: payload.lesson.summary || '',
          videoUrl: payload.lesson.videoUrl || '',
        }));
      })
      .catch(() => {});
  }, [mode, lesson]);

  const submit = async (event) => {
    event?.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await onSave(
        {
          title: form.title.trim(),
          summary: form.summary.trim(),
          content: form.content,
          videoUrl: form.videoUrl.trim(),
          type: form.videoUrl.trim() ? 'video' : 'article',
          durationMinutes: Number(form.durationMinutes) || 0,
          isPreview: form.isPreview,
          isPublished: form.isPublished,
        },
        mode,
        { lesson, moduleId }
      );
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'edit' ? 'Edit lesson' : 'Add a lesson'}
      description="Attach resources and a quiz from the curriculum list once the lesson exists."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} icon={Save}>
            {mode === 'edit' ? 'Save lesson' : 'Add lesson'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Lesson title" required error={errors.title}>
          <Input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. useEffect: synchronisation, not lifecycle"
            required
            autoFocus
            error={errors.title}
          />
        </Field>

        <Field label="Summary" hint="One line shown under the title" error={errors.summary}>
          <Input
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            maxLength={600}
            error={errors.summary}
          />
        </Field>

        <Field
          label="Video URL"
          hint="A YouTube link, or leave blank for a reading lesson"
          error={errors.videoUrl}
        >
          <Input
            value={form.videoUrl}
            onChange={(event) => setForm({ ...form, videoUrl: event.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
            error={errors.videoUrl}
          />
        </Field>

        <Field
          label="Lesson notes"
          hint="Written content shown under the player. Plain text with line breaks."
          error={errors.content}
        >
          <Textarea
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            rows={8}
            maxLength={40000}
            placeholder="Explain the idea, not just the steps."
            error={errors.content}
          />
        </Field>

        <Field label="Duration (minutes)" required error={errors.durationMinutes}>
          <Input
            type="number"
            min="0"
            max="1440"
            value={form.durationMinutes}
            onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
            required
            error={errors.durationMinutes}
            className="max-w-[10rem]"
          />
        </Field>

        <div className="space-y-4 rounded-xl border border-ink-600 bg-ink-800/50 p-4">
          <Toggle
            label="Published"
            description="Unpublished lessons are hidden from students and excluded from progress."
            checked={form.isPublished}
            onChange={(value) => setForm({ ...form, isPublished: value })}
          />
          <Toggle
            label="Free preview"
            description="Anyone can watch this lesson without enrolling."
            checked={form.isPreview}
            onChange={(value) => setForm({ ...form, isPreview: value })}
          />
        </div>
      </form>
    </Modal>
  );
}

/* ══ Resource modal ═════════════════════════════════════════════════════ */

function ResourceModal({ lesson, onClose, onChanged }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_RESOURCE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      setResources(await resourceApi.listByLesson(lesson._id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [lesson._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (event) => {
    event?.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await resourceApi.create(lesson._id, {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        url: form.type === 'text' ? '' : form.url.trim(),
        textContent: form.type === 'text' ? form.textContent : '',
        isDownloadable: form.isDownloadable,
      });
      toast.success('Resource added.');
      setForm(EMPTY_RESOURCE);
      await load();
      await onChanged();
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await resourceApi.upload(lesson._id, file, { title: form.title.trim() || file.name });
      toast.success('File uploaded and attached.');
      setForm(EMPTY_RESOURCE);
      await load();
      await onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const remove = async (resource) => {
    try {
      await resourceApi.remove(resource._id);
      toast.success('Resource removed.');
      await load();
      await onChanged();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Lesson resources"
      description={lesson.title}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Existing */}
        <div>
          <h4 className="mb-3 text-sm font-bold text-white">
            Attached resources {resources.length > 0 && `(${resources.length})`}
          </h4>

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : resources.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-xs text-slate-500">
              No resources attached yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {resources.map((resource) => (
                <li
                  key={resource._id}
                  className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-850/70 p-3"
                >
                  <Badge tone="violet">{resource.type}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{resource.title}</span>
                  <IconButton
                    icon={Trash2}
                    label="Remove resource"
                    onClick={() => remove(resource)}
                    className="hover:text-accent-rose"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add by URL / text */}
        <form onSubmit={add} className="space-y-4 border-t border-ink-700 pt-5">
          <h4 className="text-sm font-bold text-white">Add a resource</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" required error={errors.type}>
              <Select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                {RESOURCE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Title" required error={errors.title}>
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Official React docs"
                error={errors.title}
              />
            </Field>
          </div>

          {form.type === 'text' ? (
            <Field label="Text content" required error={errors.textContent}>
              <Textarea
                value={form.textContent}
                onChange={(event) => setForm({ ...form, textContent: event.target.value })}
                rows={5}
                maxLength={20000}
                placeholder="Notes, a cheat sheet, a checklist…"
                error={errors.textContent}
              />
            </Field>
          ) : (
            <Field label="URL" required error={errors.url}>
              <Input
                value={form.url}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
                placeholder="https://…"
                error={errors.url}
              />
            </Field>
          )}

          <Field label="Description" hint="Optional" error={errors.description}>
            <Input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              maxLength={600}
              error={errors.description}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button onClick={add} loading={saving} icon={Plus}>
              Add resource
            </Button>
            <Button
              variant="secondary"
              icon={Upload}
              loading={uploading}
              onClick={() => fileInput.current?.click()}
            >
              Or upload a file
            </Button>
            <input
              ref={fileInput}
              type="file"
              onChange={upload}
              className="sr-only"
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv"
            />
          </div>

          <p className="text-xs text-slate-500">
            Uploads are stored on the API server and served from /uploads. Videos, PDFs, documents and
            images are all supported.
          </p>
        </form>
      </div>
    </Modal>
  );
}

/* ══ Quiz modal ═════════════════════════════════════════════════════════ */

function QuizModal({ lesson, onClose, onChanged }) {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [question, setQuestion] = useState(EMPTY_QUESTION);
  const [questionErrors, setQuestionErrors] = useState({});
  const [addingQuestion, setAddingQuestion] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await quizApi.getByLesson(lesson._id);
      setQuiz(data.quiz);
      setQuestions(data.questions || []);
      setSettings({
        title: data.quiz.title,
        description: data.quiz.description || '',
        passingScore: data.quiz.passingScore,
        timeLimitMinutes: data.quiz.timeLimitMinutes,
        maxAttempts: data.quiz.maxAttempts,
        isRequiredForCompletion: data.quiz.isRequiredForCompletion,
        showAnswersAfterSubmit: data.quiz.showAnswersAfterSubmit,
        shuffleQuestions: data.quiz.shuffleQuestions,
        isPublished: data.quiz.isPublished,
      });
    } catch {
      // A 404 simply means this lesson has no quiz yet.
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [lesson._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const createQuiz = async () => {
    setCreating(true);
    try {
      await quizApi.createForLesson(lesson._id, {
        title: `${lesson.title} — quiz`,
        passingScore: 60,
        isRequiredForCompletion: false,
      });
      toast.success('Quiz created. Add questions next.');
      await load();
      await onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await quizApi.update(quiz._id, {
        ...settings,
        passingScore: Number(settings.passingScore) || 0,
        timeLimitMinutes: Number(settings.timeLimitMinutes) || 0,
        maxAttempts: Number(settings.maxAttempts) || 0,
      });
      toast.success('Quiz settings saved.');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const deleteQuiz = async () => {
    try {
      await quizApi.remove(quiz._id);
      toast.success('Quiz deleted.');
      await onChanged();
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addQuestion = async (event) => {
    event?.preventDefault();
    setQuestionErrors({});
    setAddingQuestion(true);
    try {
      await quizApi.addQuestion(quiz._id, {
        text: question.text.trim(),
        type: question.type,
        explanation: question.explanation.trim(),
        points: Number(question.points) || 1,
        options: question.options
          .filter((option) => option.text.trim())
          .map((option) => ({ text: option.text.trim(), isCorrect: option.isCorrect })),
      });
      toast.success('Question added.');
      setQuestion(EMPTY_QUESTION);
      await load();
    } catch (err) {
      setQuestionErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setAddingQuestion(false);
    }
  };

  const removeQuestion = async (item) => {
    try {
      await quizApi.removeQuestion(item._id);
      toast.success('Question removed.');
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const setOption = (index, patch) => {
    const options = question.options.map((option, i) => {
      if (i !== index) {
        // A single-answer question can only have one correct option.
        if (patch.isCorrect === true && question.type !== 'multiple') {
          return { ...option, isCorrect: false };
        }
        return option;
      }
      return { ...option, ...patch };
    });
    setQuestion({ ...question, options });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Lesson quiz"
      description={lesson.title}
      size="xl"
      footer={
        <>
          {quiz && (
            <Button variant="danger" icon={Trash2} onClick={deleteQuiz} className="sm:mr-auto">
              Delete quiz
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !quiz ? (
        <EmptyState
          icon={ListChecks}
          title="No quiz on this lesson"
          description="Create a quiz, then add multiple-choice questions. Answers are graded on the server, so scores cannot be tampered with from the browser."
          action={
            <Button icon={Plus} loading={creating} onClick={createQuiz}>
              Create a quiz
            </Button>
          }
        />
      ) : (
        <div className="space-y-7">
          {/* Settings */}
          <section>
            <h4 className="mb-4 text-sm font-bold text-white">Quiz settings</h4>

            <div className="space-y-4">
              <Field label="Quiz title" required>
                <Input
                  value={settings.title}
                  onChange={(event) => setSettings({ ...settings, title: event.target.value })}
                />
              </Field>

              <Field label="Description" hint="Optional">
                <Input
                  value={settings.description}
                  onChange={(event) => setSettings({ ...settings, description: event.target.value })}
                  maxLength={800}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Pass mark (%)" required>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.passingScore}
                    onChange={(event) => setSettings({ ...settings, passingScore: event.target.value })}
                  />
                </Field>
                <Field label="Time limit (min)" hint="0 = untimed">
                  <Input
                    type="number"
                    min="0"
                    max="600"
                    value={settings.timeLimitMinutes}
                    onChange={(event) =>
                      setSettings({ ...settings, timeLimitMinutes: event.target.value })
                    }
                  />
                </Field>
                <Field label="Max attempts" hint="0 = unlimited">
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.maxAttempts}
                    onChange={(event) => setSettings({ ...settings, maxAttempts: event.target.value })}
                  />
                </Field>
              </div>

              <div className="space-y-4 rounded-xl border border-ink-600 bg-ink-800/50 p-4">
                <Toggle
                  label="Required to complete the lesson"
                  description="Students must pass this quiz before the lesson counts toward course progress."
                  checked={settings.isRequiredForCompletion}
                  onChange={(value) => setSettings({ ...settings, isRequiredForCompletion: value })}
                />
                <Toggle
                  label="Show correct answers after submitting"
                  description="Students see which options were right, plus your explanations."
                  checked={settings.showAnswersAfterSubmit}
                  onChange={(value) => setSettings({ ...settings, showAnswersAfterSubmit: value })}
                />
                <Toggle
                  label="Shuffle question order"
                  checked={settings.shuffleQuestions}
                  onChange={(value) => setSettings({ ...settings, shuffleQuestions: value })}
                />
                <Toggle
                  label="Published"
                  description="Unpublished quizzes are hidden from students."
                  checked={settings.isPublished}
                  onChange={(value) => setSettings({ ...settings, isPublished: value })}
                />
              </div>

              <Button icon={Save} loading={savingSettings} onClick={saveSettings}>
                Save settings
              </Button>
            </div>
          </section>

          {/* Existing questions */}
          <section className="border-t border-ink-700 pt-6">
            <h4 className="mb-4 text-sm font-bold text-white">
              Questions ({questions.length}) · {quiz.totalPoints} points total
            </h4>

            {questions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-xs text-slate-500">
                No questions yet. Add the first one below.
              </p>
            ) : (
              <ol className="space-y-3">
                {questions.map((item, itemIndex) => (
                  <li key={item._id} className="rounded-xl border border-ink-700 bg-ink-850/70 p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-violet-500/15 text-2xs font-bold text-violet-300">
                        {itemIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{item.text}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-2xs text-slate-500">
                          <Badge tone="slate">{item.type}</Badge>
                          <span>
                            {item.points} point{item.points === 1 ? '' : 's'}
                          </span>
                        </div>

                        <ul className="mt-2.5 space-y-1">
                          {item.options.map((option) => (
                            <li
                              key={option._id}
                              className={clsx(
                                'flex items-center gap-2 text-xs',
                                option.isCorrect ? 'font-semibold text-accent-emerald' : 'text-slate-400'
                              )}
                            >
                              <span
                                className={clsx(
                                  'h-1.5 w-1.5 shrink-0 rounded-full',
                                  option.isCorrect ? 'bg-accent-emerald' : 'bg-ink-500'
                                )}
                              />
                              {option.text}
                            </li>
                          ))}
                        </ul>

                        {item.explanation && (
                          <p className="mt-2 border-l-2 border-violet-500 pl-2.5 text-2xs leading-relaxed text-slate-500">
                            {item.explanation}
                          </p>
                        )}
                      </div>

                      <IconButton
                        icon={Trash2}
                        label="Delete question"
                        onClick={() => removeQuestion(item)}
                        className="shrink-0 hover:text-accent-rose"
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Add a question */}
          <form onSubmit={addQuestion} className="space-y-4 border-t border-ink-700 pt-6">
            <h4 className="text-sm font-bold text-white">Add a question</h4>

            <Field label="Question" required error={questionErrors.text}>
              <Textarea
                value={question.text}
                onChange={(event) => setQuestion({ ...question, text: event.target.value })}
                rows={2}
                maxLength={1200}
                placeholder="What do you want to check the student understands?"
                error={questionErrors.text}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Answer type">
                <Select
                  value={question.type}
                  onChange={(event) => {
                    const type = event.target.value;
                    // Collapse to one correct option when leaving multi-answer.
                    const options =
                      type === 'multiple'
                        ? question.options
                        : question.options.map((option, index) => ({
                            ...option,
                            isCorrect: index === question.options.findIndex((o) => o.isCorrect),
                          }));
                    setQuestion({ ...question, type, options });
                  }}
                >
                  <option value="single">Single answer</option>
                  <option value="multiple">Multiple answers</option>
                  <option value="boolean">True / false</option>
                </Select>
              </Field>

              <Field label="Points">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={question.points}
                  onChange={(event) => setQuestion({ ...question, points: event.target.value })}
                />
              </Field>
            </div>

            <Field
              label="Answer options"
              required
              hint={
                question.type === 'multiple'
                  ? 'Tick every correct option'
                  : 'Tick exactly one correct option'
              }
              error={questionErrors.options}
            >
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                      name="correct-option"
                      checked={option.isCorrect}
                      onChange={(event) => setOption(index, { isCorrect: event.target.checked })}
                      aria-label={`Option ${index + 1} is correct`}
                      className="checkbox"
                    />
                    <Input
                      value={option.text}
                      onChange={(event) => setOption(index, { text: event.target.value })}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      maxLength={500}
                    />
                    <IconButton
                      icon={Trash2}
                      label="Remove option"
                      disabled={question.options.length <= 2}
                      onClick={() =>
                        setQuestion({
                          ...question,
                          options: question.options.filter((_, i) => i !== index),
                        })
                      }
                      className="hover:text-accent-rose"
                    />
                  </div>
                ))}
              </div>

              {question.options.length < 8 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Plus}
                  className="mt-2"
                  onClick={() =>
                    setQuestion({
                      ...question,
                      options: [...question.options, { text: '', isCorrect: false }],
                    })
                  }
                >
                  Add option
                </Button>
              )}
            </Field>

            <Field
              label="Explanation"
              hint="Shown after submission — this is where the teaching happens"
              error={questionErrors.explanation}
            >
              <Textarea
                value={question.explanation}
                onChange={(event) => setQuestion({ ...question, explanation: event.target.value })}
                rows={2}
                maxLength={1200}
                error={questionErrors.explanation}
              />
            </Field>

            <Button onClick={addQuestion} loading={addingQuestion} icon={Plus}>
              Add question
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
}

/* ══ Announcement modal ═════════════════════════════════════════════════ */

function AnnounceModal({ course, onClose }) {
  const [form, setForm] = useState({ title: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const send = async (event) => {
    event?.preventDefault();
    setErrors({});
    setSending(true);
    try {
      const result = await courseApi.announce(course._id, {
        title: form.title.trim(),
        message: form.message.trim(),
      });
      toast.success(`Sent to ${result.notified} student${result.notified === 1 ? '' : 's'}.`);
      onClose();
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors) toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Announce to enrolled students"
      description={`${course.enrollmentCount} student${course.enrollmentCount === 1 ? '' : 's'} will receive a notification.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} loading={sending} icon={Megaphone}>
            Send announcement
          </Button>
        </>
      }
    >
      <form onSubmit={send} className="space-y-4">
        <Field label="Headline" required error={errors.title}>
          <Input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. New module on testing added"
            maxLength={140}
            required
            autoFocus
            error={errors.title}
          />
        </Field>

        <Field label="Message" required hint={`${form.message.length}/600`} error={errors.message}>
          <Textarea
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            rows={5}
            maxLength={600}
            placeholder="What has changed, and what should students do about it?"
            required
            error={errors.message}
          />
        </Field>
      </form>
    </Modal>
  );
}
