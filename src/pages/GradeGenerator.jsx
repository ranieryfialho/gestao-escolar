import React, { useState } from 'react';
import { Calculator, Copy, RefreshCw, ArrowLeft, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SUB_INFORMATICA = [
  { id: 'WORD', name: 'Word', context: 'OFFA/Info' },
  { id: 'EXCEL', name: 'Excel', context: 'OFFA/Info' },
  { id: 'PPT', name: 'PowerPoint', context: 'OFFA/Info' }
];

const SUB_ADM = [
  { id: 'GP', name: 'Gestão de Pessoas', context: 'ADM' },
  { id: 'FIN', name: 'Gestão Financeira', context: 'ADM' },
  { id: 'PROJ', name: 'Projeto', context: 'ADM' }
];

const COURSES = {
  '6_meses_info': {
    label: 'Informática (6 Meses)',
    modules: [
      { id: 'ICN', name: 'ICN - Internet e Nuvem', context: 'Geral' },
      ...SUB_INFORMATICA
    ]
  },
  '6_meses_adm': {
    label: 'Administração (6 Meses)',
    modules: [
      ...SUB_ADM
    ]
  },
  '12_meses': {
    label: 'Profissionalizante (12 Meses)',
    modules: [
      { id: 'ICN', name: 'ICN - Internet e Nuvem', context: 'Geral' },
      ...SUB_INFORMATICA.map(m => ({ ...m, name: `${m.name} (OFFA)` })),
      ...SUB_ADM.map(m => ({ ...m, name: `${m.name} (ADM)` }))
    ]
  },
  '19_meses': {
    label: 'Especialização (19 Meses)',
    modules: [
      { id: 'ICN', name: 'ICN - Internet e Nuvem', context: 'Geral' },
      ...SUB_INFORMATICA.map(m => ({ ...m, name: `${m.name} (OFFA)` })),
      ...SUB_ADM.map(m => ({ ...m, name: `${m.name} (ADM)` })),
      { id: 'PWB', name: 'PWB - Power BI', context: 'Geral' },
      { id: 'TRI', name: 'TRI - Photoshop', context: 'Geral' },
      { id: 'CMV', name: 'CMV - Illustrator', context: 'Geral' }
    ]
  }
};

const GradeGenerator = () => {
  const [attendanceInput, setAttendanceInput] = useState('');
  const [courseType, setCourseType] = useState('19_meses');
  const [generatedGrades, setGeneratedGrades] = useState([]);
  const [finalAverage, setFinalAverage] = useState(0);

  const handleGenerate = () => {
    const frequency = parseFloat(attendanceInput);

    if (isNaN(frequency) || frequency < 0 || frequency > 100) {
      toast.error('Por favor, insira uma frequência válida entre 0 e 100%.');
      return;
    }

    const target = frequency / 10;
    
    const selectedCourse = COURSES[courseType];
    const modules = selectedCourse.modules;
    const count = modules.length;
    
    let grades = [];
    let currentSum = 0;

    for (let i = 0; i < count; i++) {
      const variation = (Math.random() * 2) - 1.0; 
      
      let grade = target + variation;

      if (target > 9.5) grade = Math.max(9.0, Math.min(10, grade));
      else grade = Math.max(0, Math.min(10, grade));
      
      grade = Math.round(grade * 10) / 10;
      
      grades.push(grade);
      currentSum += grade;
    }

    const result = modules.map((mod, index) => ({
      ...mod,
      grade: grades[index].toFixed(1)
    }));

    const realSum = grades.reduce((a, b) => a + b, 0);
    setFinalAverage((realSum / count).toFixed(1));
    setGeneratedGrades(result);
    toast.success(`Notas geradas baseadas em ${frequency}% de frequência!`);
  };

  const copyToClipboard = () => {
    if (generatedGrades.length === 0) return;
    const text = generatedGrades.map(g => `${g.name}: ${g.grade}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Lista copiada!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Voltar para o Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-blue-600 p-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calculator size={28} />
              Gerador de Notas por Frequência
            </h1>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Curso / Grade
                </label>
                <select
                  value={courseType}
                  onChange={(e) => setCourseType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {Object.entries(COURSES).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Frequência Geral do Aluno (0-100%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ex: 85"
                    value={attendanceInput}
                    onChange={(e) => setAttendanceInput(e.target.value)}
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <Percent size={18} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  O sistema irá gerar notas médias próximas a {attendanceInput ? (attendanceInput / 10).toFixed(1) : '0.0'}.
                </p>
              </div>

              <div className="md:col-span-2">
                <button
                  onClick={handleGenerate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <RefreshCw size={20} />
                  Gerar Notas
                </button>
              </div>
            </div>

            {/* Resultados */}
            {generatedGrades.length > 0 && (
              <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Notas Sugeridas (Média Final: <span className="text-blue-600">{finalAverage}</span>)
                  </h3>
                  <button
                    onClick={copyToClipboard}
                    className="text-gray-600 hover:text-blue-600 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-blue-50 transition"
                    title="Copiar lista para colar"
                  >
                    <Copy size={18} />
                    <span className="text-sm font-medium">Copiar</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {generatedGrades.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`
                        border-2 p-4 rounded-xl shadow-sm transition duration-200
                        ${item.name.includes('(OFFA)') ? 'bg-blue-50 border-blue-100' : ''}
                        ${item.name.includes('(ADM)') ? 'bg-orange-50 border-orange-100' : ''}
                        ${!item.name.includes('(') ? 'bg-white border-gray-100' : ''}
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-500 text-sm truncate pr-2" title={item.name}>
                          {item.id}
                        </span>
                        <span className={`text-xl font-bold ${
                          parseFloat(item.grade) >= 7 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {item.grade}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate" title={item.name}>
                        {item.name}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex gap-4 text-xs text-gray-500 justify-center">
                   <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></span> Módulos OFFA</div>
                   <div className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></span> Módulos ADM</div>
                   <div className="flex items-center gap-1"><span className="w-3 h-3 bg-white border border-gray-200 rounded"></span> Outros</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeGenerator;