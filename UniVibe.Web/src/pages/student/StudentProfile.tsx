import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent, ChangeEvent } from "react";
import {
  User,
  Edit3,
  LogOut,
  Trash2,
  Camera,
  X,
  GraduationCap,
  AlertTriangle,
  Loader2,
  CheckCircle,
  LockKeyhole,
  MessageSquare,
  Send,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import EventCard from "../../components/EventCard";
import EventCommentsChat from "../../components/EventCommentsChat";
import { getErrorMessage } from "../../services/errorMessage";
import PasswordInput from "../../components/PasswordInput";
import { isEventInFuture } from "../../utils/eventFilter";
import { formatCategoryName } from "../../utils/categoryLabel";

function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || "tr").toLowerCase();
  const isEn = currentLang.startsWith("en");
  const isTr = !isEn;

  return (
    <div className="absolute top-5 right-5 flex bg-white/90 backdrop-blur-md rounded-2xl p-1.5 border border-purple-100 z-20 shadow-md">
      <button
        type="button"
        onClick={() => i18n.changeLanguage("tr")}
        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
          isTr
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        TR
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage("en")}
        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
          isEn
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        EN
      </button>
    </div>
  );
}

interface UserProfile {
  id?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  socialMediaLink?: string;
  university?: string;
  universityName?: string;
  universityId?: string;
  faculty?: string;
  facultyName?: string;
  facultyId?: string;
  department?: string;
  departmentName?: string;
  departmentId?: string;
  profilePictureUrl?: string;
  role?: string | number;
  title?: string;
  grade?: number;
}

function extractStringField(obj: any, keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
    if (val && typeof val === "object") {
      const nested = val.name || val.Name || val.title || val.Title;
      if (typeof nested === "string" && nested.trim().length > 0) {
        return nested.trim();
      }
    }
  }
  return "";
}

const isGuid = (val?: string | null): boolean =>
  typeof val === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

function resolveLookupNames(
  _profileData: any,
  currentDept?: string,
  currentUniv?: string,
  currentFac?: string
): { deptName: string; univName: string; facName: string } {
  return {
    deptName: currentDept && !isGuid(currentDept) ? currentDept : "",
    univName: currentUniv && !isGuid(currentUniv) ? currentUniv : "",
    facName: currentFac && !isGuid(currentFac) ? currentFac : "",
  };
}

interface ProfileEvent {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  creatorName?: string;
  organizerName?: string;
  creatorId?: string;
  userId?: string;
  eventDate: string;
  status: string | number;
  categoryName?: string;
  isJoined?: boolean;
  isCreator?: boolean;
  cancellationReason?: string;
  rejectionReason?: string;
}

