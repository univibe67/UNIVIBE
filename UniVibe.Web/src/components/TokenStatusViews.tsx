import { ShieldAlert } from 'lucide-react';

interface TokenCheckingViewProps {
  message: string;
}

export function TokenCheckingView({ message }: TokenCheckingViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-medium">
      {message}
    </div>
  );
}

interface TokenErrorViewProps {
  title: string;
  errorMessage: string;
  buttonText: string;
  onBackToLogin: () => void;
}

export function TokenErrorView({ title, errorMessage, buttonText, onBackToLogin }: TokenErrorViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{errorMessage}</p>
        <button 
          onClick={onBackToLogin} 
          className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-black transition-all mt-4"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}