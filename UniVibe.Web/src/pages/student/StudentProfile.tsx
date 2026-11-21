import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  AtSign,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarPlus,
  Camera,
  ChevronRight,
  GraduationCap,
  Link2,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import CancelEventModal from "../../components/events/CancelEventModal";
import EventCard from "../../components/events/EventCard";
import EventCardSkeleton from "../../components/events/EventCardSkeleton";
import EventChatModal from "../../components/events/EventChatModal";
import EventDetailModal from "../../components/events/EventDetailModal";
import FeedbackModal from "../../components/FeedbackModal";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import FullPageLoader from "../../components/ui/FullPageLoader";
import Modal from "../../components/ui/Modal";
import Segmented from "../../components/ui/Segmented";
import VibeWave from "../../components/ui/VibeWave";
import { useEventDialogs } from "../../hooks/useEventDialogs";
import { api } from "../../services/api";
import { currentUser } from "../../services/currentUser";
import { getErrorMessage } from "../../services/errorMessage";
import { toast } from "../../services/toast";
import { tokenService } from "../../services/tokenService";
import { unwrap } from "../../services/unwrap";
import type { EventItem } from "../../types/event";
import { gradeLabelKey } from "../../utils/grades";
import ChangePasswordModal from "./profile/ChangePasswordModal";
import DeleteAccountModal from "./profile/DeleteAccountModal";
import EditProfileModal from "./profile/EditProfileModal";
import { normalizeProfile } from "./profile/profileTypes";
import type { UserProfile } from "./profile/profileTypes";

