import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { tokenService } from '../../services/tokenService';
import { AlertCircle, ChevronDown } from 'lucide-react';

import { useRegistrationData } from '../../hooks/useRegistrationData';
import { TokenCheckingView, TokenErrorView } from '../../components/TokenStatusViews';
import { SelectionModal } from '../../components/SelectionModal';

export default function RegisterComplete() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [tokenErrorMessage, setTokenErrorMessage] = useState('');

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    selectedUni,
    selectedFac,
    selectedDep,
    grade,
    modalType,
    isModalOpen,
    setModalType,
    setIsModalOpen,
    getModalData,
    handleSelectModalItem,
  } = useRegistrationData(t);

  useEffect(() => {
    const checkTokenValidity = async () => {
      if (!token) {
        setIsTokenValid(false);
        setTokenErrorMessage(t('RegComplete_InvalidLinkTitle'));
        return;
      }

      try {
        await api.get(`/Auth/tokens/verification?token=${encodeURIComponent(token)}`);
        setIsTokenValid(true); 
      } catch {
        setIsTokenValid(false);
        setTokenErrorMessage(t('RegComplete_InvalidLinkMessage'));
      }
    };

    checkTokenValidity();
  }, [token, t]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !username || !password || !phoneNumber || !selectedDep || grade === null) {
      setErrorMessage(t('RegComplete_ErrorValidation') || "Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/Auth/register/completion', {
        token,
        username,
        password,
        firstName,
        lastName,
        phoneNumber: phoneNumber.trim(),
        departmentId: selectedDep.id,
        grade: grade.id
      }) as any;

      const accessToken = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;

      if (accessToken) {
        tokenService.saveTokens(accessToken, refreshToken);
        navigate('/student');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      let rawMessage = "Kayıt tamamlama başarısız.";

      if (typeof err === "string") {
        rawMessage = err;
      } else if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "string") rawMessage = data;
        else if (data?.message) rawMessage = typeof data.message === "string" ? data.message : data.message.join(" • ");
        else if (data?.errors) rawMessage = Array.isArray(data.errors) ? data.errors.join(" • ") : Object.values(data.errors).flat().join(" • ");
      } else if (typeof err.message === "string") {
        rawMessage = err.message;
      }

      if (rawMessage === "Kayıt tamamlama başarısız." && typeof err === "object") {
        rawMessage = String(err);
      }

      const finalMessage = rawMessage
        .split(' • ')
        .map((part) => {
          const key = part.trim();
          const translated = t(key);
          return translated !== key ? translated : key;
        })
        .join(' • ');

      setErrorMessage(finalMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) {
    return <TokenCheckingView message={t('RegComplete_Checking')} />;
  }

  if (isTokenValid === false) {
    return (
      <TokenErrorView 
        title={t('RegComplete_InvalidLinkTitle')}
        errorMessage={tokenErrorMessage}
        buttonText={t('RegComplete_BackToLogin')}
        onBackToLogin={() => navigate('/')}
      />
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card register-card">
        <button type="button" className="auth-back" onClick={() => navigate('/register')}>
          <span aria-hidden="true">‹</span> {t('RegComplete_Back')}
        </button>

        <div className="auth-forgot-heading register-heading">
          <div className="auth-eyebrow">{t('RegComplete_Eyebrow')}</div>
          <h1 className="auth-title">{t('RegComplete_Title')}</h1>
          <p className="auth-subtitle">{t('RegComplete_Desc')}</p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleComplete} className="auth-form register-form" noValidate>
          
          <div className="register-section register-basic-section">
            <label className="register-section-title"><span>01</span>{t('RegComplete_BasicInfo')}</label>
            <div className="reg-field">
              <label>{t('RegComplete_Username')}</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="mehmetyilmaz" />
            </div>
            <div className="reg-field">
              <label>{t('RegComplete_FirstName')}</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('RegComplete_FirstNamePlaceholder')} />
            </div>
            <div className="reg-field">
              <label>{t('RegComplete_LastName')}</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t('RegComplete_LastNamePlaceholder')} />
            </div>
            <div className="reg-field">
              <label>{t('RegComplete_Password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('RegComplete_PasswordPlaceholder')} />
            </div>
          </div>

          <div className="register-section register-education-section">
            <label className="register-section-title"><span>02</span>{t('RegComplete_EduInfo')}</label>

            <button type="button" onClick={() => { setModalType('uni'); setIsModalOpen(true); }} className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg flex justify-between items-center text-sm text-gray-700 hover:bg-gray-100 transition-all">
              <span>{selectedUni ? selectedUni.name : t('RegComplete_SelectUni')}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            <button type="button" disabled={!selectedUni} onClick={() => { setModalType('fac'); setIsModalOpen(true); }} className={`w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg flex justify-between items-center text-sm text-gray-700 transition-all ${!selectedUni ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
              <span>{selectedFac ? selectedFac.name : t('RegComplete_SelectFac')}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            <button type="button" disabled={!selectedFac} onClick={() => { setModalType('dep'); setIsModalOpen(true); }} className={`w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg flex justify-between items-center text-sm text-gray-700 transition-all ${!selectedFac ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
              <span>{selectedDep ? selectedDep.name : t('RegComplete_SelectDep')}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            <div className="reg-field">
              <label>{t('RegComplete_Role')}</label>
              <div className="reg-select-display">
                <span>{t('Role_Student')}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="reg-field">
              <label>{t('RegComplete_SelectGrade')}</label>
              <button type="button" onClick={() => { setModalType('grade'); setIsModalOpen(true); }} className="reg-select-display">
                <span>{grade ? grade.name : t('RegComplete_SelectGrade')}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="register-section register-contact-section">
            <label className="register-section-title"><span>03</span>{t('RegComplete_ContactInfo')}</label>
            <div className="reg-field">
              <label>{t('RegComplete_Phone')}</label>
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="555..." />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="auth-submit"
          >
            {isLoading ? t('RegComplete_Loading') : t('RegComplete_SubmitBtn')} <span aria-hidden="true">›</span>
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