import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, doc, getDocs, updateDoc } from 'firebase/firestore';
import { Calendar, Users, QrCode, ToggleLeft, ToggleRight, ListChecks } from 'lucide-react';
import QrCodeModal from '../components/QrCodeModal';

const EventosPage = () => {
    const [events, setEvents] = useState([]);
    const [eventName, setEventName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    useEffect(() => {
        const q = collection(db, 'events');
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsData);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!eventName.trim()) return;
        setIsLoading(true);
        try {
            await addDoc(collection(db, 'events'), {
                eventName,
                eventDate: new Date(),
                isActive: true,
                createdAt: new Date(),
            });
            setEventName('');
        } catch (error) {
            console.error("Erro ao criar evento: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleEventStatus = async (event) => {
        const eventRef = doc(db, 'events', event.id);
        await updateDoc(eventRef, {
            isActive: !event.isActive
        });
    };
    
    const viewAttendees = async (eventId) => {
        if (selectedEvent?.id === eventId) {
            setSelectedEvent(null);
            setAttendees([]);
            return;
        }
        const attendeesCol = collection(db, 'events', eventId, 'attendees');
        const snapshot = await getDocs(attendeesCol);
        const attendeesList = snapshot.docs.map(doc => doc.data());
        attendeesList.sort((a, b) => a.studentName.localeCompare(b.studentName));
        setAttendees(attendeesList);
        setSelectedEvent({ id: eventId });
    };

    // Abre o modal de QR Code
    const openQrCode = (eventId) => {
        // A URL deve apontar para o site onde a página de check-in será hospedada
        const checkinUrl = 'checkin-evento.web.app';
        setSelectedEvent({ id: eventId, url: checkinUrl });
        setIsQrModalOpen(true);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Eventos</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4">Criar Novo Evento</h2>
                <form onSubmit={handleCreateEvent} className="flex gap-4">
                    <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Nome do Evento"
                        className="flex-grow p-2 border rounded-md"
                        required
                    />
                    <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {isLoading ? 'A Criar...' : 'Criar'}
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Eventos Criados</h2>
                <ul className="space-y-4">
                    {events.map(event => (
                        <li key={event.id} className="border p-4 rounded-md">
                            <div className="flex flex-wrap justify-between items-center">
                                <span className="font-semibold text-lg">{event.eventName}</span>
                                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                    <button onClick={() => toggleEventStatus(event)} className="flex items-center gap-2 text-sm">
                                        {event.isActive ? <ToggleRight className="text-green-500" size={24}/> : <ToggleLeft className="text-gray-400" size={24}/>}
                                        {event.isActive ? 'Ativo' : 'Inativo'}
                                    </button>
                                    <button onClick={() => openQrCode(event.id)} className="flex items-center gap-1 text-sm p-2 bg-gray-100 rounded-md hover:bg-gray-200">
                                        <QrCode size={16} /> QR Code
                                    </button>
                                    <button onClick={() => viewAttendees(event.id)} className="flex items-center gap-1 text-sm p-2 bg-gray-100 rounded-md hover:bg-gray-200">
                                        <ListChecks size={16} /> Presenças
                                    </button>
                                </div>
                            </div>
                            {/* Lista de Presenças */}
                            {selectedEvent?.id === event.id && (
                                <div className="mt-4 pt-4 border-t">
                                    <h3 className="font-semibold mb-2">Participantes ({attendees.length})</h3>
                                    {attendees.length > 0 ? (
                                        <ul className="list-decimal list-inside text-sm">
                                            {attendees.map(att => <li key={att.studentCode}>{att.studentName}</li>)}
                                        </ul>
                                    ) : <p className="text-sm text-gray-500">Nenhum aluno fez check-in ainda.</p>}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            
            {isQrModalOpen && selectedEvent && (
                <QrCodeModal 
                    value={selectedEvent.url} 
                    onClose={() => setIsQrModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default EventosPage;