import { useState } from 'react';
import { Mail, Lock, LogIn, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { tokenService } from '../services/tokenService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'admin' | 'student'>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // API'ye giriş isteği gönder
      const response = await api.post('/Auth/login', { email, password });

      // Gelen tokenları kaydet (response.data kullanıyoruz)
      tokenService.saveTokens(response.data.token, response.data.refreshToken);
      
      // Kullanıcı tipine göre yönlendir
      navigate(userType === 'admin' ? '/admin/dashboard' : '/student/dashboard');
      
    } catch (err: any) {
      setError(err || 'Giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-blue-600">UniVibe</h1>
          <p className="text-gray-500">Giriş tipini seçin</p>
        </div>

        {/* Admin/Öğrenci Seçimi */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setUserType('student')}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${userType === 'student' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            <User className="w-4 h-4" /> Öğrenci
          </button>
          <button
            type="button"
            onClick={() => setUserType('admin')}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${userType === 'admin' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            <ShieldCheck className="w-4 h-4" /> Admin
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">E-posta</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ornek@univibe.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Şifre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? 'Giriş yapılıyor...' : (
              <>
                <LogIn className="w-5 h-5" /> Giriş Yap
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}