export default function StudentProfile() {
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isPhotoViewerOpen, setPhotoViewerOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Hesap silme modalı state'leri
  const [isDeleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Çıkış yapma onay modalı için state
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

  // Geri bildirim modalı state'leri
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    subject: "",
    message: "",
  });
  const [feedbackError, setFeedbackError] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    socialMediaLink: "",
  });

  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [joinedEvents, setJoinedEvents] = useState<ProfileEvent[]>([]);
  const [createdEvent, setCreatedEvent] = useState<ProfileEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"joined" | "created">("joined");

  // Detail Modal states
  const [selectedEventDetail, setSelectedEventDetail] = useState<ProfileEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isLeavingEvent, setIsLeavingEvent] = useState(false);

  // Comments Modal states
  const [selectedCommentsEvent, setSelectedCommentsEvent] = useState<ProfileEvent | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const handleOpenDetail = async (eventItem: ProfileEvent) => {
    setDetailLoading(true);
    setSelectedEventDetail(eventItem);
    setIsDetailModalOpen(true);
    try {
      const response: any = await api.get(`/events/${eventItem.id}`);
      const fetchedData = response?.data?.data || response?.data || response;
      if (fetchedData && fetchedData.id) {
        setSelectedEventDetail({
          ...fetchedData,
          isJoined: eventItem.isJoined !== undefined ? eventItem.isJoined : fetchedData.isJoined,
          isCreator: eventItem.isCreator !== undefined ? eventItem.isCreator : fetchedData.isCreator,
        });
      }
    } catch (error) {
      console.error("Detay yüklenemedi:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenComments = async (eventItem: ProfileEvent) => {
    setSelectedCommentsEvent(eventItem);
    setIsCommentsModalOpen(true);
    try {
      const response: any = await api.get(`/events/${eventItem.id}`);
      const fetchedData = response?.data?.data || response?.data || response;
      if (fetchedData && fetchedData.id) {
        setSelectedCommentsEvent({
          ...fetchedData,
          isJoined: fetchedData.isJoined !== undefined ? fetchedData.isJoined : eventItem.isJoined,
          isCreator: fetchedData.isCreator !== undefined ? fetchedData.isCreator : eventItem.isCreator,
        });
      }
    } catch (error) {
      console.error("Yorum modalı için etkinlik bilgisi yüklenemedi:", error);
    }
  };

  const fetchProfileEvents = useCallback(async () => {
    try {
      const [joinedResponse, createdResponse] = await Promise.all([
        api.get("/events/joined/me"),
        api.get("/events/active/me"),
      ]);
      const joinedData: any = joinedResponse.data || joinedResponse;
      const createdData: any = createdResponse.data || createdResponse;
      const joined = joinedData?.data || joinedData;
      const created = createdData?.data || createdData;
      setJoinedEvents(Array.isArray(joined) ? joined : []);
      setCreatedEvent(created?.id ? created : null);
    } catch (error) {
      console.error("Profil etkinlikleri alınamadı:", error);
      setJoinedEvents([]);
      setCreatedEvent(null);
    }
  }, []);

  const handleLeaveEvent = async (eventId: string) => {
    setIsLeavingEvent(true);
    try {
      await api.delete(`/events/${eventId}/attendees/me`);
      showNotification(
        "success",
        t("Student_LeaveSuccess") || "Etkinlikten başarıyla ayrıldınız."
      );
      setJoinedEvents((prev) => prev.filter((e) => e.id !== eventId));
      setIsDetailModalOpen(false);
      setSelectedEventDetail(null);
      setSelectedCommentsEvent((prev) => (prev && prev.id === eventId ? { ...prev, isJoined: false } : prev));
      await fetchProfileEvents();
    } catch (err: any) {
      showNotification(
        "error",
        getErrorMessage(err) || t("Student_LeaveError") || "Etkinlikten ayrılırken bir sorun oluştu."
      );
    } finally {
      setIsLeavingEvent(false);
    }
  };

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const fetchProfile = async () => {
    try {
      const response: any = await api.get("/users/profile/me");
      let data = response?.data ? response.data : response;
      if (data?.data) {
        data = data.data;
      }

      if (data) {
        const rawDept = extractStringField(data, [
          "departmentName",
          "department",
          "DepartmentName",
          "Department",
        ]);
        const rawUniv = extractStringField(data, [
          "universityName",
          "university",
          "UniversityName",
          "University",
        ]);
        const rawFac = extractStringField(data, [
          "facultyName",
          "faculty",
          "FacultyName",
          "Faculty",
        ]);

        const resolved = resolveLookupNames(data, rawDept, rawUniv, rawFac);

        const normalized: UserProfile = {
          ...data,
          department: resolved.deptName,
          departmentName: resolved.deptName,
          university: resolved.univName,
          universityName: resolved.univName,
          faculty: resolved.facName,
          facultyName: resolved.facName,
        };

        setProfile(normalized);
        setEditForm({
          username: data.username || "",
          bio: data.bio || "",
          socialMediaLink: data.socialMediaLink || "",
        });
      }
    } catch (error) {
      console.error("Profil bilgileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchProfileEvents();
  }, [fetchProfileEvents]);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const response: any = await api.post(
        "/users/profile-picture",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const newPhotoUrl =
        (typeof response === "string" ? response : response.data) +
        "?t=" +
        new Date().getTime();
      setProfile((prev: any) => ({
        ...prev,
        profilePictureUrl: newPhotoUrl,
      }));
      showNotification(
        "success",
        t("Res_ProfilePictureUpdated") ||
          "Profil fotoğrafınız başarıyla değiştirildi.",
      );
    } catch (error) {
      console.error("Fotoğraf yükleme hatası:", error);
      showNotification(
        "error",
        getErrorMessage(error) || t("Student_PhotoUploadError") || "Fotoğraf sunucuya gönderilemedi.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError("");

    try {
      await api.put("/users/profile", {
        username: editForm.username,
        bio: editForm.bio,
        socialMediaLink: editForm.socialMediaLink,
      });

      showNotification(
        "success",
        t("Res_ProfileUpdated") || "Profil bilgileriniz güncellenmiştir."
      );
      setEditModalOpen(false);
      fetchProfile();
    } catch (error: any) {
      setUpdateError(getErrorMessage(error) || t("Student_UpdateError"));
    } finally {
      setIsUpdating(false);
    }
  };

  // Çıkış Onaylandığında Çalışacak Fonksiyon
  const confirmLogout = () => {
    setLogoutModalOpen(false);
    showNotification(
      "success",
      t("Auth_LogoutSuccess")
    );
    
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "/";
    }, 1000);
  };

  const handleDeleteAccount = () => {
    setDeletePassword("");
    setDeleteError("");
    setDeleteAccountModalOpen(true);
  };

  const handleConfirmDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!deletePassword.trim()) {
      setDeleteError(t("Val_PasswordRequired") || "Lütfen şifrenizi girin.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError("");

    try {
      // Backend şifre doğrulaması: Kullanıcının e-posta veya kullanıcı adı ile şifresi kontrol edilir
      const userIdentifier = profile?.email || profile?.username;
      if (userIdentifier) {
        try {
          await api.post("/Auth/login", {
            email: userIdentifier,
            password: deletePassword,
          });
        } catch {
          setDeleteError(
            t("Auth_InvalidPassword") || "Girdiğiniz şifre hatalı. Lütfen kontrol edip tekrar deneyin."
          );
          setIsDeletingAccount(false);
          return;
        }
      }

      // Backend hesap silme endpoint'i
      await api.delete("/users/account");

      setDeleteAccountModalOpen(false);
      showNotification(
        "success",
        t("Auth_DeleteAccountSuccess") || "Hesabınız başarıyla silindi (pasife alındı)."
      );

      setTimeout(() => {
        localStorage.clear();
        window.location.href = "/";
      }, 1200);
    } catch (error: any) {
      setDeleteError(
        getErrorMessage(error) ||
          t("Student_DeleteAccountError") ||
          "Hesap silinirken bir sorun oluştu."
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    const newPass = passwordForm.newPassword ?? "";
    const confirmPass = passwordForm.confirmPassword ?? "";
    const currentPass = passwordForm.currentPassword ?? "";

    if (newPass.length < 6) {
      setPasswordError(t("Student_PasswordMinLength") || "Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (newPass !== confirmPass) {
      setPasswordError(t("Reset_PasswordMismatch") || "Yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");
    try {
      await api.post("/users/password/change", {
        currentPassword: currentPass,
        newPassword: newPass,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordModalOpen(false);
      showNotification("success", t("Student_PasswordChanged") || "Şifreniz başarıyla değiştirildi.");
    } catch (error: any) {
      setPasswordError(getErrorMessage(error) || t("Student_PasswordChangeError") || "Şifre değiştirilemedi.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmitFeedback = async (e: FormEvent) => {
    e.preventDefault();
    const subject = (feedbackForm.subject ?? "").trim();
    const message = (feedbackForm.message ?? "").trim();

    if (subject.length < 3) {
      setFeedbackError(
        t("Feedback_SubjectMinLength") || "Konu en az 3 karakter olmalıdır.",
      );
      return;
    }
    if (subject.length > 100) {
      setFeedbackError(
        t("Val_MaxLength", {
          PropertyName: t("Feedback_Subject") || "Konu",
          MaxLength: 100,
        }) || "Konu en fazla 100 karakter olmalıdır.",
      );
      return;
    }
    if (message.length < 10) {
      setFeedbackError(
        t("Feedback_MessageMinLength") || "Mesaj en az 10 karakter olmalıdır.",
      );
      return;
    }
    if (message.length > 1000) {
      setFeedbackError(
        t("Val_MaxLength", {
          PropertyName: t("Feedback_Message") || "Mesaj",
          MaxLength: 1000,
        }) || "Mesaj en fazla 1000 karakter olmalıdır.",
      );
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackError("");

    try {
      const response: any = await api.post("/feedbacks", {
        subject,
        message,
      });

      const successMsg =
        (typeof response === "string" && response) ||
        response?.data?.message ||
        response?.message ||
        t("Res_Feedback_Created") ||
        "Geri bildiriminiz başarıyla iletildi.";

      setFeedbackModalOpen(false);
      setFeedbackForm({ subject: "", message: "" });
      showNotification("success", successMsg);
    } catch (err: any) {
      console.error("Geri bildirim gönderilemedi:", err);
      setFeedbackError(getErrorMessage(err));
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 font-medium bg-gray-50">
        <Loader2 className="animate-spin mr-2 text-blue-600" size={28} />{" "}
        {t("Admin_LoadingDetails")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative space-y-6">
      <LanguageSelector />

      {/* Bildirim Banner Alanı */}
      {notification && (
        <div
          className={`max-w-4xl mx-auto p-4 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-lg transition-all animate-fadeIn ${notification.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="profile-modern">
        <section className="profile-hero">
          <div className="profile-hero-avatar">
            {uploading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : profile?.profilePictureUrl ? (
              <button
                type="button"
                className="h-full w-full rounded-full"
                onClick={() => setPhotoViewerOpen(true)}
                aria-label={t("Student_ViewProfilePhoto")}
              >
                <img src={profile.profilePictureUrl} alt={`${profile.firstName} ${profile.lastName}`} />
              </button>
            ) : (
              <span>{profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}</span>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handleImageChange} />
            <button
              type="button"
              className="profile-camera"
              onClick={() => photoInputRef.current?.click()}
              aria-label={t("Student_ChangeProfilePhoto")}
            >
              <Camera size={15} />
            </button>
          </div>
          {(profile?.title || profile?.departmentName || profile?.department) && (
            <div className="profile-hero-eyebrow">
              {profile.title || profile.departmentName || profile.department}
            </div>
          )}
          <h1>{profile?.firstName} {profile?.lastName}</h1>
          <p>
            @{profile?.username}
            {(profile?.universityName || profile?.university) ? ` · ${profile.universityName || profile.university}` : ""}
          </p>
          <p className="profile-bio">{profile?.bio || t("Student_NoBio")}</p>
          <button
            type="button"
            className="profile-edit-button"
            onClick={() => {
              setEditForm({
                username: profile?.username || "",
                bio: profile?.bio || "",
                socialMediaLink: profile?.socialMediaLink || "",
              });
              setUpdateError("");
              setEditModalOpen(true);
            }}
          >
            <Edit3 size={15} /> {t("Student_EditProfile")}
          </button>
        </section>

        {isPhotoViewerOpen && profile?.profilePictureUrl && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={t("Student_ViewProfilePhoto")}
            onClick={() => setPhotoViewerOpen(false)}
          >
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full bg-white/90 p-2 text-gray-700 shadow-lg"
              onClick={() => setPhotoViewerOpen(false)}
              aria-label={t("Admin_Close")}
            >
              <X size={22} />
            </button>
            <img
              src={profile.profilePictureUrl}
              alt={`${profile.firstName} ${profile.lastName}`}
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        )}

        <section className="profile-tabs">
          <button type="button" className={activeTab === "joined" ? "active" : ""} onClick={() => setActiveTab("joined")}>
            {t("Student_JoinedEvents")} <span>{joinedEvents?.length ?? 0}</span>
          </button>
          <button type="button" className={activeTab === "created" ? "active" : ""} onClick={() => setActiveTab("created")}>
            {t("Student_CreatedEvents")} <span>{createdEvent ? 1 : 0}</span>
          </button>
        </section>

        <section className="profile-event-list">
          {activeTab === "joined" && (joinedEvents?.length ?? 0) === 0 && (
            <div className="profile-empty-state">{t("Student_NoJoinedEvents")}</div>
          )}
          {activeTab === "joined" && joinedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={{ ...event, isJoined: true }}
              onViewDetail={() => handleOpenDetail({ ...event, isJoined: true })}
              onOpenComments={() => handleOpenComments({ ...event, isJoined: true })}
            />
          ))}
          {activeTab === "created" && createdEvent && (
            <EventCard
              event={{ ...createdEvent, isCreator: true }}
              onViewDetail={() => handleOpenDetail({ ...createdEvent, isCreator: true })}
              onOpenComments={() => handleOpenComments({ ...createdEvent, isCreator: true })}
            />
          )}
          {activeTab === "created" && !createdEvent && (
            <div className="profile-empty-state">{t("Student_NoCreatedEvents")}</div>
          )}
        </section>

        <section className="profile-settings">
          <h2>{t("Student_AccountSettings")}</h2>
          <button type="button" onClick={() => setEditModalOpen(true)}><Edit3 size={18} /> {t("Student_EditProfile")} <span>›</span></button>
          <button type="button" onClick={() => { setPasswordError(""); setPasswordModalOpen(true); }}><LockKeyhole size={18} /> {t("Student_ChangePassword")} <span>›</span></button>
          <button
            type="button"
            onClick={() => {
              setFeedbackForm({ subject: "", message: "" });
              setFeedbackError("");
              setFeedbackModalOpen(true);
            }}
          >
            <MessageSquare size={18} /> {t("Student_FeedbackButton") || "Geri Bildirim / Sorun Bildir"} <span>›</span>
          </button>
          <button type="button" onClick={() => setLogoutModalOpen(true)}><LogOut size={18} /> {t("Auth_Logout") || "Çıkış Yap"} <span>›</span></button>
          <button type="button" className="danger" onClick={handleDeleteAccount}><Trash2 size={18} /> {t("Student_DeleteAccount") || "Hesabımı Sil"} <span>›</span></button>
        </section>
      </div>

      <div className="profile-legacy">
        <div className="max-w-7xl mx-auto space-y-6 pt-6 sm:pt-0">
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Profil Header */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative mb-4 group">
                <label className="cursor-pointer block relative">
                  {uploading ? (
                    <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-inner">
                      <Loader2 className="animate-spin" size={32} />
                    </div>
                  ) : profile?.profilePictureUrl ? (
                    <img
                      src={profile.profilePictureUrl}
                      alt="Profil"
                      className="w-28 h-28 rounded-full object-cover border-4 border-gray-50 shadow-md group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                      {profile?.firstName?.charAt(0)}
                      {profile?.lastName?.charAt(0)}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="absolute bottom-1 right-1 bg-emerald-500 p-2 rounded-full text-white shadow-md border-2 border-white">
                    <Camera size={16} />
                  </div>
                </label>
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900">
                {profile?.firstName} {profile?.lastName}
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-0.5">
                @{profile?.username}
                {(profile?.universityName || profile?.university) ? ` · ${profile.universityName || profile.university}` : ""}
              </p>
            </div>

            {/* Bilgi Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <GraduationCap className="text-blue-600" size={20} />
                  <h2 className="font-bold text-gray-800 text-base">
                    {t("Student_AcademicInfo") || "Akademik Bilgiler"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("Student_University") || "Üniversite"}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {profile?.universityName || profile?.university || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("Student_Faculty") || "Fakülte"}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {profile?.facultyName || profile?.faculty || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("Student_Department") || "Bölüm"}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {profile?.departmentName || profile?.department || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <User className="text-blue-600" size={20} />
                  <h2 className="font-bold text-gray-800 text-base">
                    {t("Student_AboutAndContact") || "Hakkımda & İletişim"}
                  </h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("Student_Email") || "E-posta"}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {profile?.email || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("Student_Phone") || "Telefon"}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {profile?.phoneNumber || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("Student_SocialMedia") || "Sosyal Medya"}
                    </span>
                    <span className="font-semibold text-blue-600 truncate max-w-[200px]">
                      {profile?.socialMediaLink ||
                        t("Student_NotAdded") ||
                        "Eklenmemiş"}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-gray-400 block mb-1">
                      {t("Student_Bio") || "Biyografi"}
                    </span>
                    <p className="text-gray-700 bg-gray-50 p-2.5 rounded-xl text-xs">
                      {profile?.bio ||
                        t("Student_NoBio") ||
                        "Henüz bir biyografi eklenmemiş."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <button
                onClick={() => {
                  setEditForm({
                    username: profile?.username || "",
                    bio: profile?.bio || "",
                    socialMediaLink: profile?.socialMediaLink || "",
                  });
                  setUpdateError("");
                  setEditModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3.5 bg-blue-50/50 hover:bg-blue-50 text-blue-600 rounded-2xl font-semibold transition-colors text-sm border border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <Edit3 size={18} />
                  <span>{t("Student_EditProfile") || "Profili Düzenle"}</span>
                </div>
              </button>

              {/* Çıkış Yap Butonu (Modali tetikler) */}
              <button
                onClick={() => setLogoutModalOpen(true)}
                className="w-full flex items-center justify-between p-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-semibold transition-colors text-sm border border-red-100 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} strokeWidth={2.5} />
                  <span>{t("Auth_Logout") || (i18n.language === "en" ? "Logout" : "Çıkış Yap")}</span>
                </div>
              </button>

              <button
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl font-semibold transition-colors text-sm border border-dashed border-gray-300"
              >
                <div className="flex items-center gap-3 text-red-600">
                  <Trash2 size={18} />
                  <span>{t("Student_DeleteAccount") || "Hesabımı Sil"}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Çıkış Yap Onay Modalı */}
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <LogOut size={24} strokeWidth={2.5} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-gray-900">
                  {t("Auth_LogoutConfirmTitle") || "Çıkış Yap"}
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {t("Auth_LogoutConfirmMessage") || "Sistemden çıkış yapmak istediğinize emin misiniz?"}
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-xs transition-colors"
                >
                  {t("Auth_Cancel") || "İptal"}
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl text-xs shadow-md shadow-red-600/20 transition-colors"
                >
                  {t("Auth_Yes") || "Evet, Çıkış Yap"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profil Düzenleme Modalı */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-gray-900 border-b pb-3">
                {t("Student_EditProfile") || "Profili Düzenle"}
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("Student_FieldUsername") || "Kullanıcı Adı"}
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-red-500 italic">
                    *{" "}
                    {t("Student_UsernameWarning") ||
                      "Kullanıcı adınızı güncelledikten sonra 30 gün boyunca değiştiremezsiniz."}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("Student_Bio") || "Biyografi"}
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("Student_SocialMedia") || "Sosyal Medya Linki"}
                  </label>
                  <input
                    type="text"
                    value={editForm.socialMediaLink}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        socialMediaLink: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {updateError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm"
                  >
                    {t("Student_CancelBtn") || "İptal"}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md shadow-blue-600/20"
                  >
                    {isUpdating
                      ? t("Student_Saving") || "Kaydediliyor..."
                      : t("Student_Save") || "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setPasswordModalOpen(false);
                setPasswordError("");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              aria-label={t("Admin_Close") || "Kapat"}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <LockKeyhole size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">
                  {t("Student_ChangePassword") || "Şifre Değiştir"}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {t("Reset_Description") || "Hesap güvenliğiniz için şifrenizi güncelleyin."}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-gray-700">{t("Student_CurrentPassword") || "Mevcut şifre"}</span>
                <PasswordInput
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target?.value ?? "" }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold text-gray-700">{t("Student_NewPassword") || "Yeni şifre"}</span>
                <PasswordInput
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target?.value ?? "" }))}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-bold text-gray-700">{t("Student_ConfirmNewPassword") || "Yeni şifre (Tekrar)"}</span>
                <PasswordInput
                  required
                  minLength={6}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target?.value ?? "" }))}
                  placeholder={t("Student_ConfirmNewPasswordPlaceholder") || "••••••••"}
                  autoComplete="new-password"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </label>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-red-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordError("");
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  {t("Auth_Cancel") || "İptal"}
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t("Student_Saving") || "Kaydediliyor..."}</span>
                    </>
                  ) : (
                    t("Student_Save") || "Kaydet"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Özel Hesap Silme Onay Modalı */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setDeleteAccountModalOpen(false);
                setDeletePassword("");
                setDeleteError("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              aria-label={t("Admin_Close") || "Kapat"}
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-3 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
                <Trash2 size={28} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t("Auth_DeleteAccountTitle") || "Hesabını Silmek İstediğine Emin Misin?"}
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  {t("Auth_DeleteAccountSubtitle") || "Bu işlem profilinizi pasife alacak ve aktif etkinliklerinizi iptal edecektir."}
                </p>
              </div>
            </div>

            {/* 15 Gün Bilgilendirmesi */}
            <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                <span>{t("Auth_DeleteAccountNoticeTitle") || "15 Günlük Kurtarma Süresi"}</span>
              </div>
              <p className="text-amber-700/90 text-[11.5px]">
                {t("Auth_DeleteAccountNotice") ||
                  "Hesabınız hemen kalıcı olarak silinmeyecek, pasife alınacaktır. 15 gün içinde tekrar giriş yapmanız halinde hesabınız tüm verileriyle yeniden aktif olacaktır. 15 gün boyunca giriş yapılmazsa hesabınız kalıcı olarak silinir."}
              </p>
            </div>

            <form onSubmit={handleConfirmDeleteAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  {t("Auth_DeleteAccountPasswordLabel") || "Mevcut Şifreniz"} <span className="text-red-500">*</span>
                </label>
                <PasswordInput
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target?.value ?? "");
                    if (deleteError) setDeleteError("");
                  }}
                  placeholder={t("Auth_DeleteAccountPasswordPlaceholder") || "Onaylamak için şifrenizi girin"}
                  required
                  autoComplete="current-password"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
                <p className="text-[11px] text-gray-500">
                  {t("Auth_DeleteAccountPasswordHint") || "Güvenliğiniz için lütfen mevcut şifrenizi giriniz."}
                </p>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-red-600" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteAccountModalOpen(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                  disabled={isDeletingAccount}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  {t("Auth_Cancel") || "Vazgeç"}
                </button>
                <button
                  type="submit"
                  disabled={!deletePassword.trim() || isDeletingAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t("Auth_DeletingAccount") || "Siliniyor..."}</span>
                    </>
                  ) : (
                    t("Auth_DeleteAccountConfirmBtn") || "Hesabımı Sil"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Geri Bildirim / Sorun Bildir Modalı */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setFeedbackModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              aria-label={t("Admin_Close") || "Kapat"}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MessageSquare size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">
                  {t("Feedback_ModalTitle") || "Geri Bildirim / Sorun Bildir"}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {t("Feedback_ModalDescription") ||
                    "Sorun, öneri veya taleplerinizi bize iletebilirsiniz."}
                </p>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 text-[11px] text-blue-700 leading-relaxed">
              ℹ️ {t("Feedback_DailyLimitNotice") || "Günde en fazla 2 geri bildirim gönderebilirsiniz."}
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("Feedback_Subject") || "Konu"} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {(feedbackForm.subject ?? "").length}/100
                  </span>
                </div>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  value={feedbackForm.subject ?? ""}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, subject: e.target?.value ?? "" })
                  }
                  placeholder={
                    t("Feedback_SubjectPlaceholder") ||
                    "Örn: Etkinlikler listelenirken hata alıyorum"
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("Feedback_Message") || "Mesajınız / Açıklama"} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {(feedbackForm.message ?? "").length}/1000
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  maxLength={1000}
                  value={feedbackForm.message ?? ""}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, message: e.target?.value ?? "" })
                  }
                  placeholder={
                    t("Feedback_MessagePlaceholder") ||
                    "Sorun veya önerinizi detaylı bir şekilde açıklayın (en az 10 karakter)..."
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 resize-none transition-colors"
                />
              </div>

              {feedbackError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-red-600" />
                  <span>{feedbackError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  {t("Auth_Cancel") || "İptal"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>{t("Feedback_Sending") || "Gönderiliyor..."}</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{t("Feedback_Send") || "Gönder"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Etkinlik Detay Modalı */}
      {isDetailModalOpen && selectedEventDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedEventDetail(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-gray-100 text-gray-700 transition-colors z-10 shadow-sm"
              aria-label={t("Admin_Close") || "Kapat"}
            >
              <X size={20} />
            </button>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                <span className="text-xs font-semibold">{t("Admin_LoadingDetails")}</span>
              </div>
            ) : (
              <>
                <div className="relative h-48 -mx-6 -mt-6 mb-6">
                  {selectedEventDetail.imageUrl ? (
                    <img src={selectedEventDetail.imageUrl} alt={selectedEventDetail.title} className="w-full h-full object-cover rounded-t-3xl" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col items-center justify-center rounded-t-3xl">
                      <Calendar size={48} className="text-blue-300 mb-2" />
                      <span className="text-blue-400 font-bold text-sm">{t("Student_EventPlaceholder")}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h2 className="text-2xl font-black text-white">{selectedEventDetail.title}</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Calendar size={18} className="text-blue-500" />
                    <span className="text-sm font-semibold">
                      {selectedEventDetail.eventDate ? new Date(selectedEventDetail.eventDate).toLocaleString(i18n.language === "en" ? "en-US" : "tr-TR", { dateStyle: "long", timeStyle: "short" }) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <MapPin size={18} className="text-red-500" />
                    <span className="text-sm font-semibold">{selectedEventDetail.location || t("Student_NotSpecified")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <User size={16} className="text-purple-500" />
                      <span className="text-xs font-semibold truncate">{selectedEventDetail.creatorName || selectedEventDetail.organizerName || t("Student_Unknown")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Tag size={16} className="text-green-500" />
                      <span className="text-xs font-semibold truncate">{formatCategoryName(selectedEventDetail.categoryName, t)}</span>
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {selectedEventDetail.description || t("Student_NoEventDescription")}
                    </p>
                  </div>
                  
                  {selectedEventDetail.isJoined && (
                    <div className="space-y-2">
                      <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold py-3 rounded-xl text-sm text-center flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} />
                        <span>{t("Student_JoinedBadge") || "✓ Katıldınız"}</span>
                      </div>
                      {isEventInFuture(selectedEventDetail.eventDate) && (
                        <button
                          type="button"
                          onClick={() => handleLeaveEvent(selectedEventDetail.id)}
                          disabled={isLeavingEvent}
                          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLeavingEvent ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>{t("Student_Leaving") || "Ayrılınıyor..."}</span>
                            </>
                          ) : (
                            <>
                              <LogOut size={14} />
                              <span>{t("Student_LeaveEventBtn") || "Etkinlikten Ayrıl"}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  {selectedEventDetail.isCreator && (
                    <div className="w-full bg-gray-100 border border-gray-200 text-gray-600 font-bold py-3.5 rounded-xl text-sm text-center">
                      {t("Student_CreatedByYou") || "Sizin Etkinliğiniz"}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Yorumlar & Sohbet Modalı */}
      {isCommentsModalOpen && selectedCommentsEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col p-6 shadow-2xl relative border border-gray-100">
            {/* Modal Kapatma Butonu */}
            <button
              onClick={() => {
                setIsCommentsModalOpen(false);
                setSelectedCommentsEvent(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors z-10"
              aria-label={t("Admin_Close") || "Kapat"}
            >
              <X size={18} />
            </button>

            {/* Modal Başlığı */}
            <div className="border-b border-gray-100 pb-4 pr-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MessageCircle size={20} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate leading-snug">
                    {selectedCommentsEvent.title}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium truncate">
                    {t("Event_CommentsModalSubtitle") || "Etkinlik Yorumları & Canlı Sohbet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sohbet Bileşeni */}
            <div className="overflow-y-auto flex-1">
              <EventCommentsChat
                eventId={selectedCommentsEvent.id}
                isJoined={selectedCommentsEvent.isJoined}
                isCreator={selectedCommentsEvent.isCreator}
                creatorId={(selectedCommentsEvent as any).creatorId ?? (selectedCommentsEvent as any).userId}
                creatorName={selectedCommentsEvent.creatorName || selectedCommentsEvent.organizerName}
                organizerName={selectedCommentsEvent.organizerName || selectedCommentsEvent.creatorName}
                className="!mt-0 !pt-2 !border-t-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}