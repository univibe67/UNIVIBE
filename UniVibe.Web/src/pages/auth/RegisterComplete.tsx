import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import { tokenService } from "../../services/tokenService";
import { getErrorMessage } from "../../services/errorMessage";
import { AlertCircle, ChevronDown } from "lucide-react";

import { useRegistrationData } from "../../hooks/useRegistrationData";
import {
  TokenCheckingView,
  TokenErrorView,
} from "../../components/TokenStatusViews";
import { SelectionModal } from "../../components/SelectionModal";
import PasswordInput from "../../components/PasswordInput";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

export default function RegisterComplete() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";

  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [tokenErrorMessage, setTokenErrorMessage] = useState("");

  const [isUniLocked, setIsUniLocked] = useState(false);
  const [isFacLocked, setIsFacLocked] = useState(false);

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [title, setTitle] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    selectedUni,
    selectedFac,
    selectedDep,
    grade,
    modalType,
    isModalOpen,
    setSelectedUni,
    setSelectedFac,
    setModalType,
    setIsModalOpen,
    getModalData,
    handleSelectModalItem,
  } = useRegistrationData(t);

  useEffect(() => {
    let isMounted = true;

    const fetchRegistrationDetails = async () => {
      if (!token) {
        setIsTokenValid(false);
        setTokenErrorMessage(t("RegComplete_InvalidLinkTitle"));
        return;
      }

      try {
        const details = (await api.get(
          `/Auth/registration/details?token=${encodeURIComponent(token)}`,
        )) as {
          universityId?: string;
          universityName?: string;
          facultyId?: string;
          facultyName?: string;
        };

        if (!isMounted) return;

        setIsTokenValid(true);

        if (details?.universityId && details.universityId !== EMPTY_GUID) {
          setSelectedUni({
            id: details.universityId,
            name: details.universityName || "",
          });
          setIsUniLocked(true);
        }

        if (details?.facultyId && details.facultyId !== EMPTY_GUID) {
          setSelectedFac({
            id: details.facultyId,
            name: details.facultyName || "",
          });
          setIsFacLocked(true);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setIsTokenValid(false);

        if (err?.response?.status === 429) {
          setTokenErrorMessage(
            "Çok fazla deneme yaptınız, lütfen biraz bekleyin.",
          );
        } else {
          setTokenErrorMessage(t("RegComplete_InvalidLinkMessage"));
        }
      }
    };

    fetchRegistrationDetails();

    return () => {
      isMounted = false;
    };
  }, [token, setSelectedFac, setSelectedUni, t]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFirstName = (firstName ?? "").trim();
    const cleanLastName = (lastName ?? "").trim();
    const cleanUsername = (username ?? "").trim();
    const cleanPassword = password ?? "";
    const cleanPhone = (phoneNumber ?? "").trim();

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanUsername ||
      !cleanPassword ||
      !cleanPhone ||
      !selectedDep
    ) {
      setErrorMessage(
        t("RegComplete_ErrorValidation") ||
          "Lütfen tüm zorunlu alanları doldurun.",
      );
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = (await api.post("/Auth/register/completion", {
        token,
        username: cleanUsername,
        password: cleanPassword,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        phoneNumber: cleanPhone,
        departmentId: selectedDep?.id,
        universityId: selectedUni?.id,
        facultyId: selectedFac?.id,
        grade: grade?.id,
        title: (title ?? "").trim() || null,
      })) as any;

      const accessToken = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;

      if (accessToken) {
        tokenService.saveTokens(accessToken, refreshToken);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      const rawMessage = getErrorMessage(err);

      const finalMessage = rawMessage
        .split(" • ")
        .map((part) => {
          const key = part.trim();
          const translated = t(key);
          return translated !== key ? translated : key;
        })
        .join(" • ");

      setErrorMessage(finalMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) {
    return <TokenCheckingView message={t("RegComplete_Checking")} />;
  }

  if (isTokenValid === false) {
    return (
      <TokenErrorView
        title={t("RegComplete_InvalidLinkTitle")}
        errorMessage={tokenErrorMessage}
        buttonText={t("RegComplete_BackToLogin")}
        onBackToLogin={() => navigate("/login")}
      />
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card register-card">
        <button
          type="button"
          className="auth-back"
          onClick={() => navigate("/register")}
        >
          <span aria-hidden="true">‹</span> {t("RegComplete_Back")}
        </button>

        <div className="auth-forgot-heading register-heading">
          <div className="auth-eyebrow">{t("RegComplete_Eyebrow")}</div>
          <h1 className="auth-title">{t("RegComplete_Title")}</h1>
          <p className="auth-subtitle">{t("RegComplete_Desc")}</p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form
          onSubmit={handleComplete}
          className="auth-form register-form"
          noValidate
        >
          <div className="register-section register-basic-section">
            <label className="register-section-title">
              <span>01</span>
              {t("RegComplete_BasicInfo")}
            </label>
            <div className="reg-field">
              <label>{t("RegComplete_Username")}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target?.value ?? "")}
                placeholder="mehmetyilmaz"
              />
            </div>
            <div className="reg-field">
              <label>{t("RegComplete_FirstName")}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target?.value ?? "")}
                placeholder={t("RegComplete_FirstNamePlaceholder")}
              />
            </div>
            <div className="reg-field">
              <label>{t("RegComplete_LastName")}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target?.value ?? "")}
                placeholder={t("RegComplete_LastNamePlaceholder")}
              />
            </div>
            <div className="reg-field">
              <label>{t("RegComplete_Password")}</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target?.value ?? "")}
                placeholder={t("RegComplete_PasswordPlaceholder")}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="register-section register-education-section">
            <label className="register-section-title">
              <span>02</span>
              {t("RegComplete_EduInfo")}
            </label>

            <button
              type="button"
              disabled={isUniLocked}
              onClick={() => {
                setModalType("uni");
                setIsModalOpen(true);
              }}
              className={`w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg flex justify-between items-center text-sm text-gray-700 transition-all ${
                isUniLocked
                  ? "opacity-75 cursor-not-allowed bg-gray-100"
                  : "hover:bg-gray-100"
              }`}
            >
              <span>
                {selectedUni ? selectedUni.name : t("RegComplete_SelectUni")}
              </span>
              {!isUniLocked && (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <button
              type="button"
              disabled={isFacLocked || !selectedUni}
              onClick={() => {
                setModalType("fac");
                setIsModalOpen(true);
              }}
              className={`w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg flex justify-between items-center text-sm text-gray-700 transition-all ${
                isFacLocked || !selectedUni
                  ? "opacity-75 cursor-not-allowed bg-gray-100"
                  : "hover:bg-gray-100"
              }`}
            >
              <span>
                {selectedFac ? selectedFac.name : t("RegComplete_SelectFac")}
              </span>
              {!isFacLocked && (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <button
              type="button"
              disabled={!selectedFac}
              onClick={() => {
                setModalType("dep");
                setIsModalOpen(true);
              }}
              className={`w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg flex justify-between items-center text-sm text-gray-700 transition-all ${!selectedFac ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
            >
              <span>
                {selectedDep ? selectedDep.name : t("RegComplete_SelectDep")}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            <div className="reg-field">
              <label>{t("RegComplete_Role")}</label>
              <div className="reg-select-display">
                <span>{t("RegComplete_RoleFromEmail")}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="reg-field">
              <label>{t("RegComplete_SelectGrade")}</label>
              <button
                type="button"
                onClick={() => {
                  setModalType("grade");
                  setIsModalOpen(true);
                }}
                className="reg-select-display"
              >
                <span>{grade ? grade.name : t("RegComplete_SelectGrade")}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="register-section register-contact-section">
            <label className="register-section-title">
              <span>03</span>
              {t("RegComplete_ContactInfo")}
            </label>
            <div className="reg-field">
              <label>{t("RegComplete_Phone")}</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => {
                  const raw = e.target?.value ?? "";
                  const numericValue = raw
                    .replace(/[^0-9]/g, "")
                    .slice(0, 10);
                  setPhoneNumber(numericValue);
                }}
                placeholder="555..."
              />
            </div>
            <div className="reg-field">
              <label>{t("RegComplete_AcademicTitle")}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target?.value ?? "")}
                placeholder={t("RegComplete_AcademicTitlePlaceholder")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="auth-submit"
          >
            {isLoading ? t("RegComplete_Loading") : t("RegComplete_SubmitBtn")}{" "}
            <span aria-hidden="true">›</span>
          </button>
        </form>
      </div>

      <SelectionModal
        isOpen={isModalOpen}
        modalType={modalType}
        data={getModalData()}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectModalItem}
        t={t}
      />
    </div>
  );
}
