import { useState } from 'react';
import { Pencil, Trash2, CheckCircle2, Save, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const activityOptions = [
  "Digitação", "Currículo", "Segunda Chamada de Prova", "Reposição de Aula", "Reforço de Aula"
];
const moduleOptions = [
  "ICN", "WORD", "EXCEL", "POWERPOINT", "ADM", "POWERBI", "PHOTOSHOP", "ILLUSTRATOR"
];
const conditionalActivities = [
  "Segunda Chamada de Prova", "Reposição de Aula", "Reforço de Aula"
];

const timeSlotOptions = [
    "07:30 - 08:30", "08:30 - 09:30", "09:30 - 10:30", "10:30 - 11:30",
    "13:30 - 14:30", "14:30 - 15:30", "15:30 - 16:30", "16:30 - 17:30"
];

function LabEntriesTable({ entries, onStatusChange, onEntryUpdate, onEntryDelete }) {
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleEditClick = (entry) => {
    setEditingRowId(entry.id);
    const times = Array.isArray(entry.timeSlot) ? entry.timeSlot : (entry.timeSlot ? [entry.timeSlot] : []);
    
    setEditFormData({
      studentName: entry.studentName, // Adicionado para edição
      activity: entry.activity,
      subject: entry.subject || moduleOptions[0],
      observation: entry.observation,
      timeSlot: times
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditTimeChange = (time) => {
    setEditFormData(prev => {
        const currentTimes = prev.timeSlot || [];
        const newTimes = currentTimes.includes(time)
            ? currentTimes.filter(t => t !== time)
            : [...currentTimes, time];
        return { ...prev, timeSlot: newTimes.sort() };
    });
  };

  const handleUpdateSubmit = (entryId) => {
    if (editFormData.timeSlot.length === 0) {
        toast.error("É necessário selecionar pelo menos um horário.");
        return;
    }
    if (!editFormData.studentName) {
        toast.error("O nome do aluno não pode ficar em branco.");
        return;
    }

    const finalData = {
        ...editFormData,
        subject: conditionalActivities.includes(editFormData.activity) ? editFormData.subject : null
    };

    onEntryUpdate(entryId, finalData);
    setEditingRowId(null);
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Nenhum atendimento encontrado para esta data.</p>
      </div>
    );
  }

  const formatTimeSlots = (slots) => {
    if (Array.isArray(slots)) {
        return slots.join(', ');
    }
    return slots;
  }
  
  const sortedEntries = [...entries].sort((a, b) => {
      const timeA = Array.isArray(a.timeSlot) ? a.timeSlot[0] : a.timeSlot;
      const timeB = Array.isArray(b.timeSlot) ? b.timeSlot[0] : b.timeSlot;
      if (!timeA || !timeB) return 0;
      return timeA.localeCompare(timeB);
  });

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full table-auto text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-800 uppercase bg-gray-100 border-b-2">
          <tr>
            <th className="px-2 py-3 font-bold text-center">Status</th>
            <th className="px-4 py-3 font-bold">Horário(s)</th>
            <th className="px-4 py-3 font-bold">Aluno(a)</th>
            <th className="px-4 py-3 font-bold">Turma</th>
            <th className="px-4 py-3 font-bold">Atividade / Matéria</th>
            <th className="px-4 py-3 font-bold">Observações</th>
            <th className="px-4 py-3 font-bold text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry) => (
              editingRowId === entry.id ? (
                // Linha em modo de edição
                <tr key={entry.id} className="bg-yellow-50">
                  <td className="px-2 py-2 text-center">-</td>
                  <td className="px-4 py-2">
                    <div className="grid grid-cols-2 gap-2">
                        {timeSlotOptions.map(time => (
                            <div key={time} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`edit-time-${entry.id}-${time}`}
                                    checked={editFormData.timeSlot.includes(time)}
                                    onChange={() => handleEditTimeChange(time)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor={`edit-time-${entry.id}-${time}`} className="ml-2 text-xs">{time}</label>
                            </div>
                        ))}
                    </div>
                  </td>
                  {/* Campo de Nome agora editável */}
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      name="studentName"
                      value={editFormData.studentName}
                      onChange={handleEditFormChange}
                      // Habilitado apenas se for um visitante
                      disabled={entry.studentCode !== 'VISITANTE'}
                      className={`w-full p-1 border rounded ${entry.studentCode !== 'VISITANTE' ? 'bg-gray-100' : ''}`}
                    />
                  </td>
                  <td className="px-4 py-2 text-gray-600">{entry.studentClassName}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col gap-1">
                        <select name="activity" value={editFormData.activity} onChange={handleEditFormChange} className="w-full p-1 border rounded">
                            {activityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {conditionalActivities.includes(editFormData.activity) && (
                            <select name="subject" value={editFormData.subject} onChange={handleEditFormChange} className="w-full p-1 border rounded mt-1">
                                {moduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <input type="text" name="observation" value={editFormData.observation} onChange={handleEditFormChange} className="w-full p-1 border rounded" />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => handleUpdateSubmit(entry.id)} className="text-green-600 hover:text-green-800" title="Salvar">
                        <Save size={18} />
                      </button>
                      <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800" title="Cancelar">
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // Linha em modo de visualização
                <tr key={entry.id} className="bg-white border-b hover:bg-blue-50">
                  <td className="px-2 py-2 text-center">
                    <button onClick={() => onStatusChange(entry.id, !entry.isDone)} title={entry.isDone ? "Marcar como não realizado" : "Marcar como realizado"}>
                      <CheckCircle2 size={20} className={entry.isDone ? 'text-green-500' : 'text-gray-300 hover:text-green-400'} />
                    </button>
                  </td>
                  <td className="px-4 py-2 font-mono">{formatTimeSlots(entry.timeSlot)}</td>
                  <td className="px-4 py-2 font-bold text-gray-900">{entry.studentName}</td>
                  <td className="px-4 py-2 text-gray-600">{entry.studentClassName}</td>
                  <td className="px-4 py-2">
                    {entry.subject ? `${entry.activity} (${entry.subject})` : entry.activity}
                  </td>
                  <td className="px-4 py-2">{entry.observation}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center items-center gap-4">
                      <button onClick={() => handleEditClick(entry)} className="text-gray-500 hover:text-blue-600" title="Editar Atendimento">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => onEntryDelete(entry.id)} className="text-gray-500 hover:text-red-600" title="Excluir Atendimento">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default LabEntriesTable;