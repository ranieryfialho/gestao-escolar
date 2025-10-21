import { useState, useEffect } from 'react';
import { Check, Repeat, Clock, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const activityOptions = [
  "Digitação", "Currículo", "Hora Livre", "Segunda Chamada de Prova", "Reposição de Aula", "Reforço de Aula"
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

function AddLabEntryModal({ isOpen, onClose, onSave, allStudentsMap }) {
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClassName, setStudentClassName] = useState('');
  const [isVisitor, setIsVisitor] = useState(true);

  const [activity, setActivity] = useState(activityOptions[0]);
  const [subject, setSubject] = useState(moduleOptions[0]);
  const [isJustified, setIsJustified] = useState('Não');
  const [observation, setObservation] = useState('');
  
  const [selectedTimes, setSelectedTimes] = useState([]);

  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  
  const [isNewStudent, setIsNewStudent] = useState(false);

  useEffect(() => {
    if (studentCode) {
      const studentData = allStudentsMap.get(studentCode);
      if (studentData) {
        setStudentName(studentData.name);
        setStudentClassName(studentData.className);
        setIsVisitor(false);
      } else {
        setStudentName('');
        setStudentClassName('');
        setIsVisitor(true);
      }
    } else {
        setStudentName('');
        setStudentClassName('');
        setIsVisitor(true);
    }
  }, [studentCode, allStudentsMap]);

  const handleTimeChange = (time) => {
    setSelectedTimes(prevTimes =>
      prevTimes.includes(time)
        ? prevTimes.filter(t => t !== time)
        : [...prevTimes, time]
    );
  };

  const clearForm = () => {
    setStudentCode('');
    setStudentName('');
    setActivity(activityOptions[0]);
    setSubject(moduleOptions[0]);
    setIsJustified('Não');
    setObservation('');
    setSelectedTimes([]);
    setRepeatWeekly(false);
    setRepeatWeeks(4);
    setIsNewStudent(false);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentCode && !studentName) {
      toast.error("Informe o código do aluno ou o nome do visitante.");
      return;
    }
    if (selectedTimes.length === 0) {
        toast.error("Selecione pelo menos um horário.");
        return;
    }

    const entryData = {
      studentCode: isVisitor ? "VISITANTE" : studentCode,
      studentName: studentName,
      studentClassName: isVisitor ? "Visitante" : studentClassName,
      activity,
      subject: conditionalActivities.includes(activity) ? subject : null,
      isJustified,
      observation,
      timeSlot: selectedTimes.sort(),
      isNewStudent: isNewStudent
    };

    onSave(entryData, repeatWeekly ? repeatWeeks : 1);
    clearForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-6">Adicionar Atendimento ao Laboratório</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-gray-700">Código do Aluno</label>
              <input id="studentCode" type="text" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} placeholder="Digite o código para buscar" className="w-full px-3 py-2 border rounded-lg mt-1" />
            </div>
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Nome do Aluno / Visitante</label>
              <input id="studentName" type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Preenchido automaticamente ou digite" disabled={!isVisitor} className={`w-full px-3 py-2 border rounded-lg mt-1 ${!isVisitor ? 'bg-gray-100' : ''}`} />
            </div>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2"><Clock size={14} className="inline mr-1"/> Horários do Atendimento</label>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 p-4 border rounded-lg">
                {timeSlotOptions.map(time => (
                    <div key={time} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`time-${time}`}
                            checked={selectedTimes.includes(time)}
                            onChange={() => handleTimeChange(time)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`time-${time}`} className="ml-2 text-sm text-gray-600">{time}</label>
                    </div>
                ))}
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
          
          <div>
            <label htmlFor="observation" className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea id="observation" value={observation} onChange={(e) => setObservation(e.target.value)} rows="2" className="w-full px-3 py-2 border rounded-lg mt-1" />
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsNewStudent(!isNewStudent)}
                className={`flex items-center cursor-pointer transition-colors duration-200 ease-in-out ${
                  isNewStudent ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'
                }`}
                aria-pressed={isNewStudent}
              >
                {isNewStudent ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
              <span className="ml-1 text-sm font-medium text-gray-700 flex items-center gap-1">
                <UserPlus size={14} className={isNewStudent ? "text-blue-600" : "text-gray-500"}/>
                Marcar como Aluno(a) Novo(a)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center gap-4">
                <div className="flex items-center">
                    <input type="checkbox" id="repeat" checked={repeatWeekly} onChange={(e) => setRepeatWeekly(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                    <label htmlFor="repeat" className="ml-2 block text-sm font-medium text-gray-700">
                        <Repeat size={14} className="inline-block mr-1"/> Repetir semanalmente
                    </label>
                </div>
                {repeatWeekly && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="weeks" className="text-sm">Por</label>
                        <input type="number" id="weeks" value={repeatWeeks} onChange={(e) => setRepeatWeeks(Number(e.target.value))} className="w-20 px-2 py-1 border rounded-lg" min="1" max="12" />
                        <span className="text-sm">semanas</span>
                    </div>
                )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => { onClose(); clearForm(); }} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <Check size={18}/> Salvar Atendimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLabEntryModal;