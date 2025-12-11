// src/components/Modal.jsx
import React from 'react';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    // A MUDANÇA ESTÁ AQUI:
    // Trocámos a classe `bg-opacity-50` por `bg-opacity-30`.
    // Isto tornará o fundo significativamente mais claro e transparente.
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;