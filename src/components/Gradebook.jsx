// src/components/Gradebook.jsx
import React, { useState, useEffect } from 'react';

function Gradebook({ students, modules, onSaveGrades }) {
  const [grades, setGrades] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialGrades = {};
    if (students) {
      students.forEach(student => {
        // Inicializa o estado com as notas já existentes do aluno
        initialGrades[student.id] = student.grades || {};
      });
    }
    setGrades(initialGrades);
  }, [students]);

  const handleGradeChange = (studentId, moduleId, value) => {
    // Permite apenas números (0-9) e um único ponto ou vírgula
    const numericValue = value.replace(/[^0-9,.]/g, '').replace(',', '.');
    // Impede notas maiores que 10 e mais de 4 caracteres (ex: 10.0)
    if (parseFloat(numericValue) > 10 || numericValue.length > 4) return;

    setGrades(prevGrades => ({
      ...prevGrades,
      [studentId]: {
        ...prevGrades[studentId],
        [moduleId]: numericValue,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveGrades(grades);
    setIsSaving(false);
    alert("Notas salvas com sucesso!");
  };

  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-4 text-center">
        <p className="text-gray-500">Importe alunos para poder lançar as notas.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[800px] text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-800 uppercase bg-gray-100 border-b-2 border-gray-200">
            <tr>
              {/* Coluna Código do Aluno */}
              <th scope="col" className="px-6 py-3 font-bold tracking-wider">
                Código
              </th>
              {/* Coluna Nome do Aluno */}
              <th scope="col" className="px-6 py-3 font-bold tracking-wider">
                Aluno(a)
              </th>
              {/* Colunas dos Módulos */}
              {modules.map(module => (
                <th key={module.id} scope="col" className="px-4 py-3 text-center font-bold tracking-wider">
                  {module.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="bg-white border-b hover:bg-blue-50 transition-colors duration-150">
                {/* Célula Código */}
                <td className="px-6 py-4 font-mono text-gray-500">
                  {student.code}
                </td>
                {/* Célula Nome */}
                <th scope="row" className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                  {student.name}
                </th>
                {/* Células das Notas */}
                {modules.map(module => (
                  <td key={module.id} className="p-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={grades[student.id]?.[module.id] || ''}
                      onChange={(e) => handleGradeChange(student.id, module.id, e.target.value)}
                      className="w-20 text-center border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mx-auto block transition"
                      placeholder="-"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 shadow-lg hover:shadow-xl"
        >
          {isSaving ? 'A salvar...' : 'Salvar Todas as Notas'}
        </button>
      </div>
    </div>
  );
}

export default Gradebook;