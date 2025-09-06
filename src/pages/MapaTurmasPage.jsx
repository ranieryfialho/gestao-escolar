import { useState, useMemo } from "react";
import { useClasses } from "../contexts/ClassContext";
import { useUsers } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import { masterModuleList } from "../data/mockData.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase.js";
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  PlusCircle,
  Trash2,
  Pencil,
  Save,
  X,
  Search,
  FileDown,
  XCircle,
} from "lucide-react";
import MapaClassModal from "../components/MapaClassModal";
import InstructorStats from "../components/InstructorStats";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return "-";
  let date;
  if (typeof dateValue === "string") {
    const [year, month, day] = dateValue.split("-");
    if (year && month && day) {
      date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );
    } else {
      date = new Date(dateValue);
    }
  } else if (dateValue.toDate) {
    date = dateValue.toDate();
  } else {
    date = new Date(dateValue);
  }
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
};
const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  let date;
  if (typeof dateValue === "string") {
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue;
    const [year, month, day] = dateValue.split("-");
    if (year && month && day) {
      date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );
    } else {
      date = new Date(dateValue);
    }
  } else if (dateValue.toDate) {
    date = dateValue.toDate();
  } else {
    date = new Date(dateValue);
  }
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  if (typeof dateValue === "string") {
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateValue.split("-");
      return new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );
    }
    return new Date(dateValue);
  } else if (dateValue.toDate) {
    return dateValue.toDate();
  } else if (dateValue instanceof Date) {
    return dateValue;
  }
  return null;
};

const getDisplayModules = (turma) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (!turma.modules || turma.modules.length === 0) {
    return { moduloAtual: "Sem Módulos", proximoModulo: "-" };
  }

  let currentModuleId;

  if (turma.mapa_modulo_atual_id) {
    currentModuleId = turma.mapa_modulo_atual_id;
  } else {
    const modAtualPorData = turma.modules.find((mod) => {
      const inicio = parseDate(mod.dataInicio);
      const termino = parseDate(mod.dataTermino);
      return inicio && termino && hoje >= inicio && hoje <= termino;
    });

    if (modAtualPorData) {
      currentModuleId = modAtualPorData.id;
    } else {
      const modulosPassados = turma.modules
        .filter((mod) => {
          const termino = parseDate(mod.dataTermino);
          return termino && termino < hoje;
        })
        .sort((a, b) => parseDate(b.dataTermino) - parseDate(a.dataTermino));

      if (modulosPassados.length > 0) {
        currentModuleId = modulosPassados[0].id;
      } else {
        currentModuleId = turma.modules[0].id;
      }
    }
  }

  const currentIndex = turma.modules.findIndex(
    (mod) => mod.id === currentModuleId
  );

  if (currentIndex === -1) {
    return { moduloAtual: currentModuleId, proximoModulo: "N/A" };
  }

  const moduloAtual = turma.modules[currentIndex].id;
  const proximoModulo = turma.modules[currentIndex + 1]?.id || "Finalizado";

  return { moduloAtual, proximoModulo };
};

