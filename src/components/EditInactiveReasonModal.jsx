// src/components/EditInactiveReasonModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const EditInactiveReasonModal = ({ isOpen, onClose, onSave, student }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (student && student.inactiveReason) {
      // Converte o texto completo do motivo para o valor do <option>
      if (student.inactiveReason.includes('Cancelamento')) {
        setReason('cancelamento');
      } else if (student.inactiveReason.includes('Trancamento')) {
        setReason('trancamento');
      } else if (student.inactiveReason.includes('SPC')) {
        setReason('spc');
      }
    }
  }, [student]);

  const handleSave = () => {
    if (student) {
      onSave(student.id, reason);
    }
  };

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Editar Motivo da Inativação</h2>
        <p className="mb-2">
          Editando motivo para: <span className="font-semibold">{student.name}</span>
        </p>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border rounded mt-2"
        >
          <option value="cancelamento">Inativo por Cancelamento</option>
          <option value="trancamento">Inativo por Trancamento</option>
          <option value="spc">Inativo por SPC</option>
        </select>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Salvar Alteração
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditInactiveReasonModal;