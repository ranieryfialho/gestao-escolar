import { useState } from 'react';
import { Calculator } from 'lucide-react';

const courseHours = {
  esp: 152,
  informatica: 104
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

    const attendedClasses = Math.floor(totalClasses * (frequency / 100));

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="esp">ESP (19 meses - 152h)</option>
            <option value="informatica">Informática e ADM (12 meses - 104h)</option>
          </select>
        </div>

        <div>
          <label htmlFor="currentFrequency" className="block text-sm font-medium text-gray-700 mb-1">Frequência Atual do Aluno (%)</label>
          <input
            id="currentFrequency"
            type="number"
            value={currentFrequency}
            onChange={(e) => setCurrentFrequency(e.target.value)}
            placeholder="Ex: 78"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={handleCalculate}
          className="w-full bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Calcular
        </button>
      </div>

      {result !== null && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold text-blue-800">Resultado do Cálculo:</h3>
          <p className="mt-2">
            O aluno precisa repor <strong className="text-2xl text-red-600">{result.classesToReplace}</strong> aula(s) para atingir a frequência mínima de 80%.
          </p>
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>• Total de aulas do curso: <strong>{result.totalClasses}</strong></p>
            <p>• Aulas já frequentadas (aprox.): <strong>{result.attendedClasses}</strong></p>
            <p>• Mínimo de aulas para aprovação (80%): <strong>{result.requiredClasses}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReplacementCalculator;