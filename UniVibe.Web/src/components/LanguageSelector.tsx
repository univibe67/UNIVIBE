import { useTranslation } from "react-i18next";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <div className="absolute top-6 right-6 flex bg-white/20 backdrop-blur-md rounded-lg p-1 border border-black/30 z-10">
      <button
        onClick={() => i18n.changeLanguage('tr')}
        className={`px-3 py-1 rounded text-sm font-bold ${
          i18n.language === 'tr' ? 'bg-white text-gray-800 shadow' : 'text-white'
        }`}
      >
        TR
      </button>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-bold ${
          i18n.language === 'en' ? 'bg-white text-gray-800 shadow' : 'text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}