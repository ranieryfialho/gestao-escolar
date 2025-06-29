// src/components/CreateClassForm.jsx

import React, { useState } from 'react';

// O formulário agora recebe a lista de pacotes e a lista de professores
function CreateClassForm({ onClassCreated, packages, teachers }) {
  const [className, setClassName] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || '');
  // Novo estado para o professor selecionado
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!className.trim() || !selectedPackageId || !selectedTeacherId) {
      alert('Por favor, preencha todos os campos: nome, pacote e professor.');
      return;
    }
    // Agora passamos o ID do professor junto
    onClassCreated(className, selectedPackageId, selectedTeacherId);
    setClassName('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-bold mb-4">Cadastrar Nova Turma</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Nome da Turma */}
        <div>
          <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma</label>
          <input id="className" type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Ex: 2001-A (ESP) || 05.2025" className="w-full px-3 py-2 border rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seletor de Pacote de Módulos */}
          <div>
            <label htmlFor="package" className="block text-sm font-medium text-gray-700 mb-1">Pacote de Módulos</label>
            {/* Ajuste os valores (value) para serem IDs padronizados */}
            <select
              id="package"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {/* Use IDs claros e consistentes. O 'packages' prop deve ter esses IDs */}
              <option value="grade_19_meses">Grade com Especialização (19 meses)</option>
              <option value="grade_12_meses">Grade Informática e Administração (12 meses)</option>
            </select>
          </div>

          {/* Seletor de Professor */}
          <div>
            <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">Professor Responsável</label>
            <select id="teacher" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
              <option value="" disabled>Selecione um professor</option>
              {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.email})</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
          Criar Turma
        </button>
      </form>
    </div>
  );
}

export default CreateClassForm;