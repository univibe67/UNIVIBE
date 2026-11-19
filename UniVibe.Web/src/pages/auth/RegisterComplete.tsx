import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Lock, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import PasswordRules from "../../components/auth/PasswordRules";
import PasswordInput from "../../components/PasswordInput";
import { SelectionModal } from "../../components/SelectionModal";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { buttonClass } from "../../components/ui/buttonStyles";
import { Field, Input } from "../../components/ui/Field";
import { controlClass } from "../../components/ui/fieldStyles";
import FullPageLoader from "../../components/ui/FullPageLoader";
import { useRegistrationData } from "../../hooks/useRegistrationData";
import AuthLayout from "../../layouts/AuthLayout";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";
import { tokenService } from "../../services/tokenService";
import type { ModalType } from "../../types/auth.types";
import { REGISTER_PASSWORD_RULES, meetsPasswordRules } from "../../utils/password";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

interface PickerFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  disabled?: boolean;
  locked?: boolean;
  required?: boolean;
  className?: string;
  onClick: () => void;
}

function PickerField({ label, value, placeholder, disabled, locked, required, className = "", onClick }: PickerFieldProps) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="mb-1.5 text-[13px] font-semibold text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-coral-600" aria-hidden="true">*</span>}
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-haspopup="dialog"
        aria-label={`${label}: ${value ?? placeholder}`}
        className={`flex h-11 items-center justify-between gap-2 px-3.5 text-left ${controlClass}`}
      >
        <span className={`truncate ${value ? "" : "text-ink-400"}`}>{value ?? placeholder}</span>
        {locked ? (
          <Lock size={15} className="shrink-0 text-ink-400" aria-hidden="true" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-ink-400" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

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
        setTokenErrorMessage(t("RegComplete_InvalidLinkMessage"));
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
          setTokenErrorMessage(t("Error_TooManyRequests"));
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

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim();
    const cleanPhone = phoneNumber.trim();

    if (!cleanFirstName || !cleanLastName || !cleanUsername || !password || !cleanPhone || !selectedDep) {
      setErrorMessage(t("RegComplete_ErrorValidation"));
      return;
    }

    if (!meetsPasswordRules(password, REGISTER_PASSWORD_RULES)) {
      setErrorMessage(t("UI_PasswordRulesUnmet"));
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = (await api.post("/Auth/register/completion", {
        token,
        username: cleanUsername,
        password,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        phoneNumber: cleanPhone,
        departmentId: selectedDep?.id,
        universityId: selectedUni?.id,
        facultyId: selectedFac?.id,
        grade: grade?.id,
        title: title.trim() || null,
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
      const finalMessage = getErrorMessage(err)
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
    return (
      <AuthLayout>
        <FullPageLoader label={t("RegComplete_Checking")} />
      </AuthLayout>
    );
  }

  if (isTokenValid === false) {
    return (
      <AuthLayout>
        <div className="text-center">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-coral-50 text-coral-600" aria-hidden="true">
            <ShieldAlert size={26} />
          </span>
          <h1 className="text-2xl font-bold text-ink-900">{t("RegComplete_InvalidLinkTitle")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{tokenErrorMessage}</p>
          <Link to="/login" className={buttonClass("primary", "lg", "mt-6 w-full")}>
            {t("RegComplete_BackToLogin")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const openPicker = (type: ModalType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const selectedId =
    modalType === "uni"
      ? selectedUni?.id
      : modalType === "fac"
        ? selectedFac?.id
        : modalType === "dep"
          ? selectedDep?.id
          : grade?.id;

  const sectionTitle = "mb-4 text-[15px] font-semibold text-ink-900";

  return (
    <AuthLayout
      wide
      title={t("RegComplete_Title")}
      description={t("RegComplete_Desc")}
      backTo={{ to: "/register", label: t("RegComplete_Back") }}
    >
      <form onSubmit={handleComplete} className="space-y-8" noValidate>
        <section>
          <h2 className={sectionTitle}>{t("RegComplete_BasicInfo")}</h2>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label={t("RegComplete_FirstName")} required>
              <Input
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder={t("RegComplete_FirstNamePlaceholder")}
              />
            </Field>
            <Field label={t("RegComplete_LastName")} required>
              <Input
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder={t("RegComplete_LastNamePlaceholder")}
              />
            </Field>
            <Field label={t("RegComplete_Username")} required>
              <Input
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="mehmetyilmaz"
              />
            </Field>
            <div>
              <Field label={t("RegComplete_Password")} required>
                <PasswordInput
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("RegComplete_PasswordPlaceholder")}
                />
              </Field>
              <PasswordRules password={password} rules={REGISTER_PASSWORD_RULES} />
            </div>
          </div>
        </section>

        <section>
          <h2 className={sectionTitle}>{t("RegComplete_EduInfo")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <PickerField
              className="sm:col-span-2"
              label={t("Student_University")}
              value={selectedUni?.name}
              placeholder={t("RegComplete_SelectUni")}
              disabled={isUniLocked}
              locked={isUniLocked}
              onClick={() => openPicker("uni")}
            />
            <PickerField
              className="sm:col-span-2"
              label={t("Student_Faculty")}
              value={selectedFac?.name}
              placeholder={t("RegComplete_SelectFac")}
              disabled={isFacLocked || !selectedUni}
              locked={isFacLocked}
              onClick={() => openPicker("fac")}
            />
            <PickerField
              required
              label={t("Student_Department")}
              value={selectedDep?.name}
              placeholder={t("RegComplete_SelectDep")}
              disabled={!selectedFac}
              onClick={() => openPicker("dep")}
            />
            <PickerField
              label={t("UI_Grade")}
              value={grade?.name}
              placeholder={t("RegComplete_SelectGrade")}
              onClick={() => openPicker("grade")}
            />
          </div>
          <Alert tone="info" className="mt-4">
            {t("RegComplete_Role")}: {t("RegComplete_RoleFromEmail")}
          </Alert>
        </section>

        <section>
          <h2 className={sectionTitle}>{t("RegComplete_ContactInfo")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("RegComplete_Phone")} required>
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="5XXXXXXXXX"
              />
            </Field>
            <Field label={t("RegComplete_AcademicTitle")}>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("RegComplete_AcademicTitlePlaceholder")}
              />
            </Field>
          </div>
        </section>

        {errorMessage && <Alert>{errorMessage}</Alert>}

        <Button type="submit" size="lg" className="w-full" disabled={!token} loading={isLoading}>
          {isLoading ? t("RegComplete_Loading") : t("RegComplete_SubmitBtn")}
        </Button>
      </form>

      <SelectionModal
        isOpen={isModalOpen}
        modalType={modalType}
        data={getModalData()}
        selectedId={selectedId}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectModalItem}
        t={t}
      />
    </AuthLayout>
  );
}
