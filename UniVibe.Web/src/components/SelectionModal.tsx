import { X } from 'lucide-react';
import type { ItemModel, ModalType } from '../types/auth.types';

interface SelectionModalProps {
  isOpen: boolean;
  modalType: ModalType;
  data: ItemModel[];
  onClose: () => void;
  onSelect: (item: ItemModel) => void;
  t: (key: string) => string;
}

export function SelectionModal({ isOpen, modalType, data, onClose, onSelect, t }: SelectionModalProps) {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (modalType) {
      case 'uni': return t('RegComplete_SelectUni');
      case 'fac': return t('RegComplete_SelectFac');
      case 'dep': return t('RegComplete_SelectDep');
      default: return t('RegComplete_SelectGrade');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[70vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">{getTitle()}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-2 divide-y divide-gray-50">
          {data.map((item, idx) => (
            <button
              key={item.id || idx}
              onClick={() => onSelect(item)}
              className="w-full text-left px-4 py-3 hover:bg-purple-50 hover:text-purple-700 rounded-lg text-sm transition-colors font-medium text-gray-700"
            >
              {item.name}
            </button>
          ))}
          {data.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">{t('RegComplete_SelectParentFirst')}</p>
          )}
        </div>

      </div>
    </div>
  );
}