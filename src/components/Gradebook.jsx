// src/components/Gradebook.jsx
import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react'; // NOVO: Ícone para indicar edição

// NOVO: Adicionada a prop onOpenSubGradesModal
function Gradebook({ students, modules, onSaveGrades, onTransferClick, isUserAdmin, isReadOnly, onOpenSubGradesModal }) {
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
            
            // ALTERADO: Lógica para lidar com ambos os formatos de nota (simples e objeto)
            if (typeof value === 'object' && value !== null && value.hasOwnProperty('finalGrade')) {
              studentGrades[moduleId] = value; // Armazena o objeto inteiro
            } else {
              studentGrades[moduleId] = formatGradeOnLoad(value); // Formata a nota simples
            }
          });
        }
        initialGrades[student.id] = studentGrades;
      });
    }
    setGrades(initialGrades);
  }, [students]);

  const formatGradeOnLoad = (value) => {
    // Esta função permanece a mesma, pois só lida com valores simples
    if (!value && value !== 0) return '';
    const num = parseFloat(String(value).replace(',', '.'));
    if (isNaN(num)) return '';
    return num.toFixed(1);
  };

  const handleGradeChange = (studentId, moduleId, value) => {
    if (isReadOnly) return;
    const sanitizedValue = value.replace(/[^0-9,.]/g, '').replace(',', '.');
    if (parseFloat(sanitizedValue) > 10 || sanitizedValue.length > 4) return;
    setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], [moduleId]: sanitizedValue } }));
  };

  const handleGradeBlur = (studentId, moduleId, value) => {
    if (isReadOnly) return;
    if (!value) return;
    const num = parseFloat(value.replace(',', '.'));
    if (!isNaN(num)) {
      const formattedGrade = num.toFixed(1);
      setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], [moduleId]: formattedGrade } }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveGrades(grades);
    setIsSaving(false);
  };

  const getGradeStyle = (grade) => {
    let numericGrade;
    // ALTERADO: Lógica para extrair a nota final do objeto, se necessário
    if (typeof grade === 'object' && grade !== null && grade.hasOwnProperty('finalGrade')) {
      numericGrade = parseFloat(grade.finalGrade);
    } else {
      numericGrade = parseFloat(grade);
    }

    if (isNaN(numericGrade)) return "bg-white";
    if (numericGrade >= 7) return "bg-green-100 text-green-800 font-bold";
    return "bg-red-100 text-red-800 font-bold";
  };
  
  if (!students || students.length === 0) {
    return ( <div className="bg-white rounded-lg shadow p-6 mt-4 text-center"> <p className="text-gray-500">Importe alunos para poder lançar as notas.</p> </div> );
  }

  return (
    <div className="mt-4">
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-800 uppercase bg-gray-100 border-b-2">
            <tr>
              <th scope="col" className="px-4 py-2 font-bold w-24">Código</th>
              <th scope="col" className="px-4 py-2 font-bold w-64">Aluno(a)</th>
              {modules.map(module => ( <th key={module.id} scope="col" className="px-2 py-2 text-center font-bold w-32">{module.title}</th> ))}
              {isUserAdmin && <th scope="col" className="px-4 py-2 font-bold text-center w-28">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="bg-white border-b hover:bg-blue-50">
                <td className="px-4 py-2 font-mono text-gray-500">{student.code}</td>
                <th scope="row" className="px-4 py-2 font-bold text-gray-900">{student.name}</th>
                
                {/* ALTERAÇÃO PRINCIPAL: LÓGICA CONDICIONAL PARA RENDERIZAÇÃO DA CÉLULA */}
                {modules.map(module => {
                  const gradeValue = grades[student.id]?.[module.id];

                  if (module.subGrades) {
                    // Módulo especial com sub-notas
                    const finalGrade = gradeValue?.finalGrade ? formatGradeOnLoad(gradeValue.finalGrade) : '-';
                    const cellStyle = getGradeStyle(finalGrade);
                    return (
                      <td key={module.id} className="p-1 text-center">
                        <button
                          onClick={() => onOpenSubGradesModal(student, module)}
                          disabled={isReadOnly}
                          className={`w-20 h-10 flex items-center justify-center gap-2 border rounded-md p-2 mx-auto disabled:cursor-not-allowed disabled:bg-gray-100 transition-colors ${cellStyle}`}
                        >
                          <span>{finalGrade}</span>
                          {!isReadOnly && <Pencil size={12} />}
                        </button>
                      </td>
                    );
                  } else {
                    // Módulo normal (lógica antiga)
                    const cellStyle = getGradeStyle(gradeValue);
                    return (
                      <td key={module.id} className={`p-1 text-center transition-colors ${!isReadOnly ? cellStyle : ''}`}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={gradeValue || ''}
                          onChange={(e) => handleGradeChange(student.id, module.id, e.target.value)}
                          onBlur={(e) => handleGradeBlur(student.id, module.id, e.target.value)}
                          disabled={isReadOnly}
                          className={`w-16 text-center border-none rounded-md p-2 mx-auto block ${ isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : `bg-transparent focus:ring-2 focus:ring-blue-500 ${cellStyle}` }`}
                          placeholder="-"
                        />
                      </td>
                    );
                  }
                })}
                {isUserAdmin && ( <td className="px-4 py-2 text-center"> <button onClick={() => onTransferClick(student)} className="font-medium text-blue-600 hover:underline">Transferir</button> </td> )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {!isReadOnly && (
        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait transition shadow-lg">
            {isSaving ? 'A salvar...' : 'Salvar Todas as Notas'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Gradebook;