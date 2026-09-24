import { CheckCircle, ArrowRight } from 'lucide-react';

interface ResetSuccessViewProps {
  onNavigateHome: () => void;
  t: (key: string) => string;
}

export function ResetSuccessView({ onNavigateHome, t }: ResetSuccessViewProps) {
  return (
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
        onClick={onNavigateHome}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-2.5 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md shadow-pink-500/30 flex items-center justify-center gap-2"
      >
        {t('Reset_LoginButton') || 'Giriş Sayfasına Dön'} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}