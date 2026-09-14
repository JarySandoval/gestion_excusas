import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full ${maxWidth} overflow-hidden max-h-[94vh] sm:max-h-[90vh] flex flex-col`}>
        
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 gap-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
