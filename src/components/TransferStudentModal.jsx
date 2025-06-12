// src/components/TransferStudentModal.jsx

import React, { useState, useEffect } from 'react';

function TransferStudentModal({ isOpen, onClose, student, currentClass, allClasses, onConfirmTransfer }) {
  const [targetClassId, setTargetClassId] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {
    if (allClasses && currentClass) {
      // Filtra a lista de turmas para não mostrar a turma atual do aluno
      const filtered = allClasses.filter(c => c.id !== currentClass.id);
      setAvailableClasses(filtered);
      // Define a primeira turma da lista como padrão, se houver
      if (filtered.length > 0) {
        setTargetClassId(filtered[0].id);
      }
    }
  }, [isOpen, allClasses, currentClass]);

  const handleConfirm = () => {
    if (!targetClassId) {
      alert('Por favor, selecione uma turma de destino.');
      return;
    }
    // Chama a função da página pai com todos os dados necessários
    onConfirmTransfer(student, currentClass.id, targetClassId);
  };

  if (!isOpen || !student || !currentClass) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Transferir Aluno(a)</h2>
        <p className="text-sm text-gray-600 mb-6">
          Aluno(a): <span className="font-semibold">{student.name}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Da Turma:
            </label>
            <input
              type="text"
              disabled
              value={currentClass.name}
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="target-class" className="block text-sm font-medium text-gray-700">
              Para a Turma:
            </label>
            <select
              id="target-class"
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {availableClasses.length > 0 ? (
                availableClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option disabled>Nenhuma outra turma disponível</option>
              )}
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!targetClassId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            Confirmar Transferência
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferStudentModal;