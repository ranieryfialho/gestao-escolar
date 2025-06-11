// src/components/TransferStudentModal.jsx
import React, { useState } from 'react';
import Modal from './Modal'; // Reutilizamos o nosso componente de modal genérico

function TransferStudentModal({ isOpen, onClose, student, currentClass, allClasses, onConfirmTransfer }) {
  // Filtra a lista de turmas para não mostrar a turma atual do aluno
  const availableClasses = allClasses.filter(c => c.id !== currentClass.id);
  const [targetClassId, setTargetClassId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const handleConfirm = async () => {
    if (!targetClassId) {
      return alert("Por favor, selecione uma turma de destino.");
    }
    setIsTransferring(true);
    // Chama a função que veio do componente pai, passando todos os dados necessários
    await onConfirmTransfer(student, currentClass.id, targetClassId);
    setIsTransferring(false);
    onClose(); // Fecha o modal após a transferência
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transferir Aluno">
      <div>
        <p className="mb-4">
          A transferir o(a) aluno(a): <span className="font-bold">{student?.name}</span>
        </p>
        <p className="mb-4">
          Da turma atual: <span className="font-bold">{currentClass?.name}</span>
        </p>
        
        <div className="space-y-2">
          <label htmlFor="targetClass" className="block text-sm font-medium text-gray-700">
            Selecione a nova turma de destino:
          </label>
          <select
            id="targetClass"
            value={targetClassId}
            onChange={(e) => setTargetClassId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="" disabled>Escolha uma turma...</option>
            {availableClasses.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={isTransferring}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isTransferring ? 'A transferir...' : 'Confirmar Transferência'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default TransferStudentModal;