type ActiveModal = "edit" | "password" | "feedback" | "logout" | "delete" | "photo" | null;

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-ink-400" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-ink-500">{label}</dt>
        <dd className="mt-0.5 text-[13px] font-medium break-words text-ink-800">{children}</dd>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm font-medium transition-colors ${
        danger ? "text-coral-700 hover:bg-coral-50" : "text-ink-800 hover:bg-ink-50"
      }`}
    >
      <span className={danger ? "text-coral-600" : "text-ink-500"} aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={16} className="text-ink-400" aria-hidden="true" />
    </button>
  );
}

function isSafeLink(value?: string): boolean {
  return /^https?:\/\//i.test(value ?? "");
}

export default function StudentProfile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([]);
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"joined" | "created">("joined");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = unwrap<Record<string, unknown>>(await api.get("/users/profile/me"));
      if (data) setProfile(normalizeProfile(data));
    } catch (error) {
      console.error("Profil bilgileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfileEvents = useCallback(async () => {
    try {
      const [joinedResponse, createdResponse] = await Promise.all([
        api.get("/events/joined/me"),
        api.get("/events/active/me"),
      ]);
      const joined = unwrap<EventItem[]>(joinedResponse);
      const created = unwrap<EventItem>(createdResponse);
      setJoinedEvents(Array.isArray(joined) ? joined : []);
      setCreatedEvent(created?.id ? created : null);
    } catch (error) {
      console.error("Profil etkinlikleri alınamadı:", error);
      setJoinedEvents([]);
      setCreatedEvent(null);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
    void fetchProfileEvents();
  }, [fetchProfile, fetchProfileEvents]);

  const { openDetail, openComments, detailProps, chatProps } = useEventDialogs({
    onChanged: fetchProfileEvents,
    closeDetailOnLeave: true,
  });

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const response = (await api.post("/users/profile/picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })) as unknown;
      const url = typeof response === "string" ? response : (response as { data?: string }).data;
      const profilePictureUrl = `${url}?t=${Date.now()}`;
      setProfile((current) => (current ? { ...current, profilePictureUrl } : current));
      currentUser.patch({ profilePictureUrl });
      toast.success(t("UI_PhotoUpdated"));
    } catch (error) {
      toast.error(getErrorMessage(error) || t("Student_PhotoUploadError"));
    } finally {
      setUploading(false);
    }
  };

  const confirmLogout = () => {
    setActiveModal(null);
    toast.success(t("Auth_LogoutSuccess"));
    window.setTimeout(() => {
      tokenService.clearTokens();
      window.location.href = "/";
    }, 800);
  };

  if (loading) return <FullPageLoader label={t("Admin_LoadingDetails")} />;

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const titlePrefix = profile?.title?.trim() ?? "";
  const displayName = titlePrefix ? `${titlePrefix} ${fullName}`.trim() : fullName;
  const gradeKey = gradeLabelKey(profile?.grade);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24">
        <section className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70">
          <div className="relative h-28 overflow-hidden bg-brand-gradient" aria-hidden="true">
            <VibeWave className="absolute inset-0 h-full w-full opacity-70" />
          </div>
          <div className="px-5 pb-5">
            <div className="relative -mt-11 mb-3 w-fit">
              <button
                type="button"
                disabled={!profile?.profilePictureUrl}
                onClick={() => setActiveModal("photo")}
                aria-label={t("Student_ViewProfilePhoto")}
                className="block rounded-full ring-4 ring-white"
              >
                {uploading ? (
                  <span className="grid size-20 place-items-center rounded-full bg-ink-100">
                    <LoaderCircle size={24} className="animate-spin text-brand-600" aria-hidden="true" />
                  </span>
                ) : (
                  <Avatar name={displayName} src={profile?.profilePictureUrl} className="size-20 text-xl" />
                )}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                aria-label={t("Student_ChangeProfilePhoto")}
                title={t("Student_ChangeProfilePhoto")}
                className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full border-2 border-white bg-brand-600 text-white transition-colors hover:bg-brand-700"
              >
                <Camera size={14} />
              </button>
            </div>

            <h1 className="text-[26px] leading-tight font-extrabold text-ink-900">{displayName}</h1>
            <p className="mt-0.5 text-sm text-ink-500">@{profile?.username}</p>
            <p className="mt-3 text-sm leading-relaxed break-words text-ink-600">{profile?.bio || t("Student_NoBio")}</p>
            <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => setActiveModal("edit")}>
              <Pencil size={14} aria-hidden="true" />
              {t("Student_EditProfile")}
            </Button>
          </div>

          <dl className="divide-y divide-ink-100 border-t border-ink-100 px-5 py-1">
            {profile?.universityName && (
              <InfoRow icon={<Building2 size={16} />} label={t("Student_University")}>
                {profile.universityName}
              </InfoRow>
            )}
            {profile?.facultyName && (
              <InfoRow icon={<BookOpen size={16} />} label={t("Student_Faculty")}>
                {profile.facultyName}
              </InfoRow>
            )}
            {profile?.departmentName && (
              <InfoRow icon={<GraduationCap size={16} />} label={t("Student_Department")}>
                {profile.departmentName}
                {gradeKey ? ` · ${t(gradeKey)}` : ""}
              </InfoRow>
            )}
            <InfoRow icon={<Mail size={16} />} label={t("Student_Email")}>
              {profile?.email || "-"}
            </InfoRow>
            {profile?.phoneNumber && (
              <InfoRow icon={<Phone size={16} />} label={t("Student_Phone")}>
                {profile.phoneNumber}
              </InfoRow>
            )}
            {profile?.socialMediaLink && (
              <InfoRow
                icon={isSafeLink(profile.socialMediaLink) ? <Link2 size={16} /> : <AtSign size={16} />}
                label={t("Student_SocialMedia")}
              >
                {isSafeLink(profile.socialMediaLink) ? (
                  <a
                    href={profile.socialMediaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 underline-offset-2 hover:underline"
                  >
                    {profile.socialMediaLink.replace(/^https?:\/\//i, "")}
                  </a>
                ) : (
                  profile.socialMediaLink
                )}
              </InfoRow>
            )}
          </dl>
        </section>
      </aside>

      <div className="min-w-0 space-y-6">
        <section aria-label={t("UI_MyEvents")}>
          <Segmented
            ariaLabel={t("UI_MyEvents")}
            value={activeTab}
            onChange={setActiveTab}
            className="mb-3"
            options={[
              { value: "joined", label: t("Student_JoinedEvents"), count: joinedEvents.length },
              { value: "created", label: t("Student_CreatedEvents"), count: createdEvent ? 1 : 0 },
            ]}
          />

          {eventsLoading ? (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              <div className="w-60 shrink-0">
                <EventCardSkeleton />
              </div>
              <div className="w-60 shrink-0">
                <EventCardSkeleton />
              </div>
            </div>
          ) : activeTab === "joined" ? (
            joinedEvents.length > 0 ? (
              <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory">
                {joinedEvents.map((event) => (
                  <div key={event.id} className="w-60 shrink-0 snap-start">
                    <EventCard
                      compact
                      event={{ ...event, isJoined: true }}
                      onViewDetail={() => void openDetail(event, { isJoined: true })}
                      onOpenComments={() => void openComments(event, { isJoined: true })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<CalendarCheck size={22} />} title={t("Student_NoJoinedEvents")} />
            )
          ) : createdEvent ? (
            <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory">
              <div className="w-60 shrink-0 snap-start">
                <EventCard
                  compact
                  event={{ ...createdEvent, isCreator: true }}
                  onViewDetail={() => void openDetail(createdEvent, { isCreator: true })}
                  onOpenComments={() => void openComments(createdEvent, { isCreator: true })}
                />
              </div>
            </div>
          ) : (
            <EmptyState icon={<CalendarPlus size={22} />} title={t("Student_NoCreatedEvents")} />
          )}
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70">
          <h2 className="border-b border-ink-100 px-5 py-4 text-lg leading-tight font-bold text-ink-900">
            {t("Student_AccountSettings")}
          </h2>
          <div className="divide-y divide-ink-100">
            <SettingRow
              icon={<LockKeyhole size={18} />}
              label={t("Student_ChangePassword")}
              onClick={() => setActiveModal("password")}
            />
            <SettingRow
              icon={<MessageSquare size={18} />}
              label={t("Student_FeedbackButton")}
              onClick={() => setActiveModal("feedback")}
            />
            <SettingRow icon={<LogOut size={18} />} label={t("Auth_Logout")} onClick={() => setActiveModal("logout")} />
            <SettingRow
              danger
              icon={<Trash2 size={18} />}
              label={t("Student_DeleteAccount")}
              onClick={() => setActiveModal("delete")}
            />
          </div>
        </section>
      </div>

      {activeModal === "edit" && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setActiveModal(null)}
          onSaved={() => {
            setActiveModal(null);
            void fetchProfile();
            void currentUser.load();
          }}
        />
      )}
      {activeModal === "password" && <ChangePasswordModal onClose={() => setActiveModal(null)} />}
      {activeModal === "delete" && profile && (
        <DeleteAccountModal profile={profile} onClose={() => setActiveModal(null)} />
      )}
      <FeedbackModal open={activeModal === "feedback"} onClose={() => setActiveModal(null)} />
      <ConfirmDialog
        open={activeModal === "logout"}
        title={t("Auth_LogoutConfirmTitle")}
        message={t("Auth_LogoutConfirmMessage")}
        icon={<LogOut size={19} />}
        confirmLabel={t("Auth_Yes")}
        onClose={() => setActiveModal(null)}
        onConfirm={confirmLogout}
      />
      <Modal
        open={activeModal === "photo" && Boolean(profile?.profilePictureUrl)}
        onClose={() => setActiveModal(null)}
        bare
        size="lg"
        ariaLabel={t("Student_ViewProfilePhoto")}
      >
        <img src={profile?.profilePictureUrl} alt={displayName} className="max-h-[80dvh] w-full object-contain" />
      </Modal>

      <EventDetailModal {...detailProps} onCancelEvent={(eventId) => setCancelId(eventId)} />
      <EventChatModal {...chatProps} />
      <CancelEventModal
        eventId={cancelId}
        onClose={() => setCancelId(null)}
        onCancelled={() => {
          setCancelId(null);
          void fetchProfileEvents();
        }}
      />
    </div>
  );
}