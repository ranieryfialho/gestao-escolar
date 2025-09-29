// src/pages/EventAttendeesPage.jsx (CORRIGIDO)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Users, CheckCircle, Loader } from 'lucide-react';

const EventAttendeesPage = () => {
  const { eventId } = useParams();
  const [eventDetails, setEventDetails] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;
      setLoading(true);

      try {
        // 1. Buscar detalhes do evento primeiro
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          setEventDetails({ id: eventSnap.id, ...eventSnap.data() });
        } else {
          toast.error('Evento não encontrado.');
          setLoading(false);
          return;
        }

        // 2. Buscar inscritos no evento
        const attendeesQuery = query(collection(db, 'event_registrations'), where('eventId', '==', eventId));
        const querySnapshot = await getDocs(attendeesQuery);
        const attendeesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        attendeesList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setAttendees(attendeesList);

      } catch (error) {
        console.error("Erro ao buscar dados do evento: ", error);
        toast.error('Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleCheckIn = async (registrationId) => {
    try {
      const registrationRef = doc(db, 'event_registrations', registrationId);
      await updateDoc(registrationRef, {
        checkedIn: true,
        checkInTimestamp: new Date()
      });

      setAttendees(prev =>
        prev.map(attendee =>
          attendee.id === registrationId ? { ...attendee, checkedIn: true } : attendee
        )
      );
      toast.success('Presença registrada!');
    } catch (error) {
      toast.error('Erro ao registrar presença.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-blue-600"/>
            <span className="text-lg text-gray-600">Carregando inscritos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <Link to="/eventos" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6">
        <ArrowLeft size={18} />
        Voltar para Eventos
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{eventDetails?.name || 'Lista de Inscritos'}</h1>
        <p className="text-gray-500 mt-1">Total de {attendees.length} inscrito(s)</p>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md overflow-x-auto">
        {attendees.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="p-3 font-semibold text-left">Nome</th>
                <th className="p-3 font-semibold text-left">Contato</th>
                <th className="p-3 font-semibold text-left">Curso</th>
                <th className="p-3 font-semibold text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((attendee) => (
                <tr key={attendee.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{attendee.name}</td>
                  <td className="p-3">
                    <div>{attendee.email}</div>
                    <div className="text-gray-600">{attendee.phone}</div>
                  </td>
                  <td className="p-3">{attendee.course || '-'}</td>
                  <td className="p-3 text-center">
                    {attendee.checkedIn ? (
                      <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Presente
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(attendee.id)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
                      >
                        Marcar Presença
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10">
            <Users className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">Nenhum aluno inscrito neste evento ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventAttendeesPage;