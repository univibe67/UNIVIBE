import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { ResetSuccessView } from '../../components/ResetSuccessView';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setErrorMessage('');

    if (!email || !token) {
      setErrorMessage(t('Reset_InvalidLinkError') || 'Geçersiz veya eksik şifre sıfırlama bağlantısı.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('Reset_PasswordMismatch') || 'Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(t('Reset_PasswordTooShort') || 'Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/Auth/password/reset', {
        email,
        token,
        newPassword
      });

      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('Reset_DefaultError') || 'Şifre sıfırlama başarısız oldu.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-lockup"><span className="brand-mark">U</span><span>Uni<strong>Vibe</strong></span></div>
        
        <button type="button" className="auth-back" onClick={() => navigate('/')}>
          <span aria-hidden="true">‹</span> {t('Reset_BackToLogin') || 'Girişe dön'}
        </button>

        <div className="auth-forgot-heading">
          <div className="auth-eyebrow">{t('Reset_Eyebrow') || 'Yeni şifre'}</div>
          <h1 className="auth-title">{t('Reset_Title') || 'Yeni şifreni belirle'}</h1>
          <p className="auth-subtitle">
            {t('Reset_Description') || 'Güçlü ve daha önce kullanmadığın bir şifre seç.'}
          </p>
        </div>

        {hasAttemptedSubmit && errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {isSuccess ? (
          <ResetSuccessView onNavigateHome={() => navigate('/')} t={t} />
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            
            <div>
              <label>
                {t('Reset_NewPasswordLabel') || 'Yeni Şifre'}
              </label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            <div>
              <label>
                {t('Reset_ConfirmPasswordLabel') || 'Yeni Şifre (Tekrar)'}
              </label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit"
            >
              {isLoading ? (t('Reset_Loading') || 'Güncelleniyor...') : (t('Reset_SubmitButton') || 'Şifreyi güncelle')} <span aria-hidden="true">›</span>
            </button>
          </form>
        )}

        <p className="auth-legal">{t("Auth_Legal")}</p>
      </div>
    </div>
  );
}