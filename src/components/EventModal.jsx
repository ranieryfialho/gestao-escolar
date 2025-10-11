import React, { useState, useEffect, useMemo } from 'react';
import { db, storage } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, Upload, Calendar, Clock, MapPin, User, FileText, Image, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { useUsers } from '../contexts/UserContext';
import toast from 'react-hot-toast';

const EventModal = ({ isOpen, onClose, event }) => {
  const { users } = useUsers();

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    lab: '',
    responsible: '',
    observations: '',
    imageUrl: '',
    registrationOpen: true, // Novo campo
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [responsibleInput, setResponsibleInput] = useState('');

  const teacherUsers = useMemo(() => {
    return users.filter(user =>
      ['professor', 'coordenador', 'diretor', 'auxiliar_coordenacao'].includes(user.role)
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (responsibleInput) {
      const filtered = teacherUsers.filter(user =>
        user.name.toLowerCase().includes(responsibleInput.toLowerCase()) ||
        user.email.toLowerCase().includes(responsibleInput.toLowerCase())
      );
      return filtered.slice(0, 5);
    }
    return teacherUsers.slice(0, 5);
  }, [responsibleInput, teacherUsers]);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        date: event.date || '',
        startTime: event.startTime || event.time || '',
        endTime: event.endTime || '',
        lab: event.lab || '',
        responsible: event.responsible || '',
        observations: event.observations || '',
        imageUrl: event.imageUrl || '',
        registrationOpen: event.registrationOpen !== false,
      });
      setResponsibleInput(event.responsible || '');
      if (event.imageUrl) {
        setImagePreview(event.imageUrl);
      }
    } else {
      resetForm();
    }
  }, [event, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      startTime: '',
      endTime: '',
      lab: '',
      responsible: '',
      observations: '',
      imageUrl: '',
      registrationOpen: true,
    });
    setResponsibleInput('');
    setImageFile(null);
    setImagePreview(null);
    setShowUserDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResponsibleChange = (e) => {
    setResponsibleInput(e.target.value);
    setFormData(prev => ({ ...prev, responsible: e.target.value }));
    setShowUserDropdown(true);
  };

  const handleUserSelect = (user) => {
    setResponsibleInput(user.name);
    setFormData(prev => ({ ...prev, responsible: user.name }));
    setShowUserDropdown(false);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.date || !formData.startTime || !formData.endTime || !formData.lab || !formData.responsible) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsUploading(true);

    try {
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${imageFile.name}`;
        const imageRef = ref(storage, `events/${fileName}`);

        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const eventData = {
        ...formData,
        imageUrl,
        updatedAt: serverTimestamp(),
      };

      if (!event) {
        eventData.createdAt = serverTimestamp();
      }

      const eventId = event ? event.id : `evt_${Date.now()}`;
      await setDoc(doc(db, 'events', eventId), eventData, { merge: true });

      toast.success(event ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{event ? 'Editar Evento' : 'Criar Novo Evento'}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="flex items-center gap-2 text-gray-700 font-semibold mb-2"><FileText size={16} /> Nome do Evento</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="flex items-center gap-2 text-gray-700 font-semibold mb-2"><Calendar size={16} /> Data</label>
                  <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label htmlFor="lab" className="flex items-center gap-2 text-gray-700 font-semibold mb-2"><MapPin size={16} /> Laboratório</label>
                  <select id="lab" name="lab" value={formData.lab} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-white" required>
                    <option value="">Selecione</option>
                    <option value="Lab 1">Lab 1</option>
                    <option value="Lab 2">Lab 2</option>
                    <option value="Lab 3">Lab 3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="flex items-center gap-2 text-gray-700 font-semibold mb-2"><Clock size={16} /> Horário de Início</label>
                  <input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label htmlFor="endTime" className="flex items-center gap-2 text-gray-700 font-semibold mb-2"><Clock size={16} /> Horário de Fim</label>
                  <input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" required />
                </div>
              </div>

              <div className="relative">
                <label htmlFor="responsible" className="flex items-center gap-2 text-gray-700 font-semibold mb-2"><User size={16} /> Responsável</label>
                <input type="text" id="responsible" name="responsible" value={responsibleInput} onChange={handleResponsibleChange} onFocus={() => setShowUserDropdown(true)} onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)} className="w-full p-3 border border-gray-300 rounded-lg" required />
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredUsers.map(user => (
                      <div key={user.id} onMouseDown={() => handleUserSelect(user)} className="p-3 hover:bg-gray-100 cursor-pointer">{user.name}</div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  Status das Inscrições
                </label>
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setFormData(prev => ({ ...prev, registrationOpen: !prev.registrationOpen }))}
                >
                  {formData.registrationOpen ? (
                    <ToggleRight size={36} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={36} className="text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {formData.registrationOpen ? 'Abertas' : 'Fechadas'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formData.registrationOpen ? 'Alunos podem se inscrever.' : 'Novas inscrições estão bloqueadas.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="observations" className="flex items-center gap-2 text-gray-700 font-semibold mb-2"><FileText size={16} /> Observações</label>
                <textarea id="observations" name="observations" value={formData.observations} onChange={handleChange} rows="5" className="w-full p-3 border border-gray-300 rounded-lg"></textarea>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2"><Image size={16} /> Imagem do Evento</label>
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-auto object-contain rounded-md" />
                    ) : (
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Carregar um arquivo</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button type="button" onClick={handleClose} className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isUploading} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300">
              {isUploading ? 'Salvando...' : (event ? 'Salvar Alterações' : 'Criar Evento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;