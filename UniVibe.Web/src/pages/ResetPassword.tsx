import { useState, useEffect } from 'react';
import { Lock, KeyRound, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

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

  useEffect(() => {
    if (!email || !token) {
      setErrorMessage(t('Reset_InvalidLinkError') || 'Geçersiz veya eksik şifre sıfırlama bağlantısı.');
    }
  }, [email, token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

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
      await api.post('/Auth/reset-password', {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl p-8 space-y-6 shadow-2xl shadow-purple-500/20">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {t('Reset_Title') || 'Yeni Şifre Belirleme'}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('Reset_Description') || 'Lütfen hesabınız için güvenli yeni bir şifre girin.'}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-800">
                {t('Reset_SuccessTitle') || 'Şifreniz Başarıyla Güncellendi!'}
              </h3>
              <p className="text-sm text-gray-500">
                {t('Reset_SuccessDesc') || 'Yeni şifrenizle artık giriş yapabilirsiniz.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-2.5 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md shadow-pink-500/30 flex items-center justify-center gap-2"
            >
              {t('Reset_LoginButton') || 'Giriş Sayfasına Dön'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t('Reset_NewPasswordLabel') || 'Yeni Şifre'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t('Reset_ConfirmPasswordLabel') || 'Yeni Şifre (Tekrar)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !token}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-2.5 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md shadow-pink-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (t('Reset_Loading') || 'Güncelleniyor...') : (t('Reset_SubmitButton') || 'Şifreyi Güncelle')}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}