function MapaTurmasPage() {
  const { classes, loadingClasses } = useClasses();
  const { users } = useUsers();
  const { userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canEditMap =
    userProfile &&
    ["coordenador", "auxiliar_coordenacao", "diretor", "admin"].includes(
      userProfile.role
    );
  const hasRestrictedAccess =
    userProfile?.role === "secretaria" || userProfile?.role === "comercial";

  const [editingRowId, setEditingRowId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState(location.state || null);

  const moduleOptions = Object.keys(masterModuleList);

  const sortedClasses = useMemo(() => {
    const dayOrder = {
      "Segunda-feira": 1,
      "Terça-feira": 2,
      "Quarta-feira": 3,
      "Quinta-feira": 4,
      "Sexta-feira": 5,
      Sábado: 6,
    };
    return classes
      .filter((turma) => turma.name !== "CONCLUDENTES")
      .sort((a, b) => {
        const dayA = dayOrder[a.dia_semana] || 99;
        const dayB = dayOrder[b.dia_semana] || 99;
        if (dayA !== dayB) return dayA - dayB;
        const timeA = a.horario
          ? parseInt(a.horario.replace(":", ""), 10)
          : 9999;
        const timeB = b.horario
          ? parseInt(b.horario.replace(":", ""), 10)
          : 9999;
        return timeA - timeB;
      });
  }, [classes]);

  const instructorStats = useMemo(
    () =>
      Object.values(
        sortedClasses.reduce((acc, turma) => {
          const professor = turma.professorName || "Não Definido";
          if (!acc[professor]) acc[professor] = { name: professor, count: 0 };
          acc[professor].count++;
          return acc;
        }, {})
      ).sort((a, b) => b.count - a.count),
    [sortedClasses]
  );

  const filteredClasses = useMemo(() => {
    let result = sortedClasses;
    if (activeFilter?.filter === "module" && activeFilter.moduleName) {
      result = result.filter((turma) =>
        getDisplayModules(turma).moduloAtual.startsWith(activeFilter.moduleName)
      );
    }
    if (selectedInstructor) {
      result = result.filter(
        (turma) =>
          (turma.professorName || "Não Definido") === selectedInstructor
      );
    }
    if (searchTerm.trim() !== "") {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      result = result.filter((turma) =>
        [
          turma.name,
          turma.professorName,
          turma.sala,
          turma.horario,
          turma.dia_semana,
          getDisplayModules(turma).moduloAtual,
        ]
          .join(" ")
          .toLowerCase()
          .includes(lowerCaseSearchTerm)
      );
    }
    return result;
  }, [sortedClasses, selectedInstructor, searchTerm, activeFilter]);

  const instructorOptions = users.filter((u) =>
    [
      "professor",
      "coordenador",
      "diretor",
      "auxiliar_coordenacao",
      "professor_apoio",
    ].includes(u.role)
  );
  const roomOptions = ["Lab 01", "Lab 02", "Lab 03", "EAD"];
  const scheduleOptions = [
    "07:30 as 09:20",
    "09:30 as 11:20",
    "11:30 as 13:20",
    "13:30 as 15:20",
    "15:30 as 17:20",
    "19:00 as 21:20",
  ];
  const dayOptions = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  const handleStartEdit = (turma) => {
    setEditingRowId(turma.id);
    const { moduloAtual } = getDisplayModules(turma);
    setEditedData({
      data_inicio: formatDateForInput(turma.dataInicio),
      data_termino: formatDateForInput(turma.dataTermino),
      instrutor: turma.professorName || "",
      sala: turma.sala || "",
      horario: turma.horario || "",
      dia_semana: turma.dia_semana || "",
      modulo_atual: turma.mapa_modulo_atual_id || "AUTOMATICO",
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditedData({});
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (turmaId) => {
    const dataToSave = {
      professorName: editedData.instrutor,
      sala: editedData.sala,
      horario: editedData.horario,
      dataInicio: editedData.data_inicio,
      dataTermino: editedData.data_termino,
      dia_semana: editedData.dia_semana,
      mapa_modulo_atual_id:
        editedData.modulo_atual === "AUTOMATICO" ? "" : editedData.modulo_atual,
    };

    const classDocRef = doc(db, "classes", turmaId);
    await toast.promise(updateDoc(classDocRef, dataToSave), {
      loading: "Salvando alterações...",
      success: "Turma atualizada com sucesso!",
      error: "Erro ao atualizar a turma.",
    });

    handleCancelEdit();
  };

  const handleDeleteMapClass = async (turmaId, turmaName) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-2">
        <span>Apagar "{turmaName}"?</span>
        <div className="flex gap-2">
          <button
            className="w-full bg-red-600 text-white font-bold px-4 py-2 rounded-lg"
            onClick={async () => {
              await toast.promise(deleteDoc(doc(db, "classes", turmaId)), {
                loading: "Apagando...",
                success: "Turma apagada.",
                error: "Erro.",
              });
              toast.dismiss(t.id);
            }}
          >
            Confirmar
          </button>
          <button
            className="w-full bg-gray-300 px-4 py-2 rounded-lg"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ));
  };

  const handleAddMapClass = async (formData) => {
    const dataToSave = {
      name: formData.nome_turma,
      professorName: formData.instrutor,
      sala: formData.sala,
      horario: formData.horario,
      dataInicio: formData.data_inicio || "",
      dataTermino: formData.data_termino || "",
      dia_semana: formData.dia_semana,
      modules: [{ id: formData.modulo_atual || "" }],
      isMapaOnly: true,
      students: [],
    };
    await toast.promise(addDoc(collection(db, "classes"), dataToSave), {
      loading: "Adicionando...",
      success: "Turma de planejamento adicionada!",
      error: "Erro.",
    });
    setIsAddModalOpen(false);
  };

  const handleExportPDF = () => {
  };

  if (loadingClasses)
    return <div className="p-8">Carregando mapa de turmas...</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Mapa de Turmas</h1>
        <div className="flex items-center gap-4">
          {canEditMap && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <PlusCircle size={18} />
              <span>Adicionar Curso Extra</span>
            </button>
          )}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FileDown size={18} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar turma, instrutor, sala, módulo..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>
      <InstructorStats
        stats={instructorStats}
        onSelect={(name) =>
          setSelectedInstructor(selectedInstructor === name ? null : name)
        }
        selected={selectedInstructor}
      />
      {activeFilter && (
        <div className="flex justify-between items-center mb-4 p-3 bg-blue-50 border-blue-200 rounded-lg">
          <span className="text-sm font-semibold text-blue-800">{`Filtro ativo: ${activeFilter.moduleName}`}</span>
          <button
            onClick={() => {
              setActiveFilter(null);
              navigate(location.pathname, { replace: true, state: {} });
            }}
            className="flex items-center gap-1 text-sm text-red-600 font-bold"
          >
            <XCircle size={16} />
            Limpar
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                Dia
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                Horário
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                Turma
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                Módulo Atual
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                Próx. Módulo
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                Início
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                Término
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                Instrutor
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                Sala
              </th>
              {canEditMap && (
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClasses.map((turma) => {
              const isEditing = editingRowId === turma.id;
              const { moduloAtual, proximoModulo } = getDisplayModules(turma);
              const displayProximoModulo = isEditing
                ? turma.modules[
                    turma.modules.findIndex(
                      (m) => m.id === editedData.modulo_atual
                    ) + 1
                  ]?.id || "Finalizado"
                : proximoModulo;

              return (
                <tr
                  key={turma.id}
                  className={isEditing ? "bg-blue-50" : "hover:bg-gray-50"}
                >
                  <td className="p-1 font-semibold">
                    {isEditing ? (
                      <select
                        name="dia_semana"
                        value={editedData.dia_semana}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    ) : (
                      turma.dia_semana || "-"
                    )}
                  </td>
                  <td className="p-1">
                    {isEditing ? (
                      <select
                        name="horario"
                        value={editedData.horario}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        {scheduleOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      turma.horario || "-"
                    )}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    {!turma.isMapaOnly && !hasRestrictedAccess ? (
                      <Link
                        to={`/turma/${turma.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {turma.name}
                      </Link>
                    ) : (
                      <span>{turma.name}</span>
                    )}
                  </td>

                  <td className="p-1">
                    {isEditing ? (
                      <select
                        name="modulo_atual"
                        value={editedData.modulo_atual}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="AUTOMATICO">
                          -- Automático por Data --
                        </option>

                        {moduleOptions.map((modId) => (
                          <option key={modId} value={modId}>
                            {modId}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{moduloAtual}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{displayProximoModulo}</td>

                  <td className="p-1">
                    {isEditing ? (
                      <input
                        type="date"
                        name="data_inicio"
                        value={editedData.data_inicio}
                        onChange={handleEditChange}
                        className="w-32 p-2 border rounded-md"
                      />
                    ) : (
                      formatDateForDisplay(turma.dataInicio)
                    )}
                  </td>
                  <td className="p-1">
                    {isEditing ? (
                      <input
                        type="date"
                        name="data_termino"
                        value={editedData.data_termino}
                        onChange={handleEditChange}
                        className="w-32 p-2 border rounded-md"
                      />
                    ) : (
                      formatDateForDisplay(turma.dataTermino)
                    )}
                  </td>
                  <td className="p-1">
                    {isEditing ? (
                      <select
                        name="instrutor"
                        value={editedData.instrutor}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">A definir</option>
                        {instructorOptions.map((i) => (
                          <option key={i.id} value={i.name}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      turma.professorName || "-"
                    )}
                  </td>
                  <td className="p-1">
                    {isEditing ? (
                      <select
                        name="sala"
                        value={editedData.sala}
                        onChange={handleEditChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">A definir</option>
                        {roomOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      turma.sala || "-"
                    )}
                  </td>

                  {canEditMap && (
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-4">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(turma.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Salvar"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-700"
                              title="Cancelar"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(turma)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            {turma.isMapaOnly && (
                              <button
                                onClick={() =>
                                  handleDeleteMapClass(turma.id, turma.name)
                                }
                                className="text-red-600 hover:text-red-800"
                                title="Apagar"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredClasses.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Nenhuma turma encontrada.
          </p>
        )}
      </div>
      {canEditMap && (
        <MapaClassModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddMapClass}
          instructors={instructorOptions}
        />
      )}
    </div>
  );
}

export default MapaTurmasPage;