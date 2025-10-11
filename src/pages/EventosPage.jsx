import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import EventModal from '../components/EventModal';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, User, Search, Filter, Users, Lock, Unlock } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const EventosPage = () => {
  const [events, setEvents] = useState([]);
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

  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter(event => {
      const eventDate = new Date(event.date + 'T00:00:00'); // Considerar fuso local
      const isUpcoming = eventDate >= today;

      let typeMatch = true;
      if (filterType === 'upcoming') {
        typeMatch = isUpcoming;
      } else if (filterType === 'past') {
        typeMatch = !isUpcoming;
      }

      const searchMatch = searchTerm.trim() === '' ||
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.responsible.toLowerCase().includes(searchTerm.toLowerCase());

      return typeMatch && searchMatch;
    });
  }, [events, searchTerm, filterType]);

  const handleOpenModal = (event = null) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = async (eventId) => {
    toast((t) => (
      <div className="p-2">
        <p className="mb-4">Tem certeza que deseja apagar este evento?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              deleteDoc(doc(db, 'events', eventId));
              toast.dismiss(t.id);
              toast.success('Evento apagado com sucesso!');
            }}
            className="w-full bg-red-600 text-white font-bold px-4 py-2 rounded-lg"
          >
            Apagar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full bg-gray-300 px-4 py-2 rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </div>
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não definida';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formatTime = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Horário a definir';
    return `${startTime} - ${endTime}`;
  };

  const isEventUpcoming = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateString + 'T00:00:00');
    return eventDate >= today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Carregando eventos...</p>
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
            <p className="text-gray-500 mt-1">Crie, edite e gerencie os eventos da escola.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Criar Novo Evento
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou responsável..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg appearance-none bg-white"
              >
                <option value="all">Todos os eventos</option>
                <option value="upcoming">Próximos eventos</option>
                <option value="past">Eventos passados</option>
              </select>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg shadow-sm">
            <p>Nenhum evento encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border-l-4 ${isEventUpcoming(event.date) ? 'border-green-500' : 'border-gray-300'}`}>
                {event.imageUrl && (
                  <div className="relative h-48">
                    <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{event.name}</h3>
                  <div className="space-y-2 text-gray-600 text-sm mb-4 flex-grow">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <span>{formatDate(event.date)}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> <span>{formatTime(event.startTime, event.endTime)}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> <span>{event.lab}</span></div>
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /> <span>{event.responsible}</span></div>

                    <div className={`flex items-center gap-2 font-semibold ${event.registrationOpen !== false ? 'text-green-600' : 'text-red-600'}`}>
                      {event.registrationOpen !== false ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>
                        {event.registrationOpen !== false ? 'Inscrições Abertas' : 'Inscrições Fechadas'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-auto">
                    <div className="flex justify-between items-center">
                      <Link
                        to={`/eventos/${event.id}/inscritos`}
                        className="flex items-center gap-2 text-sm bg-gray-100 text-gray-800 font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Users size={16} />
                        Ver Inscritos
                      </Link>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenModal(event)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100 transition-colors"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default EventosPage;