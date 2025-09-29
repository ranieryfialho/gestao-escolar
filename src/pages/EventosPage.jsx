// src/pages/EventosPage.jsx (VERSÃO CORRIGIDA E FINAL)

import React, { useState, useEffect } from 'react';
// 1. IMPORTAR O 'Link' PARA NAVEGAÇÃO E O ÍCONE 'Users'
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import EventModal from '../components/EventModal';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, User, Search, Filter, Users } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const EventosPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.responsible?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.lab?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(event => {
        if (!event.date) return false;
        const eventDate = new Date(event.date + 'T00:00:00');
        eventDate.setHours(0, 0, 0, 0);

        if (filterType === 'upcoming') {
          return eventDate >= today;
        } else if (filterType === 'past') {
          return eventDate < today;
        }
        return true;
      });
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, filterType]);

  const handleOpenModal = (event = null) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(false);
  };

  const handleSave = () => {
    // Apenas para fechar o modal
    handleCloseModal();
  };

  const handleDelete = async (event) => {
    if (window.confirm(`Tem certeza que deseja excluir o evento "${event.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'events', event.id));
        toast.success('Evento excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir evento');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não definida';
    return new Date(dateString).toLocaleDateString('pt-BR', { 
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (startTime, endTime) => {
    if (!startTime) return 'Horário não definido';
    return endTime ? `${startTime} - ${endTime}` : startTime;
  };

  const isEventUpcoming = (dateString) => {
    if (!dateString) return false;
    const eventDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <Toaster position="top-right" />
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestão de Eventos</h1>
            <p className="text-gray-600 mt-1">{events.length} evento(s) cadastrado(s)</p>
          </div>
          <button onClick={() => handleOpenModal()} className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            <Plus className="mr-2 w-5 h-5" />
            Novo Evento
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Buscar por nome, responsável ou laboratório..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"/>
              </div>
              <div className="relative lg:w-64">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white">
                  <option value="all">Todos os eventos</option>
                  <option value="upcoming">Próximos eventos</option>
                  <option value="past">Eventos passados</option>
                </select>
              </div>
            </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg shadow-sm"><p>Nenhum evento encontrado.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border-l-4 ${isEventUpcoming(event.date) ? 'border-green-500' : 'border-gray-300'}`}>
                {event.imageUrl && (
                  <div className="relative h-48"><img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover"/></div>
                )}
                <div className="p-6 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{event.name}</h3>
                  <div className="space-y-2 text-gray-600 text-sm mb-4 flex-grow">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{formatDate(event.date)}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{formatTime(event.startTime, event.endTime)}</span></div>
                    {event.lab && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{event.lab}</span></div>}
                    {event.responsible && <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>{event.responsible}</span></div>}
                  </div>
                   {event.observations && <p className="text-sm text-gray-500 italic mb-4 line-clamp-2">"{event.observations}"</p>}
                  
                   {/* ### 2. MUDANÇA PRINCIPAL AQUI ### */}
                   <div className="flex justify-end items-center gap-2 pt-4 border-t border-gray-100">
                      <Link to={`/eventos/${event.id}/inscritos`} className="flex-grow flex items-center justify-center gap-2 text-sm bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <Users className="w-4 h-4" />
                        Inscritos
                      </Link>
                      <button onClick={() => handleOpenModal(event)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(event)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        onSave={handleSave}
      />
    </div>
  );
};

export default EventosPage;