import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const SimpleQRCheckin = ({ eventId, eventName }) => {
  const [checkinUrl, setCheckinUrl] = useState('');
  const [studentsPresent, setStudentsPresent] = useState([]);

  useEffect(() => {
    // Gerar URL simples para check-in
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/checkin/${eventId}`;
    setCheckinUrl(url);

    // Buscar presenças já registradas
    fetchPresentStudents();
  }, [eventId]);

  const fetchPresentStudents = async () => {
    try {
      const q = query(
        collection(db, 'event_attendance'),
        where('eventId', '==', eventId),
        where('present', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudentsPresent(students);
    } catch (error) {
      console.error('Erro ao buscar presenças:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Check-in: {eventName}</h2>
        <p className="text-gray-600 mb-4">
          Escaneie o QR Code para registrar sua presença
        </p>
        
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg shadow-inner inline-block">
          <QRCodeSVG
            value={checkinUrl}
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
          />
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          Ou acesse: <br/>
          <span className="font-mono text-xs">{checkinUrl}</span>
        </p>
      </div>

      {/* Lista de presenças */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">
          Presenças Registradas ({studentsPresent.length})
        </h3>
        <div className="max-h-48 overflow-y-auto">
          {studentsPresent.map((student, index) => (
            <div key={student.id} className="flex items-center py-2 border-b">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 text-sm font-bold">{index + 1}</span>
              </div>
              <div>
                <p className="font-medium">{student.studentName}</p>
                <p className="text-sm text-gray-500">
                  {new Date(student.checkinTime?.toDate()).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleQRCheckin;