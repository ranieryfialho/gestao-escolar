// gestao-escolar/src/pages/EventAttendeesPage.jsx (VERSÃO CORRIGIDA)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Users, CheckCircle, Loader, QrCode } from 'lucide-react';
import QrCodeModal from '../components/QrCodeModal';

const EventAttendeesPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        toast.error('ID do evento não encontrado na URL.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      console.log('Buscando evento com ID:', eventId);

      try {
        // Buscar detalhes do evento
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          const eventData = { id: eventSnap.id, ...eventSnap.data() };
          console.log('Dados do evento carregados:', eventData);
          setEvent(eventData);
        } else {
          console.error('Evento não encontrado para ID:', eventId);
          toast.error('Evento não encontrado.');
          setLoading(false);
          return;
        }

        // Buscar inscritos no evento
        console.log('Buscando inscritos para o evento ID:', eventId);
        const attendeesQuery = query(
          collection(db, 'event_registrations'), 
          where('eventId', '==', eventId)
        );
        const querySnapshot = await getDocs(attendeesQuery);
        const attendeesList = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        attendeesList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        console.log('Inscritos carregados:', attendeesList.length);
        setAttendees(attendeesList);

      } catch (error) {
        console.error("Erro ao buscar dados do evento:", error);
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
      console.error('Erro ao registrar presença:', error);
      toast.error('Erro ao registrar presença.');
    }
  };
  
  const handleGenerateQrCode = async () => {
    // ### CORREÇÃO PRINCIPAL: Verificar se eventId existe antes de gerar o QR Code ###
    if (!eventId) {
      toast.error("Erro: ID do evento não foi encontrado na URL.");
      return;
    }

    console.log('Iniciando geração do QR Code para evento ID:', eventId);
    setIsGeneratingQr(true);
    
    try {
      const generateToken = httpsCallable(functions, 'generateEventToken');
      
      // ### CORREÇÃO: Usar eventId diretamente da URL em vez de event.id ###
      console.log('Enviando eventId para a função:', eventId);
      const result = await generateToken({ eventId: eventId }); 
      const { token } = result.data;
      
      console.log('Token gerado com sucesso:', token);
      const checkinUrl = `https://portal-aluno-senior.web.app/checkin?token=${token}`;
      setQrCodeValue(checkinUrl);
      setIsQrModalOpen(true);

    } catch (error) {
      console.error("Erro detalhado ao gerar QR Code:", error);
      if (error.code === 'functions/invalid-argument') {
        toast.error("O ID do evento é obrigatório.");
      } else if (error.code === 'functions/not-found') {
        toast.error("Evento não encontrado.");
      } else {
        toast.error(error.message || "Não foi possível gerar o QR Code.");
      }
    } finally {
      setIsGeneratingQr(false);
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">{event?.name || 'Lista de Inscritos'}</h1>
            <p className="text-gray-500 mt-1">Total de {attendees.length} inscrito(s)</p>
            {event?.date && (
              <p className="text-gray-500 text-sm">Data do evento: {event.date}</p>
            )}
        </div>
        <button
          onClick={handleGenerateQrCode}
          disabled={isGeneratingQr || !eventId}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
        >
          {isGeneratingQr ? <Loader className="animate-spin" size={20}/> : <QrCode size={20} />}
          {isGeneratingQr ? 'Gerando...' : 'Gerar QR Code de Check-in'}
        </button>
      </div>

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
                  <td className="p-3 font-medium text-gray-900">{attendee.name}</td>
                  <td className="p-3">
                    <div>{attendee.email || 'Email não informado'}</div>
                    <div className="text-gray-600">{attendee.phone || 'Telefone não informado'}</div>
                  </td>
                  <td className="p-3">{attendee.course || '-'}</td>
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
            <p className="text-gray-500">Nenhum aluno inscrito neste evento ainda.</p>
          </div>
        )}
      </div>
      
      {isQrModalOpen && (
        <QrCodeModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          value={qrCodeValue}
          title="QR Code para Check-in"
          subtitle="Peça para os alunos escanearem este código para confirmar a presença. Este código expira em 5 minutos."
        />
      )}
    </div>
  );
};

export default EventAttendeesPage;