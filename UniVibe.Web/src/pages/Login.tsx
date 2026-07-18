import { useState } from 'react';
import { Mail, Lock, LogIn, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { tokenService } from '../services/tokenService';

const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

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
      const response = await api.post('/Auth/login', { email, password }) as any;
      
      const token = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;

      if (!token) {
        throw new Error("Sunucudan token alınamadı, e-posta veya şifre hatalı.");
      }
      
      const decoded = decodeToken(token);
      console.log("Token İçeriği (Roller):", decoded); 

      const userRole = decoded?.role || decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      const expectedRole = userType === 'admin' ? 'Admin' : 'Student'; 

      if (!userRole || (Array.isArray(userRole) ? !userRole.includes(expectedRole) : userRole !== expectedRole)) {
        throw new Error(`Yetkisiz giriş! Bu hesap bir ${expectedRole} hesabı değil.`);
      }

      tokenService.saveTokens(token, refreshToken);
      navigate(userType === 'admin' ? '/admin/dashboard' : '/student/dashboard');
      
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Giriş işlemi sırasında bir hata oluştu.');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isStudent = userType === 'student';
  const bgClass = isStudent ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" : "bg-gray-50";
  const boxClass = isStudent ? "bg-white/95 backdrop-blur-sm shadow-2xl shadow-purple-500/20" : "bg-white shadow-xl";
  const titleClass = isStudent ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" : "text-blue-600";
  const buttonClass = isStudent ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md shadow-pink-500/30" : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ease-in-out ${bgClass}`}>
      <div className={`max-w-md w-full rounded-2xl p-8 space-y-6 transition-all duration-500 ${boxClass}`}>
        
        <div className="text-center space-y-2">
          <h1 className={`text-3xl font-bold transition-colors duration-500 ${titleClass}`}>
            UniVibe
          </h1>
          <p className="text-gray-500">Giriş tipini seçin</p>
        </div>

        <div className="flex bg-gray-100/80 p-1 rounded-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => { setError(''); setUserType('student'); }}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all duration-300 ${
              isStudent ? 'bg-white shadow-sm text-purple-600 font-medium scale-105' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" /> Öğrenci
          </button>
          <button
            type="button"
            onClick={() => { setError(''); setUserType('admin'); }}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all duration-300 ${
              !isStudent ? 'bg-white shadow-sm text-blue-600 font-medium scale-105' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Admin
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center animate-pulse">
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
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none transition-all ${
                  isStudent ? 'focus:ring-purple-500 focus:border-purple-500' : 'focus:ring-blue-500 focus:border-blue-500'
                }`}
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
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none transition-all ${
                  isStudent ? 'focus:ring-purple-500 focus:border-purple-500' : 'focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 ${buttonClass}`}
          >
            {isLoading ? 'Kontrol ediliyor...' : (
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