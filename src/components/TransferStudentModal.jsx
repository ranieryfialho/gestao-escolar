import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

function TransferStudentModal({ isOpen, onClose, student, currentClass, allClasses, onConfirmTransfer }) {
  const [targetClassId, setTargetClassId] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {
    if (isOpen && allClasses && currentClass) {
      const otherClasses = allClasses.filter(c => c.id !== currentClass.id);
      
      const sortedClasses = otherClasses.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      
      const options = [
        { id: 'concludentes', name: '✅ MOVER PARA CONCLUDENTES' },
        ...sortedClasses
      ];
      
      setAvailableClasses(options);
      
      if (options.length > 0) {
        setTargetClassId('concludentes');
      }
    }
  }, [isOpen, allClasses, currentClass]);

  const handleConfirm = () => {
    if (!targetClassId) {
      toast.error('Por favor, selecione uma turma de destino.');
      return;
    }
    onConfirmTransfer(student, currentClass.id, targetClassId);
  };

  if (!isOpen || !student || !currentClass) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg animate-slide-up">
        <h2 className="text-xl font-bold mb-2">Transferir ou Concluir Aluno(a)</h2>
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              {availableClasses.length > 0 ? (
                availableClasses.map(c => (
                  <option 
                    key={c.id} 
                    value={c.id}
                    className={c.id === 'concludentes' ? 'font-bold text-green-700' : ''}
                  >
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
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!targetClassId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-bold transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferStudentModal;