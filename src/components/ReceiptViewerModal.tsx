import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  caption?: string;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  caption,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !photoUrl) return null;

  const handleZoomIn = () => {
    triggerHaptic('light');
    setScale((prev) => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = () => {
    triggerHaptic('light');
    setScale((prev) => Math.max(prev - 0.3, 0.7));
  };

  const handleRotate = () => {
    triggerHaptic('selection');
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    triggerHaptic('success');
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `receipt_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Top action toolbar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
        <div className="text-xs font-semibold max-w-[60%] truncate opacity-90">
          {caption || 'Фотография чека / расписки'}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            title="Приблизить"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            title="Отдалить"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            title="Повернуть"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            title="Скачать чек"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition ml-2"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div className="relative max-w-full max-h-[85vh] overflow-hidden flex items-center justify-center">
        <img
          src={photoUrl}
          alt={caption || 'Чек'}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
        />
      </div>

      {/* Bottom caption hint */}
      {caption && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 backdrop-blur-md text-white text-xs rounded-full border border-white/10 max-w-[90%] truncate text-center">
          {caption}
        </div>
      )}
    </div>
  );
};
