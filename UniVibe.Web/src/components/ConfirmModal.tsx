import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "danger" | "warning" | "success" | "info";
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  type = "warning",
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const { i18n } = useTranslation();

  if (!isOpen) return null;

  const config = {
    danger: { bg: "bg-red-100", text: "text-red-600", btn: "bg-red-600 hover:bg-red-700 shadow-red-500/30", icon: AlertTriangle },
    warning: { bg: "bg-orange-100", text: "text-orange-600", btn: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/30", icon: AlertTriangle },
    success: { bg: "bg-green-100", text: "text-green-600", btn: "bg-green-600 hover:bg-green-700 shadow-green-500/30", icon: CheckCircle },
    info: { bg: "bg-blue-100", text: "text-blue-600", btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30", icon: Info },
  };

  const CurrentIcon = config[type].icon;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${config[type].bg}`}>
            <CurrentIcon className={`w-8 h-8 ${config[type].text}`} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm">{message}</p>
        </div>

        <div className="flex bg-gray-50 p-4 gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {i18n.language === "en" ? "Cancel" : "İptal"}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white font-medium transition-colors shadow-md ${config[type].btn}`}
          >
            {i18n.language === "en" ? "Yes, Confirm" : "Evet, Onayla"}
          </button>
        </div>
      </div>
    </div>
  );
}