import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Send, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import EventCard from "../../components/events/EventCard";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { buttonClass } from "../../components/ui/buttonStyles";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";
import FullPageLoader from "../../components/ui/FullPageLoader";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";
import { toast } from "../../services/toast";
import { unwrap } from "../../services/unwrap";
import type { EventItem } from "../../types/event";
import { formatCategoryName } from "../../utils/categoryLabel";
import { GRADE_OPTIONS } from "../../utils/grades";

interface Category {
  id: string;
  name: string;
}

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient font-display text-lg font-extrabold text-white shadow-glow tabular-nums">
          {step}
        </span>
        <div>
          <h2 className="text-lg leading-tight font-bold text-ink-900">{title}</h2>
          <p className="text-[13px] text-ink-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function todayValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export default function CreateEvent() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minGrade, setMinGrade] = useState("");
  const [maxGrade, setMaxGrade] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void Promise.allSettled([api.get("/events/active/me"), api.get("/event-categories")]).then(
      ([activeResult, categoryResult]) => {
        if (cancelled) return;

        const active = activeResult.status === "fulfilled" ? unwrap<EventItem>(activeResult.value) : null;
        if (active?.id) {
          toast.error(t("Student_AlreadyHasPending"));
          navigate("/student/events", { replace: true });
          return;
        }

        if (categoryResult.status === "fulfilled") {
          const raw = unwrap<Category[] | { items?: Category[] }>(categoryResult.value);
          const list = Array.isArray(raw) ? raw : raw?.items;
          setCategories(Array.isArray(list) ? list : []);
        }
        setChecking(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [navigate, t]);

  const imagePreview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const localDate = eventDate && eventTime ? `${eventDate}T${eventTime}` : "";
  const categoryName = categories.find((category) => category.id === categoryId)?.name;

  const preview: EventItem = {
    id: "preview",
    title: title.trim() || t("Student_PlaceholderTitle"),
    location: location.trim(),
    eventDate: localDate || eventDate || todayValue(),
    status: 2,
    categoryName,
    imageUrl: imagePreview,
    isCreator: true,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (title.trim().length < 3) {
      setError(t("UI_EventTitleLength"));
      return;
    }
    if (!categoryId) {
      setError(t("Student_SelectCategoryError"));
      return;
    }
    if (!localDate || new Date(localDate).getTime() <= Date.now()) {
      setError(t("UI_EventDateFuture"));
      return;
    }
    if (minGrade && maxGrade && Number(minGrade) > Number(maxGrade)) {
      setError(t("Student_GradeRangeError"));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("Title", title);
      formData.append("Description", description);
      formData.append("EventDate", new Date(localDate).toISOString());
      formData.append("Location", location);
      formData.append("CategoryId", categoryId);
      if (minGrade) formData.append("MinGrade", minGrade);
      if (maxGrade) formData.append("MaxGrade", maxGrade);
      if (imageFile) formData.append("ImageFile", imageFile);

      await api.post("/events", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(t("Student_CreateSuccess"));
      navigate("/student/events");
    } catch (err) {
      setError(getErrorMessage(err) || t("Student_CreateError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) return <FullPageLoader />;

  const gradeOptions = GRADE_OPTIONS.map((option) => (
    <option key={option.value} value={option.value}>
      {t(option.labelKey)}
    </option>
  ));

  return (
    <>
      <Link
        to="/student/events"
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-ink-600 transition-colors hover:text-ink-900"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t("UI_MyEvents")}
      </Link>
      <header className="mb-6">
        <h1 className="text-[30px] leading-tight font-extrabold text-ink-900 sm:text-[38px]">{t("Student_ModalTitleCreate")}</h1>
        <p className="mt-3 text-[15px] text-ink-600">{t("Student_NewEventDescription")}</p>
      </header>

      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <FormSection step={1} title={t("Student_BasicInfo")} description={t("Student_BasicInfoDescription")}>
            <Field label={t("Student_FieldTitle")} required counter={{ value: title.length, max: 100 }}>
              <Input
                required
                minLength={3}
                maxLength={100}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("Student_PlaceholderTitle")}
              />
            </Field>
            <Field label={t("Student_FieldDesc")} required>
              <Textarea
                required
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("Student_PlaceholderDesc")}
              />
            </Field>
            <Field label={t("Student_FieldCategory")} required>
              <Select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">{t("Student_SelectCategory")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {formatCategoryName(category.name, t)}
                  </option>
                ))}
              </Select>
            </Field>
          </FormSection>

          <FormSection step={2} title={t("Student_TimeAndLocation")} description={t("Student_TimeAndLocationDescription")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Student_Date")} required>
                <Input
                  type="date"
                  required
                  min={todayValue()}
                  lang={i18n.language}
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </Field>
              <Field label={t("Student_Time")} required>
                <Input type="time" required value={eventTime} onChange={(event) => setEventTime(event.target.value)} />
              </Field>
            </div>
            <Field label={t("Student_FieldLocation")} required>
              <Input
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder={t("Student_LocationPlaceholder")}
              />
            </Field>
          </FormSection>

          <FormSection step={3} title={t("Student_AttendanceDetails")} description={t("Student_AttendanceDetailsDescription")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Student_MinimumGrade")}>
                <Select value={minGrade} onChange={(event) => setMinGrade(event.target.value)}>
                  <option value="">{t("Student_NoRestriction")}</option>
                  {gradeOptions}
                </Select>
              </Field>
              <Field label={t("Student_MaximumGrade")}>
                <Select value={maxGrade} onChange={(event) => setMaxGrade(event.target.value)}>
                  <option value="">{t("Student_NoRestriction")}</option>
                  {gradeOptions}
                </Select>
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-ink-700">
                {t("Student_FieldImage")} <span className="font-normal text-ink-500">({t("Student_Optional")})</span>
              </p>
              {imageFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 p-2.5">
                  {imagePreview && <img src={imagePreview} alt="" className="size-12 rounded-lg object-cover" />}
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{imageFile.name}</span>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => setImageFile(null)}
                    aria-label={t("UI_RemoveImage")}
                    title={t("UI_RemoveImage")}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-ink-300 bg-ink-50/60 px-4 py-7 text-center transition-colors focus-within:border-brand-500 hover:border-brand-400 hover:bg-brand-50/50">
                  <ImagePlus size={22} className="text-ink-500" aria-hidden="true" />
                  <span className="text-sm font-semibold text-brand-700">{t("Student_ChooseFile")}</span>
                  <span className="text-xs text-ink-500">{t("UI_ImageHint")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          </FormSection>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24">
          <div className="hidden lg:block">
            <p className="mb-2.5 text-[13px] font-semibold text-ink-500">{t("UI_Preview")}</p>
            <div className="pointer-events-none" aria-hidden="true" inert>
              <EventCard event={preview} onViewDetail={() => undefined} />
            </div>
          </div>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            {!submitting && <Send size={17} aria-hidden="true" />}
            {submitting ? t("Student_Creating") : t("Student_PublishEvent")}
          </Button>
          <Link to="/student/events" className={buttonClass("ghost", "md", "w-full")}>
            {t("Student_CancelBtn")}
          </Link>
          <p className="text-center text-xs leading-relaxed text-ink-500">{t("UI_ApprovalNotice")}</p>
        </aside>
      </form>
    </>
  );
}
