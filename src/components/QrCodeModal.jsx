// src/components/QrCodeModal.jsx
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { X, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

function QrCodeModal({ isOpen, onClose, link, className }) {
  const [isCopied, setIsCopied] = useState(false);

  // Reseta o estado do botão "copiado" sempre que o modal for reaberto
  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !link) {
    return null;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link).then(() => {
      setIsCopied(true);
      toast.success("Link copiado para a área de transferência!");
      // Opcional: reverter o estado após alguns segundos
      setTimeout(() => setIsCopied(false), 3000);
    }).catch(err => {
      console.error("Erro ao copiar o link: ", err);
      toast.error("Não foi possível copiar o link.");
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 rounded-lg shadow-xl w-full max-w-sm m-4 relative flex flex-col items-center p-8 transform transition-transform duration-300 scale-95 hover:scale-100"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full p-1"
        >
          <X size={24} />
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">QR Code do Grupo - {className}</h3>

        <div className="bg-white p-6 rounded-lg shadow-inner">
            <QRCode value={link} size={256} />
        </div>

        <div className="w-full mt-6">
          <button
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
              isCopied 
                ? 'bg-green-600 cursor-default' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isCopied ? (
              <>
                <Check size={20} />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={20} />
                <span>Copiar Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QrCodeModal;