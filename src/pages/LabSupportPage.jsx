import { useState, useEffect } from "react";
import AddLabEntryModal from "../components/AddLabEntryModal";
import LabEntriesTable from "../components/LabEntriesTable";
import {
  PlusCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Search, // Importar o ícone de busca
} from "lucide-react";
import { useClasses } from "../contexts/ClassContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  serverTimestamp,
  query,
  // 'where' foi removido da query principal
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  orderBy, // Adicionado para ordenar os resultados
} from "firebase/firestore";
import toast from "react-hot-toast";
import HorariosAtendimento from "../components/HorariosAtendimento";
import { getWeekdayName } from "../utils/labScheduleConfig";

function LabSupportPage() {
  const { userProfile } = useAuth();
  const { allStudentsMap } = useClasses();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
  // --- ESTADOS MODIFICADOS E ADICIONADOS ---
  const [allLabEntries, setAllLabEntries] = useState([]); // Renomeado de labEntries
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [weekdayName, setWeekdayName] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Novo estado para a busca

  // Atualiza o nome do dia da semana quando a data muda
  useEffect(() => {
    if (selectedDate) {
      const dayName = getWeekdayName(selectedDate);
      setWeekdayName(dayName);
    }
  }, [selectedDate]);

  // --- EFFECT MODIFICADO ---
  // Agora busca TODOS os atendimentos de uma vez, para a busca funcionar
  useEffect(() => {
    setLoadingEntries(true);
    
    // Query agora busca todos os registros, ordenados pelos mais recentes
    const q = query(
      collection(db, "labEntries"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const entriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllLabEntries(entriesData); // Salva no novo estado
      setLoadingEntries(false);
    });
    return () => unsubscribe();
  }, []); // Dependência vazia, executa apenas uma vez

  // Função para navegar entre datas
  const changeDate = (days) => {
    const currentDate = new Date(selectedDate + "T12:00:00");
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const goToPreviousDay = () => changeDate(-1);
  const goToNextDay = () => changeDate(1);

  // Modificado para receber a data do modal
  const handleAddEntry = async (entryData, repeatWeeks, entryDate) => {
    if (!entryData.studentCode || !entryData.studentName) {
      return toast.error("Código e nome do aluno são obrigatórios.");
    }

    const numberOfEntries = repeatWeeks > 1 ? repeatWeeks : 1;

    try {
      const batch = writeBatch(db);
      const initialDate = new Date(entryDate + "T12:00:00");

      for (let i = 0; i < numberOfEntries; i++) {
        const targetDate = new Date(initialDate);
        targetDate.setDate(targetDate.getDate() + i * 7);

        const entryDateString = targetDate.toISOString().split("T")[0];

        const newLabEntry = {
          ...entryData,
          isDone: false,
          entryDate: entryDateString,
          createdAt: serverTimestamp(),
          createdByUid: userProfile.id,
          createdByName: userProfile.name,
          createdByRole: userProfile.role,
        };

        const docRef = doc(collection(db, "labEntries"));
        batch.set(docRef, newLabEntry);
      }

      await batch.commit();

      toast.success(
        numberOfEntries > 1
          ? `${numberOfEntries} atendimentos agendados!`
          : "Atendimento salvo!"
      );

      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar atendimento(s): ", error);
      toast.error("Ocorreu um erro ao salvar.");
    }
  };

  const handleStatusChange = async (entryId, newStatus) => {
    const entryDocRef = doc(db, "labEntries", entryId);
    try {
      await updateDoc(entryDocRef, { isDone: newStatus });
      toast.success(
        `Atendimento marcado como ${newStatus ? "realizado" : "não realizado"}.`
      );
    } catch (error) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleEntryUpdate = async (entryId, updatedData) => {
    const entryDocRef = doc(db, "labEntries", entryId);
    try {
      await updateDoc(entryDocRef, updatedData);
      toast.success("Atendimento atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar o atendimento.");
    }
  };

  const handleEntryDelete = async (entryId) => {
    if (window.confirm("Tem certeza que deseja remover este atendimento?")) {
      const entryDocRef = doc(db, "labEntries", entryId);
      try {
        await deleteDoc(entryDocRef);
        toast.success("Atendimento removido com sucesso.");
      } catch (error) {
        toast.error("Erro ao remover o atendimento.");
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // --- NOVA LÓGICA DE FILTRAGEM ---
  const filteredEntries = allLabEntries.filter((entry) => {
    const searchTermLower = searchTerm.toLowerCase();

    // Se o termo de busca estiver preenchido, priorize a busca
    if (searchTermLower) {
      const nameMatch = (entry.studentName || "")
        .toLowerCase()
        .includes(searchTermLower);
      const codeMatch = (entry.studentCode || "") // Usando studentCode como no seu handleAddEntry
        .toLowerCase()
        .includes(searchTermLower);
      return nameMatch || codeMatch;
    }

    // Se o termo de busca estiver vazio, use o filtro de data
    return entry.entryDate === selectedDate;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Controle do Laboratório de Apoio
        </h1>

        {/* Botão para Estatísticas */}
        <button
          onClick={() => navigate("/laboratorio/estatisticas")}
          className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition shadow-md"
        >
          <BarChart3 size={20} />
          Ver Estatísticas
        </button>
      </div>

      {/* --- BARRA DE CONTROLES MODIFICADA --- */}
      <div className="flex flex-col bg-white p-4 rounded-lg shadow-md mb-8 gap-4">
        {/* --- CAMPO DE BUSCA ADICIONADO --- */}
        <div className="relative w-full">
          <label
            htmlFor="search-filter"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Buscar Aluno por Nome ou Matrícula
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={20} className="text-gray-400" />
            </span>
            <input
              id="search-filter"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou código do aluno..."
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
           {/* Mensagem de ajuda quando estiver buscando */}
           {searchTerm && (
            <p className="text-xs text-gray-500 mt-1">
              Mostrando resultados de busca. Limpe o campo para ver por data.
            </p>
          )}
        </div>

        {/* --- CONTROLES DE DATA E BOTÃO --- */}
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <label
                htmlFor="date-filter"
                className="font-semibold text-gray-700 whitespace-nowrap"
              >
                {!searchTerm ? "Selecione a Data:" : "Data selecionada:"}
              </label>

              <button
                onClick={goToPreviousDay}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
                title="Dia anterior"
                disabled={!!searchTerm} // Desabilita botões de data ao buscar
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>

              <input
                id="date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg"
                disabled={!!searchTerm} // Desabilita input de data ao buscar
              />

              <button
                onClick={goToNextDay}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
                title="Próximo dia"
                disabled={!!searchTerm} // Desabilita botões de data ao buscar
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </div>

            {weekdayName && !searchTerm && ( // Só mostra o dia da semana se não estiver buscando
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {weekdayName} - {formatDate(selectedDate)}
                </span>
              </div>
            )}
          </div>

          {userProfile && userProfile.role !== "financeiro" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md w-full md:w-auto"
            >
              <PlusCircle size={20} />
              Adicionar Atendimento
            </button>
          )}
        </div>
      </div>

      <HorariosAtendimento />

      <div className="mt-8">
        {loadingEntries ? (
          <p className="text-center text-gray-500">
            Carregando atendimentos...
          </p>
        ) : (
          <LabEntriesTable
            entries={filteredEntries} // Passa os entries filtrados
            onStatusChange={handleStatusChange}
            onEntryUpdate={handleEntryUpdate}
            onEntryDelete={handleEntryDelete}
          />
        )}
      </div>

      <AddLabEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddEntry}
        allStudentsMap={allStudentsMap}
        selectedDate={selectedDate}
      />
    </div>
  );
}

export default LabSupportPage;