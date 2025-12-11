import { useState } from 'react';
import { Pencil, Trash2, CheckCircle2, Save, XCircle, UserPlus, Calendar, Clock } from 'lucide-react';
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
      studentName: entry.studentName,
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = months[date.getMonth()];
    return `${day} de ${month}`;
  };

  const formatTimeSlots = (slots) => {
    if (Array.isArray(slots)) {
        return slots.join(', ');
    }
    return slots;
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Nenhum atendimento encontrado para esta data.</p>
      </div>
    );
  }

  const sortedEntries = [...entries].sort((a, b) => {
      const timeA = Array.isArray(a.timeSlot) ? a.timeSlot[0] : a.timeSlot;
      const timeB = Array.isArray(b.timeSlot) ? b.timeSlot[0] : b.timeSlot;
      if (!timeA || !timeB) return 0;
      return timeA.localeCompare(timeB);
  });

  return (
    <>
      {/* VERSÃO DESKTOP - TABELA */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-center w-20">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</span>
              </th>
              <th className="px-3 py-3 text-left whitespace-nowrap">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Data</span>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Horário(s)</span>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Aluno(a)</span>
              </th>
              <th className="px-3 py-3 text-left whitespace-nowrap">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Turma</span>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Atividade / Matéria</span>
              </th>
              <th className="px-3 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Observações</span>
              </th>
              <th className="px-3 py-3 text-left whitespace-nowrap">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Adicionado por</span>
              </th>
              <th className="px-3 py-3 text-center w-24">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry) => (
                editingRowId === entry.id ? (
                  // LINHA DE EDIÇÃO
                  <tr key={entry.id} className="bg-yellow-50 border-b border-yellow-200">
                    <td className="px-3 py-4 text-center">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                        <Calendar size={16} className="text-blue-500 flex-shrink-0" />
                        <span className="font-medium">{formatDateShort(entry.entryDate)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="grid grid-cols-2 gap-2 max-w-md">
                          {timeSlotOptions.map(time => (
                              <label 
                                key={time} 
                                className="flex items-center gap-2 p-2 bg-white rounded border border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
                              >
                                  <input
                                      type="checkbox"
                                      checked={editFormData.timeSlot.includes(time)}
                                      onChange={() => handleEditTimeChange(time)}
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                                  />
                                  <span className="text-xs font-mono whitespace-nowrap">{time}</span>
                              </label>
                          ))}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <input
                        type="text"
                        name="studentName"
                        value={editFormData.studentName}
                        onChange={handleEditFormChange}
                        disabled={entry.studentCode !== 'VISITANTE'}
                        className={`w-full min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${entry.studentCode !== 'VISITANTE' ? 'bg-gray-100 text-gray-500' : ''}`}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-sm text-gray-600 whitespace-nowrap">{entry.studentClassName}</span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-2 min-w-[180px]">
                          <select 
                            name="activity" 
                            value={editFormData.activity} 
                            onChange={handleEditFormChange} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                              {activityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          {conditionalActivities.includes(editFormData.activity) && (
                              <select 
                                name="subject" 
                                value={editFormData.subject} 
                                onChange={handleEditFormChange} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                  {moduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                          )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <input 
                        type="text" 
                        name="observation" 
                        value={editFormData.observation} 
                        onChange={handleEditFormChange} 
                        className="w-full min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleUpdateSubmit(entry.id)} 
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition flex-shrink-0"
                          title="Salvar"
                        >
                          <Save size={18} />
                        </button>
                        <button 
                          onClick={handleCancelEdit} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                          title="Cancelar"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // LINHA NORMAL
                  <tr 
                    key={entry.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-3 py-4 text-center">
                      <button 
                        onClick={() => onStatusChange(entry.id, !entry.isDone)} 
                        className="inline-flex items-center justify-center transition hover:scale-110"
                        title={entry.isDone ? "Marcar como não realizado" : "Marcar como realizado"}
                      >
                        <CheckCircle2 
                          size={24} 
                          className={entry.isDone ? 'text-green-500' : 'text-gray-300 hover:text-green-400'} 
                        />
                      </button>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Calendar size={14} className="text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-blue-600">{formatDateShort(entry.entryDate)}</span>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(entry.entryDate + 'T00:00:00').getFullYear()}</span>
                      </div>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-xs break-words">{formatTimeSlots(entry.timeSlot)}</span>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 break-words">{entry.studentName}</div>
                          {entry.studentCode && entry.studentCode !== 'VISITANTE' && (
                            <div className="text-xs text-gray-500">Mat: {entry.studentCode}</div>
                          )}
                        </div>
                        {entry.isNewStudent && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0">
                            <UserPlus size={10} />
                            Novo(a)
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 py-4">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded whitespace-nowrap">
                        {entry.studentClassName}
                      </span>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-700">
                        {entry.subject ? (
                          <div>
                            <div className="font-medium break-words">{entry.activity}</div>
                            <div className="text-xs text-gray-500">({entry.subject})</div>
                          </div>
                        ) : (
                          <div className="font-medium break-words">{entry.activity}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-600 max-w-xs break-words">
                        {entry.observation || <span className="text-gray-400 italic">Sem observações</span>}
                      </div>
                    </td>
                    
                    <td className="px-3 py-4">
                      {entry.createdByName ? (
                          <div className="text-sm">
                              <div className="font-medium text-gray-900 break-words">{entry.createdByName}</div>
                              <div className="text-xs text-gray-500 capitalize">
                                  {(entry.createdByRole || '').replace(/_/g, ' ')}
                              </div>
                          </div>
                      ) : (
                          <span className="text-gray-400">-</span>
                      )}
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(entry)} 
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex-shrink-0"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => onEntryDelete(entry.id)} 
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                          title="Excluir"
                        >
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

      {/* VERSÃO MOBILE/TABLET - CARDS */}
      <div className="lg:hidden space-y-4">
        {sortedEntries.map((entry) => (
          editingRowId === entry.id ? (
            // CARD DE EDIÇÃO
            <div key={entry.id} className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 shadow-md">
              <div className="space-y-4">
                {/* Data */}
                <div className="flex items-center gap-2 text-sm text-gray-700 pb-3 border-b border-yellow-200">
                  <Calendar size={16} className="text-blue-500" />
                  <span className="font-medium">{formatDateShort(entry.entryDate)}</span>
                </div>

                {/* Horários */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Horários</label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlotOptions.map(time => (
                      <label 
                        key={time} 
                        className="flex items-center gap-2 p-2 bg-white rounded border border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={editFormData.timeSlot.includes(time)}
                          onChange={() => handleEditTimeChange(time)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs font-mono">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nome do Aluno */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Aluno(a)</label>
                  <input
                    type="text"
                    name="studentName"
                    value={editFormData.studentName}
                    onChange={handleEditFormChange}
                    disabled={entry.studentCode !== 'VISITANTE'}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${entry.studentCode !== 'VISITANTE' ? 'bg-gray-100 text-gray-500' : ''}`}
                  />
                  <div className="text-xs text-gray-500 mt-1">Turma: {entry.studentClassName}</div>
                </div>

                {/* Atividade */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Atividade / Matéria</label>
                  <div className="space-y-2">
                    <select 
                      name="activity" 
                      value={editFormData.activity} 
                      onChange={handleEditFormChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {activityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {conditionalActivities.includes(editFormData.activity) && (
                      <select 
                        name="subject" 
                        value={editFormData.subject} 
                        onChange={handleEditFormChange} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {moduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Observações</label>
                  <input 
                    type="text" 
                    name="observation" 
                    value={editFormData.observation} 
                    onChange={handleEditFormChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handleUpdateSubmit(entry.id)} 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    <Save size={18} />
                    Salvar
                  </button>
                  <button 
                    onClick={handleCancelEdit} 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    <XCircle size={18} />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // CARD NORMAL
            <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              {/* Header com Status e Data */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onStatusChange(entry.id, !entry.isDone)} 
                    className="inline-flex items-center justify-center transition hover:scale-110"
                    title={entry.isDone ? "Marcar como não realizado" : "Marcar como realizado"}
                  >
                    <CheckCircle2 
                      size={28} 
                      className={entry.isDone ? 'text-green-500' : 'text-gray-300 hover:text-green-400'} 
                    />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-sm font-semibold text-blue-600">{formatDateShort(entry.entryDate)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(entry.entryDate + 'T00:00:00').getFullYear()}</span>
                  </div>
                </div>
                
                {/* Ações */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(entry)} 
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => onEntryDelete(entry.id)} 
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Horários */}
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-gray-400" />
                  <span className="font-semibold text-gray-600 text-xs uppercase">Horário(s):</span>
                  <span className="font-mono text-xs text-gray-700">{formatTimeSlots(entry.timeSlot)}</span>
                </div>
              </div>

              {/* Aluno */}
              <div className="mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Aluno(a)</div>
                    <div className="font-semibold text-gray-900 break-words">{entry.studentName}</div>
                    {entry.studentCode && entry.studentCode !== 'VISITANTE' && (
                      <div className="text-xs text-gray-500">Mat: {entry.studentCode}</div>
                    )}
                  </div>
                  {entry.isNewStudent && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full whitespace-nowrap">
                      <UserPlus size={10} />
                      Novo(a)
                    </span>
                  )}
                </div>
              </div>

              {/* Turma */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Turma</div>
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  {entry.studentClassName}
                </span>
              </div>

              {/* Atividade */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Atividade / Matéria</div>
                <div className="text-sm text-gray-700">
                  {entry.subject ? (
                    <div>
                      <div className="font-medium">{entry.activity}</div>
                      <div className="text-xs text-gray-500">({entry.subject})</div>
                    </div>
                  ) : (
                    <div className="font-medium">{entry.activity}</div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {entry.observation && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Observações</div>
                  <div className="text-sm text-gray-600 break-words">{entry.observation}</div>
                </div>
              )}

              {/* Adicionado por */}
              {entry.createdByName && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Adicionado por</div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{entry.createdByName}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {(entry.createdByRole || '').replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        ))}
      </div>
    </>
  );
}

export default LabEntriesTable;