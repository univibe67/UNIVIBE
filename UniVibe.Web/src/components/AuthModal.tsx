import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: ReactNode;
  titleClass: string;
  children: ReactNode;
}

export default function AuthModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  titleClass,
  children,
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <div className="absolute top-4 right-4">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center space-y-3 mb-6 mt-2">
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-gradient-to-r ${titleClass}`}>
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 px-2">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}