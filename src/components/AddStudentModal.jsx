// src/components/AddStudentModal.jsx

import React, { useState } from 'react';

function AddStudentModal({ isOpen, onClose, onSave }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!code.trim() || !name.trim()) {
      alert('Por favor, preencha o código e o nome do aluno.');
      return;
    }
    onSave({ code, name });
    // Limpa os campos após salvar
    setCode('');
    setName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-6">Adicionar Novo Aluno</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="student-code" className="block text-sm font-medium text-gray-700">
              Código do Aluno
            </label>
            <input
              type="text"
              id="student-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: 12345"
            />
          </div>
          <div>
            <label htmlFor="student-name" className="block text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <input
              type="text"
              id="student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Informe aqui o nome do aluno."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Salvar Aluno
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddStudentModal;