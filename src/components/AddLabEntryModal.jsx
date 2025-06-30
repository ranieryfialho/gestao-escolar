import { useState, useEffect } from 'react';

const activityOptions = [
  "Digitação", "Currículo", "Segunda Chamada de Prova", "Reposição de Aula", "Reforço de Aula"
];

const moduleOptions = [
  "ICN", "WORD", "EXCEL", "POWERPOINT", "ADM", "POWERBI", "PHOTOSHOP", "ILLUSTRATOR"
];

const conditionalActivities = [
  "Segunda Chamada de Prova", "Reposição de Aula", "Reforço de Aula"
];

function AddLabEntryModal({ isOpen, onClose, onSave, allStudentsMap }) {

  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClassName, setStudentClassName] = useState('');
  const [isStudentFound, setIsStudentFound] = useState(false);
  const [activity, setActivity] = useState(activityOptions[0]);
  const [subject, setSubject] = useState(moduleOptions[0]);
  const [isJustified, setIsJustified] = useState('Não');
  const [observation, setObservation] = useState('');
  const [timeSlot, setTimeSlot] = useState('08:30 - 09:30');

  useEffect(() => {
    if (studentCode) {
      const studentData = allStudentsMap.get(studentCode.trim());
      if (studentData) {
        setStudentName(studentData.name);
        setStudentClassName(studentData.className);
        setIsStudentFound(true);
      } else {
        setStudentName("Aluno não encontrado");
        setStudentClassName("");
        setIsStudentFound(false);
      }
    } else {
      setStudentName('');
      setStudentClassName('');
      setIsStudentFound(false);
    }
  }, [studentCode, allStudentsMap]);

  const clearForm = () => {
    setStudentCode('');
    setObservation('');
    setActivity(activityOptions[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isStudentFound) {
      alert("Por favor, insira um código de aluno válido.");
      return;
    }

    const entryData = {
        studentCode, 
        studentName,
        studentClassName,
        activity,
        subject: conditionalActivities.includes(activity) ? subject : null,
        isJustified,
        observation,
        timeSlot
    };

    onSave(entryData);
    clearForm();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl"> {/* Aumentei o tamanho do modal */}
        <h2 className="text-2xl font-bold mb-6">Adicionar Atendimento ao Laboratório</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-gray-700">Código do Aluno</label>
              <input id="studentCode" type="text" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} className="w-full px-3 py-2 border rounded-lg mt-1" />
            </div>
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Nome do Aluno</label>
              <input id="studentName" type="text" value={studentName} disabled className={`w-full px-3 py-2 border rounded-lg mt-1 bg-gray-100 ${isStudentFound ? 'text-black' : 'text-red-500'}`} />
            </div>
            <div>
              <label htmlFor="studentClassName" className="block text-sm font-medium text-gray-700">Turma</label>
              <input id="studentClassName" type="text" value={studentClassName} disabled className="w-full px-3 py-2 border rounded-lg mt-1 bg-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700">Atividade</label>
              <select id="activity" value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full px-3 py-2 border rounded-lg mt-1">
                {activityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {conditionalActivities.includes(activity) && (
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Módulo / Matéria</label>
                <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border rounded-lg mt-1">
                  {moduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700">Horário</label>
                <select id="timeSlot" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} className="w-full px-3 py-2 border rounded-lg mt-1">
                    <option>07:30 - 08:30</option>
                    <option>08:30 - 09:30</option>
                    <option>09:30 - 10:30</option>
                    <option>10:30 - 11:30</option>
                    <option>13:30 - 14:30</option>
                    <option>14:30 - 15:30</option>
                    <option>15:30 - 16:30</option>
                    <option>16:30 - 17:30</option>
                </select>
            </div>
            <div>
              <label htmlFor="isJustified" className="block text-sm font-medium text-gray-700">Falta Justificada?</label>
              <select id="isJustified" value={isJustified} onChange={(e) => setIsJustified(e.target.value)} className="w-full px-3 py-2 border rounded-lg mt-1">
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="observation" className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea id="observation" value={observation} onChange={(e) => setObservation(e.target.value)} rows="3" className="w-full px-3 py-2 border rounded-lg mt-1" />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => { onClose(); clearForm(); }} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Salvar Atendimento</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLabEntryModal;