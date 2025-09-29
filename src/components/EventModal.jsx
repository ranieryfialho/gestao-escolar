import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, Upload, Calendar, Clock, MapPin, User, FileText, Image, ChevronDown } from 'lucide-react';
import { useUsers } from '../contexts/UserContext';
import toast from 'react-hot-toast';

const EventModal = ({ isOpen, onClose, event, onSave }) => {
  const { users } = useUsers(); // Hook para buscar usuários do contexto
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    lab: '',
    responsible: '',
    observations: '',
    imageUrl: '',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Estados para o campo responsável híbrido
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [responsibleInput, setResponsibleInput] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Filtrar usuários que podem ser professores/responsáveis
  const teacherUsers = users.filter(user => 
    ['professor', 'coordenador', 'diretor', 'auxiliar_coordenacao'].includes(user.role)
  );

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
      });
      setResponsibleInput(event.responsible || '');
      if (event.imageUrl) {
        setImagePreview(event.imageUrl);
      }
    } else {
      resetForm();
    }
  }, [event, isOpen]);

  // Filtrar usuários baseado no input
  useEffect(() => {
    if (responsibleInput) {
      const filtered = teacherUsers.filter(user =>
        user.name.toLowerCase().includes(responsibleInput.toLowerCase()) ||
        user.email.toLowerCase().includes(responsibleInput.toLowerCase())
      );
      setFilteredUsers(filtered.slice(0, 5)); // Limitar a 5 resultados
    } else {
      setFilteredUsers(teacherUsers.slice(0, 5));
    }
  }, [responsibleInput, teacherUsers]);

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
    const value = e.target.value;
    setResponsibleInput(value);
    setFormData(prev => ({ ...prev, responsible: value }));
    setShowUserDropdown(true);
  };

  const handleUserSelect = (user) => {
    setResponsibleInput(user.name);
    setFormData(prev => ({ ...prev, responsible: user.name }));
    setShowUserDropdown(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nome do evento é obrigatório');
      return false;
    }
    if (!formData.date) {
      toast.error('Data é obrigatória');
      return false;
    }
    if (!formData.startTime) {
      toast.error('Horário de início é obrigatório');
      return false;
    }
    if (formData.endTime && formData.startTime >= formData.endTime) {
      toast.error('Horário de término deve ser posterior ao horário de início');
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
      onSave();
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
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {event ? 'Editar Evento' : 'Novo Evento'}
              </h2>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna da Esquerda */}
            <div className="space-y-6">
              {/* Nome do Evento */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <FileText className="w-4 h-4" />
                  Nome do Evento *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Digite o nome do evento"
                  required
                />
              </div>

              {/* Data */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <Calendar className="w-4 h-4" />
                  Data *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                    <Clock className="w-4 h-4" />
                    Hora Início *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                    <Clock className="w-4 h-4" />
                    Hora Término
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Laboratório */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <MapPin className="w-4 h-4" />
                  Laboratório
                </label>
                <input
                  type="text"
                  name="lab"
                  value={formData.lab}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Ex: Lab 01, Lab 02, EAD"
                />
              </div>

              {/* Campo Responsável Híbrido */}
              <div className="relative">
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <User className="w-4 h-4" />
                  Responsável
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={responsibleInput}
                    onChange={handleResponsibleChange}
                    onFocus={() => setShowUserDropdown(true)}
                    onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Digite ou selecione um responsável"
                  />
                  <ChevronDown 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" 
                  />
                  
                  {/* Dropdown de usuários */}
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.role} • {user.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Opção para entrada manual */}
                      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-600">
                          💡 <strong>Dica:</strong> Digite qualquer nome para adicionar manualmente
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna da Direita */}
            <div className="space-y-6">
              {/* Upload de Imagem */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <Image className="w-4 h-4" />
                  Imagem do Evento
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {imagePreview ? (
                      <div className="space-y-3">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <p className="text-sm text-gray-600">Clique para alterar a imagem</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-gray-600">Clique para fazer upload</p>
                          <p className="text-sm text-gray-400">PNG, JPG até 5MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <FileText className="w-4 h-4" />
                  Observações
                </label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Adicione observações sobre o evento..."
                />
              </div>
            </div>
          </div>

          {/* Footer com botões */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                `Salvar Evento`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;