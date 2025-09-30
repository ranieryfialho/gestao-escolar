// gestao-escolar/src/pages/EventAttendeesPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db, functions } from "../firebase";
import { httpsCallable } from "firebase/functions";
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
  RefreshCw,
  Clock,
} from "lucide-react";

// --- Componente do Contador Regressivo ---
const CountdownTimer = ({ expiryTimestamp, onExpire }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(expiryTimestamp) - +new Date();
    if (difference > 0) {
      return {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (!timeLeft) {
      onExpire();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onExpire]);

  if (!timeLeft) {
    return <span className="text-red-500 font-bold">Expirado!</span>;
  }

  return (
    <div className="font-mono text-xl">
      <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
      <span>:</span>
      <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
    </div>
  );
};

// --- Página Principal ---
const EventAttendeesPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [generatedToken, setGeneratedToken] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerateToken = async () => {
    if (!eventId) {
      toast.error("Erro: ID do evento não foi encontrado na URL.");
      return;
    }

    setIsGenerating(true);
    try {
      const generateTokenFunc = httpsCallable(
        functions,
        "generateAndAssignEventToken"
      );

      const result = await generateTokenFunc({ eventId: eventId });

      const { token, expiresAt } = result.data;

      setGeneratedToken(token);
      setTokenExpiresAt(expiresAt);
      toast.success("Token gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar token:", error);
      toast.error(error.message || "Falha ao gerar o token.");
    } finally {
      setIsGenerating(false);
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
        <button
          onClick={handleGenerateToken}
          disabled={isGenerating || !eventId}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
        >
          {isGenerating ? (
            <Loader className="animate-spin" size={20} />
          ) : (
            <RefreshCw size={20} />
          )}
          {isGenerating ? "Gerando..." : "Gerar Token de Check-in"}
        </button>
      </div>

      {generatedToken && tokenExpiresAt && (
        <div className="mb-6 bg-gray-800 text-white p-6 rounded-xl shadow-lg text-center animate-fade-in">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-gray-300 mb-2">
            Token de Check-in
          </h2>
          <p className="text-6xl font-bold tracking-widest my-4">
            {generatedToken}
          </p>
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <Clock size={20} />
            <span>Expira em:</span>
            <CountdownTimer
              expiryTimestamp={tokenExpiresAt}
              onExpire={() => {
                setGeneratedToken(null);
                setTokenExpiresAt(null);
                toast.error("Token expirado!");
              }}
            />
          </div>
        </div>
      )}

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