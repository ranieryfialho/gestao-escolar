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
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  Loader,
  QrCode,
  X,
} from "lucide-react";

// --- Componente do Modal QR Code ---
const QRCodeModal = ({ isOpen, onClose, eventId, eventName }) => {
  if (!isOpen) return null;

  // URL que os alunos vão acessar para fazer check-in
  const checkInUrl = `${window.location.origin}/check-in/${eventId}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {/* Conteúdo do modal */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Check-in via QR Code
          </h2>
          <p className="text-gray-600 mb-6">
            {eventName || "Evento"}
          </p>

          {/* Container do QR Code */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
            {/* Usando uma biblioteca online para gerar QR Code */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkInUrl)}`}
              alt="QR Code para Check-in"
              className="w-48 h-48"
            />
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Escaneie o QR Code para fazer check-in rapidamente
          </p>

          {/* URL para copiar */}
          <div className="bg-gray-50 p-3 rounded border text-xs break-all">
            {checkInUrl}
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(checkInUrl);
              toast.success("Link copiado!");
            }}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Copiar Link
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Página Principal ---
const EventAttendeesPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        toast.error("ID do evento não encontrado na URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          const eventData = { id: eventSnap.id, ...eventSnap.data() };
          setEvent(eventData);
        } else {
          toast.error("Evento não encontrado.");
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
              Data do evento: {event.date}
            </p>
          )}
        </div>
        
        {/* Botão para mostrar QR Code */}
        <button
          onClick={() => setShowQRModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
        >
          <QrCode size={20} />
          Gerar QR Code de Check-in
        </button>
      </div>

      {/* Modal do QR Code */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        eventId={eventId}
        eventName={event?.name}
      />

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md overflow-x-auto">
        {attendees.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="p-3 font-semibold text-left">Nome</th>
                <th className="p-3 font-semibold text-left">Contato</th>
                <th className="p-3 font-semibold text-left">Curso</th>
                <th className="p-3 font-semibold text-center">Status</th>
                <th className="p-3 font-semibold text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((attendee) => (
                <tr key={attendee.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">
                    {attendee.name}
                  </td>
                  <td className="p-3">
                    <div>{attendee.email || "Email não informado"}</div>
                    <div className="text-gray-600">
                      {attendee.phone || "Telefone não informado"}
                    </div>
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
                  <td className="p-3 text-center">
                    {attendee.checkedIn ? (
                      <span className="text-green-600 text-sm font-medium">
                        ✅ Confirmado
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