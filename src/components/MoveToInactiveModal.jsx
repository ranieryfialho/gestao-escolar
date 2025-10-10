import React, { useState } from 'react';
import Modal from './Modal';

const MoveToInactiveModal = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('cancelamento');

  const handleConfirm = () => {
    onConfirm(reason);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Mover Aluno para Inativos</h2>
        <p>Selecione o motivo da inativação:</p>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border rounded mt-2"
        >
          <option value="cancelamento">Inativo por Cancelamento</option>
          <option value="trancamento">Inativo por Trancamento</option>
          <option value="spc">Inativo por SPC</option>
          <option value="mudanca_unidade">Mudança de Unidade</option>
        </select>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MoveToInactiveModal;