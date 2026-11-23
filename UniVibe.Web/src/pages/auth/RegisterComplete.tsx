import { useEffect, useRef, useState } from "react";
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
import {
  REGISTER_PASSWORD_RULES,
  meetsPasswordRules,
} from "../../utils/password";

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

type ValidatableField =
  | "department"
  | "firstName"
  | "lastName"
  | "username"
  | "password";

interface PickerFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  disabled?: boolean;
  locked?: boolean;
  required?: boolean;
  error?: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
  className?: string;
  onClick: () => void;
}

function PickerField({
  label,
  value,
  placeholder,
  disabled,
  locked,
  required,
  error,
  buttonRef,
  className = "",
  onClick,
}: PickerFieldProps) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="mb-1.5 text-[13px] font-semibold text-ink-700">
        {label}
        {required && (
          <span className="ml-0.5 text-coral-600" aria-hidden="true">
            *
          </span>
        )}
      </p>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-haspopup="dialog"
        aria-invalid={Boolean(error)}
        aria-label={`${label}: ${value ?? placeholder}`}
        className={`flex h-11 items-center justify-between gap-2 px-3.5 text-left ${controlClass} ${
          error ? "border-coral-500! ring-2 ring-coral-500/20" : ""
        }`}
      >
        <span className={`truncate ${value ? "" : "text-ink-400"}`}>
          {value ?? placeholder}
        </span>
        {locked ? (
          <Lock
            size={15}
            className="shrink-0 text-ink-400"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            size={16}
            className="shrink-0 text-ink-400"
            aria-hidden="true"
          />
        )}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-coral-600">
          {error}
        </p>
      )}
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
  const [isTeacher, setIsTeacher] = useState(false);

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ValidatableField, string>>
  >({});

  const fieldRefs = useRef<
    Partial<Record<ValidatableField, HTMLElement | null>>
  >({});
  const generalAlertRef = useRef<HTMLDivElement | null>(null);

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
    if (selectedDep && fieldErrors.department) {
      setFieldErrors((prev) => ({ ...prev, department: undefined }));
    }
  }, [selectedDep, fieldErrors.department]);

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
          role?: string;
          userType?: string;
          isTeacher?: boolean;
        };

        if (!isMounted) return;

        setIsTokenValid(true);

        const roleValue = (
          details?.role ||
          details?.userType ||
          ""
        ).toLowerCase();
        const teacherCheck =
          details?.isTeacher === true ||
          roleValue === "teacher" ||
          roleValue === "instructor" ||
          roleValue === "academic" ||
          roleValue === "ogretmen";
        setIsTeacher(teacherCheck);

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

  const clearFieldError = (field: ValidatableField) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const scrollToAndFocus = (field: ValidatableField) => {
    const target = fieldRefs.current[field];
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const focusable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLButtonElement
          ? target
          : target.querySelector<HTMLElement>("input, button");
      focusable?.focus({ preventScroll: true });
    }, 150);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim();

    const errors: Partial<Record<ValidatableField, string>> = {};
    const fieldOrder: ValidatableField[] = [
      "department",
      "firstName",
      "lastName",
      "username",
      "password",
    ];

    if (!selectedDep) errors.department = t("RegComplete_ErrorValidation");
    if (!cleanFirstName) errors.firstName = t("RegComplete_ErrorValidation");
    if (!cleanLastName) errors.lastName = t("RegComplete_ErrorValidation");
    if (!cleanUsername) errors.username = t("RegComplete_ErrorValidation");

    if (!password) {
      errors.password = t("RegComplete_ErrorValidation");
    } else if (!meetsPasswordRules(password, REGISTER_PASSWORD_RULES)) {
      errors.password = t("UI_PasswordRulesUnmet");
    }

    const firstInvalidField = fieldOrder.find((key) => Boolean(errors[key]));

    if (firstInvalidField) {
      setFieldErrors(errors);
      setErrorMessage(
        errors[firstInvalidField] || t("RegComplete_ErrorValidation"),
      );
      scrollToAndFocus(firstInvalidField);
      return;
    }

    setFieldErrors({});
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = (await api.post("/Auth/register/completion", {
        token,
        username: cleanUsername,
        password,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        departmentId: selectedDep?.id,
        universityId: selectedUni?.id,
        facultyId: selectedFac?.id,
        grade: grade?.id,
        title: isTeacher ? title.trim() || null : null,
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
      setTimeout(() => {
        generalAlertRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
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
          <span
            className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-coral-50 text-coral-600"
            aria-hidden="true"
          >
            <ShieldAlert size={26} />
          </span>
          <h1 className="text-2xl font-bold text-ink-900">
            {t("RegComplete_InvalidLinkTitle")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            {tokenErrorMessage}
          </p>
          <Link
            to="/login"
            className={buttonClass("primary", "lg", "mt-6 w-full")}
          >
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
  const errorInputClass = "border-coral-500! ring-2 ring-coral-500/20";

  return (
    <AuthLayout
      wide
      title={t("RegComplete_Title")}
      description={t("RegComplete_Desc")}
      backTo={{ to: "/register", label: t("RegComplete_Back") }}
    >
      <form onSubmit={handleComplete} className="space-y-8" noValidate>
        {/* 1. EĞİTİM BİLGİLERİ */}
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
              buttonRef={(el) => {
                fieldRefs.current.department = el;
              }}
              label={t("Student_Department")}
              value={selectedDep?.name}
              placeholder={t("RegComplete_SelectDep")}
              disabled={!selectedFac}
              error={fieldErrors.department}
              onClick={() => openPicker("dep")}
            />
            <PickerField
              label={t("UI_Grade")}
              value={grade?.name}
              placeholder={t("RegComplete_SelectGrade")}
              onClick={() => openPicker("grade")}
            />
          </div>
        </section>

        {/* 2. TEMEL BİLGİLER */}
        <section>
          <h2 className={sectionTitle}>{t("RegComplete_BasicInfo")}</h2>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <div
              ref={(el) => {
                fieldRefs.current.firstName = el;
              }}
            >
              <Field label={t("RegComplete_FirstName")} required>
                <Input
                  autoComplete="given-name"
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  className={fieldErrors.firstName ? errorInputClass : ""}
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    clearFieldError("firstName");
                  }}
                  placeholder={t("RegComplete_FirstNamePlaceholder")}
                />
              </Field>
              {fieldErrors.firstName && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-coral-600"
                >
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            <div
              ref={(el) => {
                fieldRefs.current.lastName = el;
              }}
            >
              <Field label={t("RegComplete_LastName")} required>
                <Input
                  autoComplete="family-name"
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  className={fieldErrors.lastName ? errorInputClass : ""}
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    clearFieldError("lastName");
                  }}
                  placeholder={t("RegComplete_LastNamePlaceholder")}
                />
              </Field>
              {fieldErrors.lastName && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-coral-600"
                >
                  {fieldErrors.lastName}
                </p>
              )}
            </div>

            {isTeacher && (
              <div className="sm:col-span-2">
                <Field label={t("RegComplete_AcademicTitle")}>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t("RegComplete_AcademicTitlePlaceholder")}
                  />
                </Field>
              </div>
            )}

            <div
              ref={(el) => {
                fieldRefs.current.username = el;
              }}
            >
              <Field label={t("RegComplete_Username")} required>
                <Input
                  autoComplete="username"
                  aria-invalid={Boolean(fieldErrors.username)}
                  className={fieldErrors.username ? errorInputClass : ""}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    clearFieldError("username");
                  }}
                  placeholder="mehmetyilmaz"
                />
              </Field>
              {fieldErrors.username && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-coral-600"
                >
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div
              ref={(el) => {
                fieldRefs.current.password = el;
              }}
            >
              <Field label={t("RegComplete_Password")} required>
                <PasswordInput
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  className={fieldErrors.password ? errorInputClass : ""}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldError("password");
                  }}
                  placeholder={t("RegComplete_PasswordPlaceholder")}
                />
              </Field>
              {fieldErrors.password && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-coral-600"
                >
                  {fieldErrors.password}
                </p>
              )}
              <PasswordRules
                password={password}
                rules={REGISTER_PASSWORD_RULES}
              />
            </div>
          </div>
        </section>

        {errorMessage && (
          <div ref={generalAlertRef}>
            <Alert>{errorMessage}</Alert>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!token}
          loading={isLoading}
        >
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
