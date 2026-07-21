import { useState, useEffect } from "react";
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
  LayoutDashboard,
  UserCircle,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import StudentEventFeed from "./StudentEventFeed";

function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <div className="absolute top-5 right-5 flex bg-white/90 backdrop-blur-md rounded-2xl p-1.5 border border-purple-100 z-20 shadow-md">
      <button
        onClick={() => i18n.changeLanguage("tr")}
        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
          i18n.language === "tr"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        TR
      </button>
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
          i18n.language === "en"
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
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  socialMediaLink?: string;
  universityName?: string;
  facultyName?: string;
  departmentName?: string;
  profilePictureUrl?: string;
}

export default function StudentProfile() {
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  // Çıkış yapma onay modalı için state
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"dashboard" | "profile">(
    "dashboard",
  );

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

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const fetchProfile = async () => {
    try {
      const response: any = await api.get("/Users/profile");
      let data = response.data ? response.data : response;
      if (data.data) {
        data = data.data;
      }

      setProfile(data);
      setEditForm({
        username: data.username || "",
        bio: data.bio || "",
        socialMediaLink: data.socialMediaLink || "",
      });
    } catch (error) {
      console.error("Profil bilgileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const response: any = await api.post(
        "/Users/upload-profile-picture",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const newPhotoUrl =
        (response.imageUrl || response.data?.imageUrl) +
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
        t("Student_PhotoUploadError") || "Fotoğraf sunucuya gönderilemedi.",
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
      await api.put("/Users/update-profile", {
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
      const errorMsg =
        typeof error === "string"
          ? error
          : error?.response?.data?.errors?.[0] ||
            error?.response?.data?.message ||
            error?.response?.data?.title ||
            error?.message ||
            "İşlem sırasında bir hata oluştu.";

      setUpdateError(typeof errorMsg === "string" ? errorMsg : "İşlem sırasında bir hata oluştu.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Çıkış Onaylandığında Çalışacak Fonksiyon
  const confirmLogout = () => {
    setLogoutModalOpen(false);
    showNotification(
      "success",
      t("Auth_LogoutSuccess") || "Başarıyla çıkış yapıldı, yönlendiriliyorsunuz..."
    );
    
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "/";
    }, 1000);
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        t("Auth_DeleteAccountConfirm") ||
          "Bu işlem geri alınamaz. Hesabınızı silmek istediğinize emin misiniz?",
      )
    ) {
      api
        .delete("/Users/delete-account")
        .then(() => {
          localStorage.clear();
          window.location.href = "/";
        })
        .catch(() => {
          showNotification(
            "error",
            t("Student_DeleteAccountError") ||
              "Hesap silinirken bir sorun oluştu.",
          );
        });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 font-medium bg-gray-50">
        <Loader2 className="animate-spin mr-2 text-blue-600" size={28} />{" "}
        {t("Admin_LoadingDetails") || "Yükleniyor..."}
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

      <div className="max-w-7xl mx-auto space-y-6 pt-6 sm:pt-0">
        {/* Üst Sekme Geçiş Butonları */}
        <div className="flex justify-center pt-2 relative">
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm mx-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard size={16} />
              <span>{t("Student_Events_Title") || "Etkinlikler"}</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <UserCircle size={16} />
              <span>{t("Student_Profile") || "Profilim"}</span>
            </button>
          </div>
        </div>

        {/* Sekme İçerikleri */}
        {activeTab === "dashboard" ? (
          <div>
            <StudentEventFeed />
          </div>
        ) : (
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
                      {profile?.universityName || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("Student_Faculty") || "Fakülte"}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {profile?.facultyName || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {t("Student_Department") || "Bölüm"}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {profile?.departmentName || "-"}
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
        )}

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
      </div>
    </div>
  );
}