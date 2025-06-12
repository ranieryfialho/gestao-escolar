// src/components/SubGradesModal.jsx
import React, { useState, useEffect } from 'react';

const SubGradesModal = ({ isOpen, onClose, module, student, currentGrades, onSave }) => {
  const [subGrades, setSubGrades] = useState({});

  useEffect(() => {
    // Popula o estado inicial com as notas existentes quando o modal abre
    if (currentGrades) {
      setSubGrades(currentGrades.subGrades || {});
    }
  }, [isOpen, currentGrades]);

  const handleGradeChange = (subGradeName, value) => {
    const sanitizedValue = value.replace(/[^0-9,.]/g, '').replace(',', '.');
    if (parseFloat(sanitizedValue) > 10 || sanitizedValue.length > 4) return;
    setSubGrades(prev => ({ ...prev, [subGradeName]: sanitizedValue }));
  };

  const handleSave = () => {
    onSave(subGrades);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
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
                value={subGrades[subGradeName] || ''}
                onChange={e => handleGradeChange(subGradeName, e.target.value)}
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