import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { tokenService } from '../services/tokenService';
import { GraduationCap, AlertCircle, ChevronDown, X, ShieldAlert } from 'lucide-react';

const GRADES = [
  { id: 0, name: "Hazırlık" },
  { id: 1, name: "1. Sınıf" },
  { id: 2, name: "2. Sınıf" },
  { id: 3, name: "3. Sınıf" },
  { id: 4, name: "4. Sınıf" },
  { id: 5, name: "5. Sınıf" },
  { id: 6, name: "6. Sınıf" },
  { id: 7, name: "Mezun" },
];

export default function RegisterComplete() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  // 🌟 Token Durum Kontrolü İçin Stateler
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [tokenErrorMessage, setTokenErrorMessage] = useState('');

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [grade, setGrade] = useState<any>(null);

  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [selectedUni, setSelectedUni] = useState<any>(null);
  const [selectedFac, setSelectedFac] = useState<any>(null);
  const [selectedDep, setSelectedDep] = useState<any>(null);

  const [modalType, setModalType] = useState<'grade' | 'uni' | 'fac' | 'dep' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 🌟 SAYFA AÇILDIĞINDA TOKEN GEÇERLİLİK KONTROLÜ
  useEffect(() => {
    const checkTokenValidity = async () => {
      if (!token) {
        setIsTokenValid(false);
        setTokenErrorMessage("Geçersiz veya eksik bağlantı.");
        return;
      }

      try {
        // Backend'deki verify-token endpoint'ine soruyoruz
        await api.get(`/Auth/verify-token?token=${token}`);
        setIsTokenValid(true); // Token sağlam, form açılabilir
      } catch (err: any) {
        setIsTokenValid(false); // Token yanmış, kullanılmış veya süresi dolmuş!
        setTokenErrorMessage("Bu bağlantı geçerliliğini yitirmiştir, süresi dolmuş veya daha önce kullanılmıştır.");
      }
    };

    checkTokenValidity();
  }, [token]);

  // Üniversiteleri çekme
  useEffect(() => {
    api.get("/University")
      .then((res: any) => setUniversities(res.data || res))
      .catch(() => setUniversities([]));
  }, []);

  useEffect(() => {
    if (selectedUni) {
      api.get(`/University/${selectedUni.id}/faculties`)
        .then((res: any) => setFaculties(res.data || res))
        .catch(() => setFaculties([]));
    }
  }, [selectedUni]);

  useEffect(() => {
    if (selectedFac) {
      api.get(`/University/faculties/${selectedFac.id}/departments`)
        .then((res: any) => setDepartments(res.data || res))
        .catch(() => setDepartments([]));
    }
  }, [selectedFac]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !selectedDep || !phoneNumber || grade === null) {
      setErrorMessage(t('RegComplete_ErrorValidation'));
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
        navigate('/student/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.log("YAKALANAN HATA:", err);

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
    }finally {
      setIsLoading(false);
    }
  };

  const getModalData = () => {
    switch (modalType) {
      case 'grade': return GRADES;
      case 'uni': return universities;
      case 'fac': return faculties;
      case 'dep': return departments;
      default: return [];
    }
  };

  // 🌟 1. DURUM: TOKEN KONTROL EDİLİYOR (Yükleniyor Ekranı)
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-medium">
        Bağlantı kontrol ediliyor...
      </div>
    );
  }

  // 🌟 2. DURUM: TOKEN GEÇERSİZ VEYA KULLANILMIŞ (Formu Göstermiyoruz!)
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Bağlantı Geçersiz</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{tokenErrorMessage}</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-black transition-all mt-4"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  // 🌟 3. DURUM: TOKEN SAĞLAM (Kayıt Formu Ekranda)
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

        <form onSubmit={handleComplete} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">{t('RegComplete_FirstName')}</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder={t('RegComplete_FirstNamePlaceholder')} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">{t('RegComplete_LastName')}</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder={t('RegComplete_LastNamePlaceholder')} required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('RegComplete_Username')}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder="kullaniciadi" required />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('RegComplete_Password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder="••••••••" required />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{t('RegComplete_Phone')}</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500" placeholder="555..." required />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[70vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {modalType === 'uni' ? t('RegComplete_SelectUni') : modalType === 'fac' ? t('RegComplete_SelectFac') : modalType === 'dep' ? t('RegComplete_SelectDep') : t('RegComplete_SelectGrade')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-2 divide-y divide-gray-50">
              {getModalData().map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => {
                    if (modalType === 'grade') setGrade(item);
                    else if (modalType === 'uni') { setSelectedUni(item); setSelectedFac(null); setSelectedDep(null); }
                    else if (modalType === 'fac') { setSelectedFac(item); setSelectedDep(null); }
                    else if (modalType === 'dep') setSelectedDep(item);
                    setIsModalOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-purple-50 hover:text-purple-700 rounded-lg text-sm transition-colors font-medium text-gray-700"
                >
                  {item.name}
                </button>
              ))}
              {getModalData().length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">Önce üst seçimi yapmalısınız.</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}