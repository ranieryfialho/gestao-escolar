import React from 'react';
import { Users } from 'lucide-react';

function InstructorStats({ stats, onSelect, selected }) {
  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-md font-bold text-gray-700 flex items-center gap-2">
          <Users size={20} />
          Resumo por Instrutor
        </h2>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {stats.map(item => {
          const isSelected = item.name === selected;
          return (
            <button
              key={item.name}
              onClick={() => onSelect(item.name)}
              className={`text-sm font-semibold px-3 py-1 rounded-full transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
              }`}
            >
              {item.name}: <span className="font-bold">{item.count}</span> {item.count > 1 ? 'turmas' : 'turma'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default InstructorStats;