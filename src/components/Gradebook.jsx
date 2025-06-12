// src/components/Gradebook.jsx
import React, { useState, useEffect } from 'react';

// 1. Adicionamos a nova prop 'isReadOnly'
function Gradebook({ students, modules, onSaveGrades, onTransferClick, isUserAdmin, isReadOnly }) {
  const [grades, setGrades] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialGrades = {};
    if (students) {
      students.forEach(student => {
        const studentGrades = {};
        if (student.grades) {
          Object.keys(student.grades).forEach(moduleId => {
            const value = student.grades[moduleId];
            studentGrades[moduleId] = formatGradeOnLoad(value);
          });
        }
        initialGrades[student.id] = studentGrades;
      });
    }
    setGrades(initialGrades);
  }, [students]);

  const formatGradeOnLoad = (value) => {
    if (!value && value !== 0) return '';
    const num = parseFloat(String(value).replace(',', '.'));
    if (isNaN(num)) return '';
    return num.toFixed(1);
  };

  const handleGradeChange = (studentId, moduleId, value) => {
    // 2. Trava de segurança para o modo de leitura
    if (isReadOnly) return;

    const sanitizedValue = value.replace(/[^0-9,.]/g, '').replace(',', '.');
    if (parseFloat(sanitizedValue) > 10 || sanitizedValue.length > 4) return;
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [moduleId]: sanitizedValue },
    }));
  };

  const handleGradeBlur = (studentId, moduleId, value) => {
    // 3. Trava de segurança para o modo de leitura
    if (isReadOnly) return;

    if (!value) return;
    const num = parseFloat(value.replace(',', '.'));
    if (!isNaN(num)) {
      const formattedGrade = num.toFixed(1);
      setGrades(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], [moduleId]: formattedGrade },
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // A função onSaveGrades não precisa mais do alert, pois ele já estava no componente pai
    await onSaveGrades(grades);
    setIsSaving(false);
  };

  const getGradeStyle = (grade) => {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return "bg-white";
    if (numericGrade >= 7) return "bg-green-100 text-green-800 font-bold";
    return "bg-red-100 text-red-800 font-bold";
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
        <table className="w-full table-auto text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-800 uppercase bg-gray-100 border-b-2">
            <tr>
              <th scope="col" className="px-4 py-2 font-bold w-24">Código</th>
              <th scope="col" className="px-4 py-2 font-bold w-64">Aluno(a)</th>
              {modules.map(module => (
                <th key={module.id} scope="col" className="px-2 py-2 text-center font-bold w-32">{module.title}</th>
              ))}
              {isUserAdmin && <th scope="col" className="px-4 py-2 font-bold text-center w-28">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="bg-white border-b hover:bg-blue-50">
                <td className="px-4 py-2 font-mono text-gray-500">{student.code}</td>
                <th scope="row" className="px-4 py-2 font-bold text-gray-900">{student.name}</th>
                {modules.map(module => {
                  const gradeValue = grades[student.id]?.[module.id] || '';
                  const cellStyle = getGradeStyle(gradeValue);
                  return (
                    <td key={module.id} className={`p-1 text-center transition-colors ${!isReadOnly ? cellStyle : ''}`}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={gradeValue}
                        onChange={(e) => handleGradeChange(student.id, module.id, e.target.value)}
                        onBlur={(e) => handleGradeBlur(student.id, module.id, e.target.value)}
                        // 4. Lógica para desabilitar e estilizar o input
                        disabled={isReadOnly}
                        className={`w-16 text-center border-none rounded-md p-2 mx-auto block 
                          ${isReadOnly 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : `bg-transparent focus:ring-2 focus:ring-blue-500 ${cellStyle}`
                          }`}
                        placeholder="-"
                      />
                    </td>
                  );
                })}
                {isUserAdmin && (
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => onTransferClick(student)} className="font-medium text-blue-600 hover:underline">Transferir</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 5. O botão de salvar só aparece se NÃO for somente leitura */}
      {!isReadOnly && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait transition shadow-lg"
          >
            {isSaving ? 'A salvar...' : 'Salvar Todas as Notas'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Gradebook;