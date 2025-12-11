import React, { useState, useEffect } from 'react';

function ObservationModal({ isOpen, onClose, onSave, student }) {
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (isOpen && student) {
      setObservation(student.observation || '');
    }
  }, [isOpen, student]);

  const handleSave = () => {
    onSave(observation);
    onClose();
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-2">Observações do Aluno(a)</h2>
        <p className="text-sm text-gray-600 mb-6">
          Aluno(a): <span className="font-semibold">{student.name}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="observation-text" className="block text-sm font-medium text-gray-700">
              Observação
            </label>
            <textarea
              id="observation-text"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows="5"
              placeholder="Digite aqui as observações sobre o aluno nesta turma..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Salvar Observação
          </button>
        </div>
      </div>
    </div>
  );
}

export default ObservationModal;