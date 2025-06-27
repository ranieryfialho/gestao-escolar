import React, { useState, useEffect } from 'react';

function MapaClassModal({ isOpen, onClose, onSave, instructors }) {
  const roomOptions = ["Lab 01", "Lab 02", "Lab 03", "EAD"];
  const scheduleOptions = ["07:30 as 09:20", "09:30 as 11:20", "11:30 as 13:20", "13:30 as 15:20", "15:30 as 17:20", "19:00 as 21:20"];
  const dayOptions = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  const initialFormData = {
    nome_turma: '',
    tipo: 'TB',
    instrutor: '',
    sala: roomOptions[0],
    horario: scheduleOptions[0],
    dia_semana: dayOptions[0],
  };
  
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome_turma.trim()) {
      alert("O nome da turma é obrigatório.");
      return;
    }
    onSave({ ...formData, modulo_atual: formData.tipo, proximo_modulo: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-6">Adicionar Curso Extra / TB</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input name="nome_turma" value={formData.nome_turma} onChange={handleChange} placeholder="Nome do Curso/Turma" className="w-full px-3 py-2 border rounded-lg" required />
          
          <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
            <option value="TB">TB (Treinamento Básico)</option>
            <option value="Curso Extra">Curso Extra</option>
          </select>
          
          <select name="dia_semana" value={formData.dia_semana} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
            {dayOptions.map(day => ( <option key={day} value={day}>{day}</option> ))}
          </select>
          
          <select name="instrutor" value={formData.instrutor} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
            <option value="" disabled>Selecione um instrutor</option>
            {instructors && instructors.map(teacher => ( <option key={teacher.id} value={teacher.name}>{teacher.name}</option> ))}
          </select>
          
          <select name="sala" value={formData.sala} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
            {roomOptions.map(room => ( <option key={room} value={room}>{room}</option>))}
          </select>
          
          <select name="horario" value={formData.horario} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-white">
            {scheduleOptions.map(schedule => ( <option key={schedule} value={schedule}>{schedule}</option>))}
          </select>
          
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

export default MapaClassModal;