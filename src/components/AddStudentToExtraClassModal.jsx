import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

function AddStudentToExtraClassModal({ isOpen, onClose, onSave, allStudentsMap }) {
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isStudentFound, setIsStudentFound] = useState(false);
  const [foundStudentData, setFoundStudentData] = useState(null);

  useEffect(() => {
    if (studentCode.trim()) {
      const studentData = allStudentsMap.get(studentCode.trim());
      if (studentData) {
        setStudentName(studentData.name);
        setIsStudentFound(true);
        setFoundStudentData(studentData);
      } else {
        setIsStudentFound(false);
        setFoundStudentData(null);
      }
    } else {
      setIsStudentFound(false);
      setFoundStudentData(null);
    }
  }, [studentCode, allStudentsMap]);

  const clearForm = () => {
    setStudentCode('');
    setStudentName('');
    setIsStudentFound(false);
    setFoundStudentData(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast.error("O Nome do Aluno é obrigatório.");
      return;
    }

    let entryData = {};

    if (isStudentFound && foundStudentData) {
      entryData = {
        studentId: foundStudentData.id,
        name: foundStudentData.name,
        code: foundStudentData.code,
      };
    } else {
      entryData = {
        name: studentName,
        code: studentCode.trim() || `VISITANTE_${Date.now()}`,
      };
    }
    
    onSave(entryData);
    clearForm();
  };
  
  const handleClose = () => {
    clearForm();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 relative">
        <button onClick={handleClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"><X size={24} /></button>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Adicionar Aluno à Turma</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-gray-700">Matrícula do Aluno (Opcional)</label>
              <input 
                id="studentCode" 
                type="text" 
                value={studentCode} 
                onChange={(e) => setStudentCode(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg mt-1" 
                placeholder="Digite a matrícula para buscar um aluno existente"
              />
            </div>
            
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Nome do Aluno</label>
              <input 
                id="studentName" 
                type="text" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                disabled={isStudentFound}
                className={`w-full px-3 py-2 border rounded-lg mt-1 ${isStudentFound ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
                placeholder="Digite o nome do aluno ou visitante"
              />
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={handleClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                <Save size={18} /> Salvar Aluno
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddStudentToExtraClassModal;