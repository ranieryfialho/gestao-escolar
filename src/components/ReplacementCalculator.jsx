import { useState } from 'react';
import { Calculator } from 'lucide-react';

const courseHours = {
  esp: 152,        // 19 meses
  informatica: 104, // 12 meses (ICN + OFFA + ADM)
  info_6m: 56,      // 6 meses Info (ICN + OFFA) -> 16h + 40h
  adm_6m: 48        // 6 meses ADM (ADM Completo) -> 48h
};

const hoursPerClass = 2;
const minimumFrequency = 0.80;

function ReplacementCalculator() {
  const [courseType, setCourseType] = useState('esp');
  const [currentFrequency, setCurrentFrequency] = useState('');
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const frequency = parseFloat(currentFrequency);
    if (isNaN(frequency) || frequency < 0 || frequency > 100) {
      alert("Por favor, insira uma porcentagem de frequência válida.");
      return;
    }

    const totalHours = courseHours[courseType];
    const totalClasses = totalHours / hoursPerClass;

    // Aulas frequentadas (arredondado para baixo, pois meia presença não conta integralmente para cálculo de falta)
    const attendedClasses = Math.floor(totalClasses * (frequency / 100));

    // Mínimo necessário (arredondado para cima para garantir os 80%)
    const requiredClasses = Math.ceil(totalClasses * minimumFrequency);

    const classesToReplace = requiredClasses - attendedClasses;

    setResult({
      totalClasses: totalClasses.toFixed(0),
      attendedClasses: attendedClasses.toFixed(0),
      requiredClasses: requiredClasses.toFixed(0),
      classesToReplace: classesToReplace > 0 ? classesToReplace.toFixed(0) : 0,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Calculator size={24} />
        Calculadora de Aulas de Reposição
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="courseType" className="block text-sm font-medium text-gray-700 mb-1">Ementa do Curso</label>
          <select
            id="courseType"
            value={courseType}
            onChange={(e) => setCourseType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="esp">ESP (19 meses - 152h)</option>
            <option value="informatica">Profissionalizante (12 meses - 104h)</option>
            <option value="info_6m">Informática (6 meses - 56h)</option>
            <option value="adm_6m">Administração (6 meses - 48h)</option>
          </select>
        </div>

        <div>
          <label htmlFor="currentFrequency" className="block text-sm font-medium text-gray-700 mb-1">Frequência Atual (%)</label>
          <input
            id="currentFrequency"
            type="number"
            min="0"
            max="100"
            value={currentFrequency}
            onChange={(e) => setCurrentFrequency(e.target.value)}
            placeholder="Ex: 78"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleCalculate}
          className="w-full bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm active:scale-95"
        >
          Calcular
        </button>
      </div>

      {result !== null && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fadeIn">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Resultado do Cálculo:</h3>
          
          {result.classesToReplace > 0 ? (
            <p className="text-gray-800">
              O aluno precisa repor <strong className="text-2xl text-red-600 px-1">{result.classesToReplace}</strong> aula(s) para atingir 80%.
            </p>
          ) : (
            <p className="text-green-700 font-semibold flex items-center gap-2">
              ✅ O aluno já possui frequência suficiente para aprovação!
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 border-t border-blue-200 pt-4">
            <div className="bg-white p-3 rounded border border-blue-100">
              <span className="block text-xs text-gray-500 uppercase font-bold">Total do Curso</span>
              <strong className="text-lg text-gray-800">{result.totalClasses} aulas</strong>
            </div>
            <div className="bg-white p-3 rounded border border-blue-100">
              <span className="block text-xs text-gray-500 uppercase font-bold">Frequentadas (Aprox)</span>
              <strong className="text-lg text-gray-800">{result.attendedClasses} aulas</strong>
            </div>
            <div className="bg-white p-3 rounded border border-blue-100">
              <span className="block text-xs text-gray-500 uppercase font-bold">Mínimo (80%)</span>
              <strong className="text-lg text-gray-800">{result.requiredClasses} aulas</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReplacementCalculator;