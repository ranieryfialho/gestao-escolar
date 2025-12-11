import React, { useState, useEffect } from 'react';

function AddTaskModal({ isOpen, onClose, onSave, users }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen && users && users.length === 1) {
      setAssigneeId(users[0].id);
    }
  }, [isOpen, users]);

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setDueDate('');
    onClose();
  };

  const handleSave = () => {
    if (!title.trim() || !assigneeId) {
      alert('O título e o responsável são obrigatórios.');
      return;
    }
    onSave({ title, description, assigneeId, dueDate });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-6">Adicionar Nova Tarefa</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">Título da Tarefa</label>
            <input
              type="text"
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="task-assignee" className="block text-sm font-medium text-gray-700">Atribuir para:</label>
                <select
                  id="task-assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={users && users.length === 1}
                  className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md ${
                    users && users.length === 1 ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="" disabled>Selecione um responsável...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
            </div>
            <div>
                <label htmlFor="task-dueDate" className="block text-sm font-medium text-gray-700">Prazo de Entrega (Opcional)</label>
                <input
                  type="date"
                  id="task-dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Salvar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTaskModal;