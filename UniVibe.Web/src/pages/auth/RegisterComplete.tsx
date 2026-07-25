import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { tokenService } from '../../services/tokenService';
import { GraduationCap, AlertCircle, ChevronDown } from 'lucide-react';

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
        await api.get(`/Auth/verify-token?token=${token}`);
        setIsTokenValid(true); 
      } catch (err: any) {
        setIsTokenValid(false);
        setTokenErrorMessage("Bu bağlantı geçerliliğini yitirmiştir, süresi dolmuş veya daha önce kullanılmıştır.");
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
      const response = await api.post('/Auth/complete-registration', {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl p-8 space-y-6 shadow-2xl shadow-purple-500/20">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {t('RegComplete_Title')}
          </h1>
          <p className="text-gray-500 text-sm">{t('RegComplete_Desc')}</p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleComplete} className="space-y-4" noValidate>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">{t('RegComplete_FirstName')}</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder={t('RegComplete_FirstNamePlaceholder')} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">{t('RegComplete_LastName')}</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder={t('RegComplete_LastNamePlaceholder')} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('RegComplete_Username')}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder="kullaniciadi" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('RegComplete_Password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder="••••••••" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('RegComplete_Phone')}</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder="555..." />
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">{t('RegComplete_EduInfo')}</label>

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

            <button type="button" onClick={() => { setModalType('grade'); setIsModalOpen(true); }} className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-lg flex justify-between items-center text-sm text-gray-700 hover:bg-gray-100 transition-all">
              <span>{grade ? grade.name : t('RegComplete_SelectGrade')}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-2.5 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md shadow-pink-500/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isLoading ? t('RegComplete_Loading') : t('RegComplete_SubmitBtn')}
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