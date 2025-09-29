import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import EventModal from '../components/EventModal';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, User, Image as ImageIcon, Search, Filter } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const EventosPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, upcoming, past

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

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.responsible?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.lab?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo (todos, futuros, passados)
    if (filterType !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(event => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
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
    // O toast já é exibido no EventModal
  };

  const handleDelete = async (event) => {
    if (window.confirm(`Tem certeza que deseja excluir o evento "${event.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'events', event.id));
        toast.success('Evento excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        toast.error('Erro ao excluir evento');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não definida';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const formatTime = (startTime, endTime) => {
    if (!startTime) return 'Horário não definido';
    
    let timeString = startTime;
    if (endTime) {
      timeString += ` - ${endTime}`;
    }
    return timeString;
  };

  const isEventUpcoming = (dateString) => {
    if (!dateString) return false;
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-gray-600">Carregando eventos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                Gestão de Eventos
              </h1>
              <p className="text-gray-600 mt-1">
                {events.length} evento{events.length !== 1 ? 's' : ''} cadastrado{events.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="mr-2 w-5 h-5" />
              Novo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, responsável ou laboratório..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro */}
            <div className="lg:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="all">Todos os eventos</option>
                  <option value="upcoming">Próximos eventos</option>
                  <option value="past">Eventos passados</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Eventos */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm || filterType !== 'all' ? 'Nenhum evento encontrado' : 'Nenhum evento cadastrado'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece criando seu primeiro evento'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="mr-2 w-5 h-5" />
                Criar Primeiro Evento
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div 
                key={event.id} 
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-l-4 ${
                  isEventUpcoming(event.date) 
                    ? 'border-green-500' 
                    : 'border-gray-300'
                }`}
              >
                {/* Imagem */}
                {event.imageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={event.imageUrl} 
                      alt={event.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isEventUpcoming(event.date)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isEventUpcoming(event.date) ? 'Próximo' : 'Realizado'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Conteúdo */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                    {event.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{formatDate(event.date)}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{formatTime(event.startTime || event.time, event.endTime)}</span>
                    </div>

                    {event.lab && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{event.lab}</span>
                      </div>
                    )}

                    {event.responsible && (
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{event.responsible}</span>
                      </div>
                    )}
                  </div>

                  {event.observations && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      "{event.observations}"
                    </p>
                  )}

                  {/* Ações */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => handleOpenModal(event)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar evento"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(event)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
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