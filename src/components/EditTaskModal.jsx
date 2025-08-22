import React, { useState, useEffect } from 'react';

function EditTaskModal({ isOpen, onClose, onSave, task, users }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAssigneeId(task.assigneeId || '');
      
      // Carrega a data, formatando-a corretamente para o input
      if (task.dueDate && task.dueDate.toDate) {
        const date = task.dueDate.toDate();
        // Formata a data para YYYY-MM-DD
        const formattedDate = date.toISOString().split('T')[0];
        setDueDate(formattedDate);
      } else {
        setDueDate('');
      }
    }
  }, [task]);

  const handleSave = () => {
    if (!title.trim() || !assigneeId) {
      alert('O título e o responsável são obrigatórios.');
      return;
    }
    
    const selectedUser = users.find(u => u.id === assigneeId);

    onSave(task.id, {
      title,
      description,
      assigneeId,
      assigneeName: selectedUser ? selectedUser.name : '',
      dueDate,
    });
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-6">Editar Tarefa</h2>
        <div className="space-y-4">
          {/* CAMPO DE TÍTULO ADICIONADO DE VOLTA */}
          <div>
            <label htmlFor="edit-task-title" className="block text-sm font-medium text-gray-700">Título da Tarefa</label>
            <input
              type="text"
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          {/* CAMPO DE DESCRIÇÃO ADICIONADO DE VOLTA */}
          <div>
            <label htmlFor="edit-task-description" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
            <textarea
              id="edit-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-task-assignee" className="block text-sm font-medium text-gray-700">Atribuir para:</label>
              <select
                id="edit-task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="" disabled>Selecione um responsável...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-task-dueDate" className="block text-sm font-medium text-gray-700">Prazo de Entrega (Opcional)</label>
              <input
                type="date"
                id="edit-task-dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditTaskModal;