import React from 'react';
import { Clock } from 'lucide-react';

const horarios = [
  { dia: "Segunda", horario: "13h30 às 17h20" },
  { dia: "Terça", horario: "13h às 15h20" },
  { dia: "Quarta", horario: "13h30 às 17h20" },
  { dia: "Sexta", horario: "13h30 às 15h20" },
  { dia: "Sábado", horario: "7h30 às 9h20" },
];

function HorariosAtendimento() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-8 border-l-4 border-blue-500">
      <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Clock size={20} className="text-blue-600" />
        Horários Preferenciais de Atendimento
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
        {horarios.map((item) => (
          <div key={item.dia} className="bg-gray-50 p-3 rounded-md">
            <p className="font-semibold text-gray-700">{item.dia}</p>
            <p className="text-sm text-gray-600">{item.horario}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HorariosAtendimento;