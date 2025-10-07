import React, { useContext, useState, useEffect, useMemo } from 'react';
import { ClassContext } from '../contexts/ClassContext';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ListChecks, Loader2, TrendingUp, Info, Users, Save, ChevronDown, ChevronUp, BookOpen, Calendar, User, Clock, CalendarDays, Filter, X, BarChart3 } from 'lucide-react';

const RetufPage = () => {
  const { classes } = useContext(ClassContext);
  const [frequenciaData, setFrequenciaData] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  
  // Estados dos filtros
  const [filters, setFilters] = useState({
    professor: '',
    modulo: '',
    diaSemana: '',
    horario: '',
    dataTermino: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchFrequenciaData = async () => {
      if (!mes || !ano) return;

      const retufQuery = query(
        collection(db, 'retuf'),
        where('ano', '==', Number(ano)),
        where('mes', '==', Number(mes))
      );

      const querySnapshot = await getDocs(retufQuery);
      const data = {};
      querySnapshot.forEach(doc => {
        const docData = doc.data();
        const weeklyData = {};
        docData.semanas.forEach(s => {
          weeklyData[s.semana] = s.presentes;
        });
        data[docData.turmaId] = weeklyData;
      });
      setFrequenciaData(data);
    };

    fetchFrequenciaData();
  }, [mes, ano]);

  const handlePresentesChange = (turmaId, semana, valor) => {
    const cleanValue = valor === '' ? '' : Math.max(0, Number(valor));
    setFrequenciaData(prevData => ({
      ...prevData,
      [turmaId]: {
        ...prevData[turmaId],
        [semana]: cleanValue,
      },
    }));
  };
  
  const monthlyAverages = useMemo(() => {
    const averages = {};
    for (const turma of (classes || [])) {
      const matriculados = (turma.students || []).length;
      if (matriculados === 0) {
        averages[turma.id] = 0;
        continue;
      }
      const semanasData = frequenciaData[turma.id] || {};
      const validWeeks = Object.entries(semanasData).filter(([, presentes]) => presentes !== '' && presentes !== null);
      
      if (validWeeks.length === 0) {
        averages[turma.id] = 0;
        continue;
      }
      
      const totalPresentes = validWeeks.reduce((sum, [, presentes]) => sum + Number(presentes), 0);
      const totalPossivel = validWeeks.length * matriculados;
      averages[turma.id] = (totalPresentes / totalPossivel) * 100;
    }
    return averages;
  }, [frequenciaData, classes]);

  const getModuloAtual = (turma) => {
    if (!turma.modules || turma.modules.length === 0) {
      return null;
    }
    return turma.modules[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (error) {
      return null;
    }
  };

  const handleSave = async (turmaId, turma) => {
    setLoadingStates(prev => ({ ...prev, [turmaId]: true }));
    const matriculados = (turma.students || []).length;
    const semanasData = frequenciaData[turma.id] || {};
    const semanas = Object.entries(semanasData)
      .filter(([, presentes]) => presentes !== '' && presentes !== null)
      .map(([semana, presentes]) => ({
        semana: Number(semana),
        matriculados: matriculados,
        presentes: Number(presentes),
      }));

    if (semanas.length === 0) {
      toast.error('Nenhum dado de frequência preenchido para esta turma.');
      setLoadingStates(prev => ({ ...prev, [turmaId]: false }));
      return;
    }

    const frequenciaGeral = monthlyAverages[turma.id] || 0;

    try {
      const retufQuery = query(collection(db, 'retuf'), where('turmaId', '==', turmaId), where('ano', '==', Number(ano)), where('mes', '==', Number(mes)));
      const querySnapshot = await getDocs(retufQuery);

      if (querySnapshot.empty) {
        await addDoc(collection(db, 'retuf'), { turmaId, turmaName: turma.name, mes: Number(mes), ano: Number(ano), semanas, frequenciaGeral, lastUpdated: serverTimestamp() });
        toast.success(`Frequência da turma ${turma.name} salva!`);
      } else {
        const docId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, 'retuf', docId), { semanas, frequenciaGeral, lastUpdated: serverTimestamp() });
        toast.success(`Frequência da turma ${turma.name} atualizada!`);
      }
    } catch (error) {
      console.error("Erro ao salvar frequência: ", error);
      toast.error("Ocorreu um erro ao salvar os dados.");
    } finally {
      setLoadingStates(prev => ({ ...prev, [turmaId]: false }));
    }
  };
  
  // Listas únicas para os filtros
  const uniqueProfessores = useMemo(() => {
    const professores = new Set();
    classes.forEach(turma => {
      if (turma.professorName) professores.add(turma.professorName);
    });
    return Array.from(professores).sort();
  }, [classes]);

  const uniqueModulos = useMemo(() => {
    const modulos = new Set();
    classes.forEach(turma => {
      const modulo = getModuloAtual(turma);
      if (modulo && (modulo.name || modulo.id)) {
        modulos.add(modulo.name || modulo.id);
      }
    });
    return Array.from(modulos).sort();
  }, [classes]);

  const uniqueDiasSemana = useMemo(() => {
    const dias = new Set();
    classes.forEach(turma => {
      if (turma.dia_semana) dias.add(turma.dia_semana);
    });
    return Array.from(dias).sort((a, b) => {
      const ordem = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
      return ordem.indexOf(a) - ordem.indexOf(b);
    });
  }, [classes]);

  const uniqueHorarios = useMemo(() => {
    const horarios = new Set();
    classes.forEach(turma => {
      if (turma.horario) horarios.add(turma.horario);
    });
    return Array.from(horarios).sort();
  }, [classes]);

  const turmasFiltradas = useMemo(() => {
    return (classes || [])
      .filter(turma => {
        // Filtros básicos
        if (turma.isMapaOnly === true) return false;
        const nomeLowerCase = turma.name?.toLowerCase() || '';
        if (nomeLowerCase.includes('nexus')) return false;

        // Filtro por professor
        if (filters.professor && turma.professorName !== filters.professor) return false;

        // Filtro por módulo
        if (filters.modulo) {
          const modulo = getModuloAtual(turma);
          const moduloNome = modulo ? (modulo.name || modulo.id) : null;
          if (moduloNome !== filters.modulo) return false;
        }

        // Filtro por dia da semana
        if (filters.diaSemana && turma.dia_semana !== filters.diaSemana) return false;

        // Filtro por horário
        if (filters.horario && turma.horario !== filters.horario) return false;

        // Filtro por data de término
        if (filters.dataTermino) {
          const dataTermino = turma.dataTermino;
          if (!dataTermino || dataTermino !== filters.dataTermino) return false;
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, filters]);

  // Calcular estatísticas das turmas filtradas
  const filteredStats = useMemo(() => {
    const turmasComFrequencia = turmasFiltradas.filter(turma => {
      const freq = monthlyAverages[turma.id];
      return freq && freq > 0;
    });

    if (turmasComFrequencia.length === 0) {
      return {
        totalTurmas: turmasFiltradas.length,
        turmasComDados: 0,
        mediaGeral: 0,
        totalAlunos: turmasFiltradas.reduce((sum, t) => sum + (t.students?.length || 0), 0),
        melhorFrequencia: 0,
        piorFrequencia: 0
      };
    }

    const frequencias = turmasComFrequencia.map(t => monthlyAverages[t.id]);
    const mediaGeral = frequencias.reduce((sum, f) => sum + f, 0) / frequencias.length;
    const melhorFrequencia = Math.max(...frequencias);
    const piorFrequencia = Math.min(...frequencias);
    const totalAlunos = turmasFiltradas.reduce((sum, t) => sum + (t.students?.length || 0), 0);

    return {
      totalTurmas: turmasFiltradas.length,
      turmasComDados: turmasComFrequencia.length,
      mediaGeral,
      totalAlunos,
      melhorFrequencia,
      piorFrequencia
    };
  }, [turmasFiltradas, monthlyAverages]);

  const toggleCard = (turmaId) => {
    setExpandedCards(prev => ({
      ...prev,
      [turmaId]: !prev[turmaId]
    }));
  };

  const getMesNome = (mesNum) => {
    return new Date(2000, mesNum - 1, 1).toLocaleString('pt-BR', { month: 'long' });
  };

  const formatDiaSemana = (dia) => {
    if (!dia) return null;
    const dias = {
      'Segunda-feira': 'Seg',
      'Terça-feira': 'Ter',
      'Quarta-feira': 'Qua',
      'Quinta-feira': 'Qui',
      'Sexta-feira': 'Sex',
      'Sábado': 'Sáb',
      'Domingo': 'Dom'
    };
    return dias[dia] || dia;
  };

  const clearFilters = () => {
    setFilters({
      professor: '',
      modulo: '',
      diaSemana: '',
      horario: '',
      dataTermino: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-600 rounded-xl">
              <ListChecks size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">RETUF - Controle de Frequência</h1>
              <p className="text-gray-600 mt-1">Sistema de Registro e Acompanhamento de Presença</p>
            </div>
          </div>

          {/* Filtros de Período */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Período:</span>
              <select 
                value={mes} 
                onChange={e => setMes(Number(e.target.value))} 
                className="px-4 py-2 border-2 border-blue-300 rounded-lg bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all capitalize"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m} className="capitalize">
                    {getMesNome(m)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Ano:</span>
              <input 
                type="number" 
                value={ano} 
                onChange={e => setAno(Number(e.target.value))} 
                className="px-4 py-2 border-2 border-blue-300 rounded-lg w-28 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ano"
              />
            </div>

            <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-2 border-blue-300">
              <Info size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {turmasFiltradas.length} turma{turmasFiltradas.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Botão de Filtros Avançados */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter size={18} />
              Filtros Avançados
              {hasActiveFilters && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
              >
                <X size={18} />
                Limpar Filtros
              </button>
            )}
          </div>

          {/* Painel de Filtros Avançados */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro Professor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" />
                    Professor
                  </label>
                  <select
                    value={filters.professor}
                    onChange={(e) => setFilters(prev => ({ ...prev, professor: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {uniqueProfessores.map(prof => (
                      <option key={prof} value={prof}>{prof}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Módulo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <BookOpen size={16} className="inline mr-1" />
                    Módulo Atual
                  </label>
                  <select
                    value={filters.modulo}
                    onChange={(e) => setFilters(prev => ({ ...prev, modulo: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {uniqueModulos.map(mod => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Dia da Semana */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CalendarDays size={16} className="inline mr-1" />
                    Dia da Semana
                  </label>
                  <select
                    value={filters.diaSemana}
                    onChange={(e) => setFilters(prev => ({ ...prev, diaSemana: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {uniqueDiasSemana.map(dia => (
                      <option key={dia} value={dia}>{dia}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Horário */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Horário
                  </label>
                  <select
                    value={filters.horario}
                    onChange={(e) => setFilters(prev => ({ ...prev, horario: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {uniqueHorarios.map(hor => (
                      <option key={hor} value={hor}>{hor}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Data de Término */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Data de Término
                  </label>
                  <input
                    type="date"
                    value={filters.dataTermino}
                    onChange={(e) => setFilters(prev => ({ ...prev, dataTermino: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card de Estatísticas do Filtro */}
      {hasActiveFilters && filteredStats.turmasComDados > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={32} />
              <h2 className="text-2xl font-bold">Estatísticas do Filtro</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Média Geral */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm opacity-90 mb-1">Frequência Média</p>
                <p className="text-3xl font-bold">{filteredStats.mediaGeral.toFixed(1)}%</p>
              </div>

              {/* Total de Turmas */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm opacity-90 mb-1">Turmas Filtradas</p>
                <p className="text-3xl font-bold">{filteredStats.totalTurmas}</p>
                <p className="text-xs opacity-75">{filteredStats.turmasComDados} com dados</p>
              </div>

              {/* Total de Alunos */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm opacity-90 mb-1">Total de Alunos</p>
                <p className="text-3xl font-bold">{filteredStats.totalAlunos}</p>
              </div>

              {/* Melhor/Pior Frequência */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm opacity-90 mb-1">Melhor / Pior</p>
                <p className="text-2xl font-bold">
                  {filteredStats.melhorFrequencia.toFixed(1)}% / {filteredStats.piorFrequencia.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Turmas */}
      <div className="max-w-7xl mx-auto space-y-4">
        {turmasFiltradas.length > 0 ? (
          turmasFiltradas.map(turma => {
            const matriculados = (turma.students || []).length;
            const mediaMensal = monthlyAverages[turma.id] || 0;
            const isExpanded = expandedCards[turma.id];
            const moduloAtual = getModuloAtual(turma);
            const dataTermino = formatDate(turma.dataTermino);
            const professorName = turma.professorName || 'Não definido';
            const diaSemana = formatDiaSemana(turma.dia_semana);
            const horario = turma.horario;

            return(
              <div key={turma.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-200">
                {/* Header do Card - Sempre visível */}
                <div 
                  className="p-6 cursor-pointer bg-gradient-to-r from-white to-blue-50"
                  onClick={() => toggleCard(turma.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Info da Turma */}
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">{turma.name}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-semibold text-sm">
                            {matriculados} {matriculados === 1 ? 'Aluno' : 'Alunos'}
                          </span>
                          
                          {professorName && professorName !== 'Não definido' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 font-semibold text-sm">
                              <User size={14} />
                              {professorName}
                            </span>
                          )}
                          
                          {moduloAtual && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 text-purple-700 font-semibold text-sm">
                              <BookOpen size={14} />
                              {moduloAtual.name || moduloAtual.id}
                            </span>
                          )}
                          
                          {diaSemana && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-100 text-cyan-700 font-semibold text-sm">
                              <CalendarDays size={14} />
                              {diaSemana}
                            </span>
                          )}
                          
                          {horario && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-100 text-teal-700 font-semibold text-sm">
                              <Clock size={14} />
                              {horario}
                            </span>
                          )}
                          
                          {dataTermino ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 font-semibold text-sm">
                              <Calendar size={14} />
                              Término: {dataTermino}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 text-orange-700 font-semibold text-sm">
                              <Calendar size={14} />
                              Término: Data não definida
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Média e Ações */}
                    <div className="flex items-center gap-4">
                      {/* Badge de Frequência */}
                      <div className={`px-4 py-3 rounded-xl ${
                        mediaMensal >= 75 ? 'bg-green-100' : 
                        mediaMensal >= 50 ? 'bg-yellow-100' : 
                        'bg-red-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`${
                            mediaMensal >= 75 ? 'text-green-600' : 
                            mediaMensal >= 50 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`} size={20} />
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Frequência</p>
                            <p className={`text-2xl font-bold ${
                              mediaMensal >= 75 ? 'text-green-600' : 
                              mediaMensal >= 50 ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {mediaMensal.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Botão Expandir */}
                      <button
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCard(turma.id);
                        }}
                      >
                        {isExpanded ? <ChevronUp size={24} className="text-blue-600" /> : <ChevronDown size={24} className="text-blue-600" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expansível */}
                {isExpanded && (
                  <div className="p-6 bg-gray-50 border-t-2 border-blue-100">
                    {/* Grid de Semanas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                      {[1, 2, 3, 4, 5].map(semana => {
                        const presentes = frequenciaData[turma.id]?.[semana];
                        const freqSemanal = matriculados > 0 && presentes !== '' && presentes !== null ? (Number(presentes) / matriculados) * 100 : 0;
                        
                        return (
                          <div key={semana} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                              <span>Semana {semana}</span>
                              {presentes !== '' && presentes !== null && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  freqSemanal >= 75 ? 'bg-green-100 text-green-700' :
                                  freqSemanal >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {freqSemanal.toFixed(0)}%
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              placeholder="Nº presentes"
                              value={presentes || ''}
                              onChange={(e) => handlePresentesChange(turma.id, semana, e.target.value)}
                              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 transition-all"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Botão Salvar */}
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(turma.id, turma);
                        }}
                        disabled={loadingStates[turma.id]}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        {loadingStates[turma.id] ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Save size={20} />
                            <span>Salvar Frequência</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Info className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Nenhuma turma encontrada</h3>
              <p className="text-gray-600">
                {hasActiveFilters 
                  ? 'Nenhuma turma corresponde aos filtros selecionados.' 
                  : 'Não há turmas disponíveis para o período selecionado.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetufPage;