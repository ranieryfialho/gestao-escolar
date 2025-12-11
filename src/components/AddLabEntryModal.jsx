import { useState, useEffect } from 'react';
import { Check, Repeat, Clock, UserPlus, ToggleLeft, ToggleRight, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAvailableTimeSlotsForDate, hasAvailableSlots, getWeekdayName } from '../utils/labScheduleConfig';

const activityOptions = [
  "Digitação", "Currículo", "Hora Livre", "Segunda Chamada de Prova", "Reposição de Aula", "Reforço de Aula"
];

const moduleOptions = [
  "ICN", "WORD", "EXCEL", "POWERPOINT", "ADM", "POWERBI", "PHOTOSHOP", "ILLUSTRATOR"
];

const conditionalActivities = [
  "Segunda Chamada de Prova", "Reposição de Aula", "Reforço de Aula"
];

function AddLabEntryModal({ isOpen, onClose, onSave, allStudentsMap, selectedDate }) {
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

  // Data local do modal (pode ser diferente da data da página principal)
  const [modalDate, setModalDate] = useState(selectedDate);

  // Horários disponíveis baseados na data selecionada
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [weekdayName, setWeekdayName] = useState('');
  const [hasSlots, setHasSlots] = useState(true);

  // Sincroniza a data do modal quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setModalDate(selectedDate);
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    if (modalDate) {
      const slots = getAvailableTimeSlotsForDate(modalDate);
      const dayName = getWeekdayName(modalDate);
      const hasSlotsAvailable = hasAvailableSlots(modalDate);
      
      setAvailableTimeSlots(slots);
      setWeekdayName(dayName);
      setHasSlots(hasSlotsAvailable);
      
      // Limpar horários selecionados se não estiverem mais disponíveis
      setSelectedTimes(prevTimes => 
        prevTimes.filter(time => slots.includes(time))
      );
    }
  }, [modalDate]);

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
    setModalDate(selectedDate);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!hasSlots) {
      toast.error("Não há horários disponíveis para esta data.");
      return;
    }

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

    // Passa a data do modal para a função onSave
    onSave(entryData, repeatWeekly ? repeatWeeks : 1, modalDate);
    clearForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Adicionar Atendimento ao Laboratório</h2>
        
        {/* Seletor de data no modal */}
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label htmlFor="modal-date" className="font-semibold text-gray-700 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Data do Atendimento:
            </label>
            <input
              id="modal-date"
              type="date"
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 rounded-lg">
              <span className="text-sm font-semibold text-blue-800">
                {weekdayName}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(modalDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Alerta se não houver horários disponíveis */}
        {!hasSlots && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-red-800">Sem atendimentos neste dia</p>
              <p className="text-sm text-red-700 mt-1">
                Não há horários disponíveis para {weekdayName}. Por favor, selecione outra data.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-gray-700">Código do Aluno</label>
              <input 
                id="studentCode" 
                type="text" 
                value={studentCode} 
                onChange={(e) => setStudentCode(e.target.value)} 
                placeholder="Digite o código para buscar" 
                className="w-full px-3 py-2 border rounded-lg mt-1"
                disabled={!hasSlots}
              />
            </div>
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Nome do Aluno / Visitante</label>
              <input 
                id="studentName" 
                type="text" 
                value={studentName} 
                onChange={(e) => setStudentName(e.target.value)} 
                placeholder="Preenchido automaticamente ou digite" 
                disabled={!isVisitor || !hasSlots} 
                className="w-full px-3 py-2 border rounded-lg mt-1 disabled:bg-gray-100"
              />
            </div>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               <Clock size={14} className="inline mr-1"/> Horários do Atendimento
             </label>
             
             {hasSlots ? (
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 p-4 border rounded-lg bg-gray-50">
                 {availableTimeSlots.map(time => (
                     <div key={time} className="flex items-center">
                         <input
                             type="checkbox"
                             id={`time-${time}`}
                             checked={selectedTimes.includes(time)}
                             onChange={() => handleTimeChange(time)}
                             className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                         />
                         <label htmlFor={`time-${time}`} className="ml-2 text-sm text-gray-700 font-medium cursor-pointer">
                           {time}
                         </label>
                     </div>
                 ))}
               </div>
             ) : (
               <div className="p-4 border rounded-lg bg-gray-100 text-center text-gray-500">
                 <p className="text-sm">Nenhum horário disponível para esta data</p>
               </div>
             )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700">Atividade</label>
              <select 
                id="activity" 
                value={activity} 
                onChange={(e) => setActivity(e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg mt-1"
                disabled={!hasSlots}
              >
                {activityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {conditionalActivities.includes(activity) && (
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Módulo / Matéria</label>
                <select 
                  id="subject" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-lg mt-1"
                  disabled={!hasSlots}
                >
                  {moduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="observation" className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea 
              id="observation" 
              value={observation} 
              onChange={(e) => setObservation(e.target.value)} 
              rows="2" 
              className="w-full px-3 py-2 border rounded-lg mt-1"
              disabled={!hasSlots}
            />
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsNewStudent(!isNewStudent)}
                disabled={!hasSlots}
                className={`flex items-center cursor-pointer transition-colors duration-200 ease-in-out ${
                  isNewStudent ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                    <input 
                      type="checkbox" 
                      id="repeat" 
                      checked={repeatWeekly} 
                      onChange={(e) => setRepeatWeekly(e.target.checked)} 
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={!hasSlots}
                    />
                    <label htmlFor="repeat" className="ml-2 block text-sm font-medium text-gray-700">
                        <Repeat size={14} className="inline-block mr-1"/> Repetir semanalmente
                    </label>
                </div>
                {repeatWeekly && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="weeks" className="text-sm">Por</label>
                        <input 
                          type="number" 
                          id="weeks" 
                          value={repeatWeeks} 
                          onChange={(e) => setRepeatWeeks(Number(e.target.value))} 
                          className="w-20 px-2 py-1 border rounded-lg" 
                          min="1" 
                          max="12"
                          disabled={!hasSlots}
                        />
                        <span className="text-sm">semanas</span>
                    </div>
                )}
            </div>
            {repeatWeekly && (
              <p className="text-xs text-gray-500 mt-2">
                ℹ️ O atendimento será repetido no mesmo dia da semana ({weekdayName}) pelos horários selecionados
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => { onClose(); clearForm(); }} 
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!hasSlots}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Check size={18}/> Salvar Atendimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLabEntryModal;