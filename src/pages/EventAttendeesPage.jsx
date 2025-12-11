// gestao-escolar/src/pages/EventAttendeesPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  Loader,
  Trash2,
  Check,
} from "lucide-react";

const EventAttendeesPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDateToBR = (dateString) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return 'Data inválida';
    }
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() });
        } else {
          setLoading(false);
          return;
        }
        const attendeesQuery = query(
          collection(db, "event_registrations"),
          where("eventId", "==", eventId)
        );
        const querySnapshot = await getDocs(attendeesQuery);
        const attendeesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        attendeesList.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        setAttendees(attendeesList);
      } catch (error) {
        console.error("Erro ao buscar dados do evento:", error);
        toast.error("Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventId]);

  const handleCheckIn = async (registrationId) => {
    try {
      const registrationRef = doc(db, "event_registrations", registrationId);
      await updateDoc(registrationRef, {
        checkedIn: true,
        checkInTimestamp: new Date(),
      });
      setAttendees((prev) =>
        prev.map((attendee) =>
          attendee.id === registrationId
            ? { ...attendee, checkedIn: true }
            : attendee
        )
      );
      toast.success("Presença registrada!");
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
      toast.error("Erro ao registrar presença.");
    }
  };
  
  const handleRemoveAttendee = async (registrationId, attendeeName) => {
    if (window.confirm(`Tem certeza que deseja remover ${attendeeName} da lista?`)) {
      try {
        await deleteDoc(doc(db, "event_registrations", registrationId));
        setAttendees(prevAttendees => prevAttendees.filter(attendee => attendee.id !== registrationId));
        toast.success(`${attendeeName} foi removido(a) com sucesso!`);
      } catch (error) {
        console.error("Erro ao remover inscrição:", error);
        toast.error("Não foi possível remover o aluno.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Carregando inscritos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <Link
        to="/eventos"
        className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={18} />
        Voltar para Eventos
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {event?.name || "Lista de Inscritos"}
          </h1>
          <p className="text-gray-500 mt-1">
            Total de {attendees.length} inscrito(s)
          </p>
          {event?.date && (
            <p className="text-gray-500 text-sm">
              Data do evento: {formatDateToBR(event.date)}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md overflow-x-auto">
        {attendees.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="p-3 font-semibold text-left">Código do Aluno</th>
                <th className="p-3 font-semibold text-left">Nome</th>
                <th className="p-3 font-semibold text-left">Turma</th>
                <th className="p-3 font-semibold text-center">Status</th>
                <th className="p-3 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((attendee) => (
                <tr key={attendee.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-gray-600">
                    {attendee.studentCode || "N/A"}
                  </td>
                  <td className="p-3 font-medium text-gray-900">
                    {attendee.name}
                  </td>
                  <td className="p-3">{attendee.course || "-"}</td>
                  <td className="p-3 text-center">
                    {attendee.checkedIn ? (
                      <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Presente
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        ⏳ Pendente
                      </span>
                    )}
                  </td>
                  {/* --- AÇÕES ATUALIZADAS --- */}
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      {attendee.checkedIn ? (
                        <span className="font-semibold text-green-600 text-sm flex items-center gap-1.5">
                          <CheckCircle size={16} />
                          Confirmado
                        </span>
                      ) : (
                        // BOTÃO DE PRESENÇA ALTERADO
                        <button
                          onClick={() => handleCheckIn(attendee.id)}
                          className="flex items-center justify-center w-9 h-9 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors shadow-sm"
                          title="Marcar Presença"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveAttendee(attendee.id, attendee.name)}
                        className="flex items-center justify-center w-9 h-9 bg-gray-200 text-gray-500 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                        title="Remover inscrição"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10">
            <Users className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">
              Nenhum aluno inscrito neste evento ainda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventAttendeesPage;