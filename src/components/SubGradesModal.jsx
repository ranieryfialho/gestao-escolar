// src/components/SubGradesModal.jsx (VERSÃO CONTROLADA)

import React from 'react';

// REMOVIDO: useState, useEffect. O modal não controla mais seu próprio estado.
// ALTERADO: Novas props 'gradesToDisplay' e 'onGradeChange'
const SubGradesModal = ({ isOpen, onClose, module, student, gradesToDisplay, onGradeChange, onSave }) => {
  
  // A função handleSave agora chama onSave diretamente.
  const handleSave = () => {
    onSave();
    onClose();
  };

  if (!isOpen || !module || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Lançar Notas - {module.title}</h2>
        <p className="text-sm text-gray-600 mb-6">Aluno(a): <span className="font-semibold">{student.name}</span></p>

        <div className="space-y-4">
          {module.subGrades.map(subGradeName => (
            <div key={subGradeName}>
              <label className="block text-sm font-medium text-gray-700">{subGradeName}</label>
              <input
                type="text"
                inputMode="decimal"
                // ALTERADO: O valor vem diretamente da nova prop
                value={gradesToDisplay[subGradeName] || ''}
                // ALTERADO: O onChange agora chama a nova prop
                onChange={e => onGradeChange(subGradeName, e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.0"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Salvar Notas
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubGradesModal;