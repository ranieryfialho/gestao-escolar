import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  BarChart3,
  Activity,
  Award,
  BookOpen,
  Download,
  UserPlus,
  Star
} from "lucide-react";
import { db } from "../firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { getWeekdayName } from "../utils/labScheduleConfig";

function LabStatisticsPage() {
  const navigate = useNavigate();
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all"); // all, month, week
  
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "labEntries"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const entriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllEntries(entriesData);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Filtrar por período
  const getFilteredEntries = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (selectedPeriod === "month") {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return allEntries.filter(entry => {
        const entryDate = new Date(entry.entryDate + "T12:00:00");
        return entryDate >= firstDayOfMonth && entryDate <= now;
      });
    }
    
    if (selectedPeriod === "week") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      return allEntries.filter(entry => {
        const entryDate = new Date(entry.entryDate + "T12:00:00");
        return entryDate >= firstDayOfWeek && entryDate <= now;
      });
    }
    
    return allEntries;
  };

  const filteredEntries = getFilteredEntries();

  // Estatísticas gerais
  const totalAttendances = filteredEntries.length;
  const completedAttendances = filteredEntries.filter(e => e.isDone).length;
  const pendingAttendances = totalAttendances - completedAttendances;
  const completionRate = totalAttendances > 0 
    ? ((completedAttendances / totalAttendances) * 100).toFixed(1) 
    : 0;

  // Estatísticas de alunos
  const uniqueStudents = new Set(
    filteredEntries
      .filter(e => e.studentCode !== "VISITANTE")
      .map(e => e.studentCode)
  ).size;
  
  const totalVisitors = filteredEntries.filter(e => e.studentCode === "VISITANTE").length;
  
  // ESTATÍSTICAS DE ALUNOS NOVOS
  const newStudentsEntries = filteredEntries.filter(e => e.isNewStudent);
  const totalNewStudentsAttendances = newStudentsEntries.length;
  
  // Alunos novos únicos (diferentes alunos que foram marcados como novos)
  const uniqueNewStudents = new Set(
    newStudentsEntries
      .filter(e => e.studentCode !== "VISITANTE")
      .map(e => e.studentCode)
  ).size;
  
  // Percentual de atendimentos para alunos novos
  const newStudentsPercentage = totalAttendances > 0 
    ? ((totalNewStudentsAttendances / totalAttendances) * 100).toFixed(1)
    : 0;

  // Atendimentos concluídos de alunos novos
  const completedNewStudentsAttendances = newStudentsEntries.filter(e => e.isDone).length;
  const newStudentsCompletionRate = totalNewStudentsAttendances > 0
    ? ((completedNewStudentsAttendances / totalNewStudentsAttendances) * 100).toFixed(1)
    : 0;

  // Atividades mais comuns
  const activityCount = {};
  filteredEntries.forEach(entry => {
    const activity = entry.activity || "Não informado";
    activityCount[activity] = (activityCount[activity] || 0) + 1;
  });
  const topActivities = Object.entries(activityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Atividades mais comuns entre ALUNOS NOVOS
  const newStudentsActivityCount = {};
  newStudentsEntries.forEach(entry => {
    const activity = entry.activity || "Não informado";
    newStudentsActivityCount[activity] = (newStudentsActivityCount[activity] || 0) + 1;
  });
  const topNewStudentsActivities = Object.entries(newStudentsActivityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Módulos/Matérias mais comuns (quando aplicável)
  const subjectCount = {};
  filteredEntries.forEach(entry => {
    if (entry.subject) {
      subjectCount[entry.subject] = (subjectCount[entry.subject] || 0) + 1;
    }
  });
  const topSubjects = Object.entries(subjectCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Horários mais procurados
  const timeSlotCount = {};
  filteredEntries.forEach(entry => {
    const slots = Array.isArray(entry.timeSlot) ? entry.timeSlot : [entry.timeSlot];
    slots.forEach(slot => {
      if (slot) {
        timeSlotCount[slot] = (timeSlotCount[slot] || 0) + 1;
      }
    });
  });
  const topTimeSlots = Object.entries(timeSlotCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Dias da semana mais procurados
  const weekdayCount = {};
  filteredEntries.forEach(entry => {
    const weekday = getWeekdayName(entry.entryDate);
    weekdayCount[weekday] = (weekdayCount[weekday] || 0) + 1;
  });
  const topWeekdays = Object.entries(weekdayCount)
    .sort((a, b) => b[1] - a[1]);

  // Atendimentos por mês (últimos 6 meses)
  const monthlyData = {};
  const monthlyNewStudentsData = {};
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    last6Months.push({ key, label });
    monthlyData[key] = 0;
    monthlyNewStudentsData[key] = 0;
  }
  
  allEntries.forEach(entry => {
    const entryDate = entry.entryDate.substring(0, 7); // YYYY-MM
    if (monthlyData.hasOwnProperty(entryDate)) {
      monthlyData[entryDate]++;
      if (entry.isNewStudent) {
        monthlyNewStudentsData[entryDate]++;
      }
    }
  });

  const monthlyChartData = last6Months.map(month => ({
    label: month.label,
    value: monthlyData[month.key],
    newStudents: monthlyNewStudentsData[month.key]
  }));

  // Função para exportar dados (básico)
  const exportData = () => {
    const data = {
      periodo: selectedPeriod === "all" ? "Todos" : selectedPeriod === "month" ? "Este mês" : "Esta semana",
      geradoEm: new Date().toLocaleString('pt-BR'),
      totalAtendimentos: totalAttendances,
      atendimentosConcluidos: completedAttendances,
      atendimentosPendentes: pendingAttendances,
      taxaConclusao: completionRate + "%",
      alunosUnicos: uniqueStudents,
      visitantes: totalVisitors,
      alunosNovos: {
        totalAtendimentos: totalNewStudentsAttendances,
        alunosUnicoNovos: uniqueNewStudents,
        percentualDoTotal: newStudentsPercentage + "%",
        atendimentosConcluidos: completedNewStudentsAttendances,
        taxaConclusao: newStudentsCompletionRate + "%"
      },
      atividadesMaisComuns: topActivities,
      atividadesMaisComunsAlunosNovos: topNewStudentsActivities,
      horariosMaisProcurados: topTimeSlots,
      diasMaisProcurados: topWeekdays
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatisticas-lab-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-10">
          <p className="text-gray-500">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/laboratorio")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <ArrowLeft size={20} />
          Voltar para Controle do Laboratório
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <BarChart3 size={32} className="text-blue-600" />
              Estatísticas do Laboratório de Apoio
            </h1>
            <p className="text-gray-600 mt-1">Análise completa dos atendimentos</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download size={18} />
              Exportar Dados
            </button>
          </div>
        </div>
      </div>

      {/* Filtro de Período */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Período de Análise:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPeriod("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedPeriod === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Todos os Dados
          </button>
          <button
            onClick={() => setSelectedPeriod("month")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedPeriod === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setSelectedPeriod("week")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedPeriod === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Esta Semana
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={Activity}
          title="Total de Atendimentos"
          value={totalAttendances}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          title="Taxa de Conclusão"
          value={`${completionRate}%`}
          subtitle={`${completedAttendances} concluídos`}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={Users}
          title="Alunos Únicos"
          value={uniqueStudents}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={Award}
          title="Visitantes"
          value={totalVisitors}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Seção de Alunos Novos - DESTAQUE */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserPlus size={28} className="text-cyan-600" />
          Estatísticas de Alunos Novos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Atendimentos de Alunos Novos</p>
                <p className="text-3xl font-bold text-cyan-600 mt-1">{totalNewStudentsAttendances}</p>
                <p className="text-xs text-gray-500 mt-1">{newStudentsPercentage}% do total</p>
              </div>
              <div className="p-3 rounded-full bg-cyan-100">
                <Star size={24} className="text-cyan-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Alunos Novos Únicos</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{uniqueNewStudents}</p>
                <p className="text-xs text-gray-500 mt-1">Diferentes alunos</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Taxa de Conclusão</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{newStudentsCompletionRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{completedNewStudentsAttendances} concluídos</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Média por Aluno Novo</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {uniqueNewStudents > 0 ? (totalNewStudentsAttendances / uniqueNewStudents).toFixed(1) : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Atendimentos/aluno</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <BarChart3 size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Atendimentos Mensais com Alunos Novos */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={24} className="text-blue-600" />
          Atendimentos nos Últimos 6 Meses
        </h2>
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Total de Atendimentos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cyan-400 rounded"></div>
            <span className="text-sm text-gray-600">Alunos Novos</span>
          </div>
        </div>
        <div className="flex items-end justify-between h-64 gap-2">
          {monthlyChartData.map((data, index) => {
            const maxValue = Math.max(...monthlyChartData.map(d => d.value));
            const height = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
            const newStudentsHeight = maxValue > 0 ? (data.newStudents / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full relative" style={{ height: `${height}%`, minHeight: data.value > 0 ? '20px' : '0px' }}>
                  {/* Barra total */}
                  <div className="absolute bottom-0 w-full bg-blue-200 rounded-t-lg group">
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      Total: {data.value}
                    </div>
                  </div>
                  {/* Barra de alunos novos sobreposta */}
                  {data.newStudents > 0 && (
                    <div 
                      className="absolute bottom-0 w-full bg-cyan-400 rounded-t-lg group" 
                      style={{ height: `${(newStudentsHeight / height) * 100}%` }}
                    >
                      <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-cyan-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                        Novos: {data.newStudents}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-600 text-center">{data.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Atividades Mais Comuns */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen size={24} className="text-blue-600" />
            Atividades Mais Realizadas
          </h2>
          <div className="space-y-3">
            {topActivities.length > 0 ? (
              topActivities.map(([activity, count], index) => (
                <div key={activity} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 font-medium">{activity}</span>
                  </div>
                  <span className="text-gray-900 font-bold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Atividades Mais Comuns - ALUNOS NOVOS */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-lg shadow-md border border-cyan-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus size={24} className="text-cyan-600" />
            Atividades Mais Realizadas (Alunos Novos)
          </h2>
          <div className="space-y-3">
            {topNewStudentsActivities.length > 0 ? (
              topNewStudentsActivities.map(([activity, count], index) => (
                <div key={activity} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 font-medium">{activity}</span>
                  </div>
                  <span className="text-gray-900 font-bold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Horários Mais Procurados */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={24} className="text-blue-600" />
            Horários Mais Procurados
          </h2>
          <div className="space-y-3">
            {topTimeSlots.length > 0 ? (
              topTimeSlots.map(([slot, count], index) => (
                <div key={slot} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 font-medium font-mono">{slot}</span>
                  </div>
                  <span className="text-gray-900 font-bold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Dias da Semana Mais Procurados */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={24} className="text-blue-600" />
            Dias da Semana Mais Procurados
          </h2>
          <div className="space-y-3">
            {topWeekdays.length > 0 ? (
              topWeekdays.map(([day, count], index) => (
                <div key={day} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 font-medium">{day}</span>
                  </div>
                  <span className="text-gray-900 font-bold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      </div>

      {/* Módulos/Matérias Mais Trabalhados */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen size={24} className="text-blue-600" />
          Módulos Mais Trabalhados
        </h2>
        <div className="space-y-3">
          {topSubjects.length > 0 ? (
            topSubjects.map(([subject, count], index) => (
              <div key={subject} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 font-medium">{subject}</span>
                </div>
                <span className="text-gray-900 font-bold">{count}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para cards de estatísticas
function StatCard({ icon: Icon, title, value, subtitle, bgColor, iconColor }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon size={24} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

export default LabStatisticsPage;