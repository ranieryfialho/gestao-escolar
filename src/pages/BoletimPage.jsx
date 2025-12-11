import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useClasses } from "../contexts/ClassContext";
import { useUsers } from "../contexts/UserContext";
import CreateClassForm from "../components/CreateClassForm";
import { modulePackages, masterModuleList } from "../data/mockData";
import toast from "react-hot-toast";
import { GraduationCap, Users, School } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

// Constante para a chave do localStorage
const SELECTED_SCHOOL_KEY = "boletim_selected_school_id";

function BoletimPage() {
  const { userProfile } = useAuth();
  const { classes, addClass, loadingClasses } = useClasses();
  const { users } = useUsers();
  const location = useLocation();

  const [teacherList, setTeacherList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClasses, setFilteredClasses] = useState([]);

  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const isNexusUser = location.state?.isNexusUser || userProfile?.role === "professor_nexus";
  const lockedSchoolId = location.state?.lockedSchoolId;

  const isUserAdmin =
    userProfile &&
    ["coordenador", "diretor", "admin"].includes(userProfile.role);

  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsCollection = collection(db, "schools");
      const schoolSnapshot = await getDocs(schoolsCollection);
      const schoolList = schoolSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSchools(schoolList);
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    if (schools.length > 0) {
      if (isNexusUser && lockedSchoolId) {
        setSelectedSchoolId(lockedSchoolId);
      } else {
        const savedSchoolId = localStorage.getItem(SELECTED_SCHOOL_KEY);
        if (savedSchoolId) {
          const schoolExists = schools.some(
            (school) => school.id === savedSchoolId
          );
          if (schoolExists) {
            setSelectedSchoolId(savedSchoolId);
          } else {
            localStorage.removeItem(SELECTED_SCHOOL_KEY);
          }
        }
      }
    }
  }, [schools, isNexusUser, lockedSchoolId]);

  const handleSchoolChange = (schoolId) => {
    if (isNexusUser) {
      return;
    }
    
    setSelectedSchoolId(schoolId);
    if (schoolId) {
      localStorage.setItem(SELECTED_SCHOOL_KEY, schoolId);
    } else {
      localStorage.removeItem(SELECTED_SCHOOL_KEY);
    }
    setSearchTerm("");
  };

  useEffect(() => {
    const rolesPermitidos = [
      "professor",
      "coordenador",
      "auxiliar_coordenacao",
      "diretor",
    ];
    setTeacherList(users.filter((user) => rolesPermitidos.includes(user.role)));
  }, [users]);

  useEffect(() => {
    if (loadingClasses || !selectedSchoolId) {
      setFilteredClasses([]);
      return;
    }
    let schoolClasses = classes.filter(
      (c) =>
        c.schoolId === selectedSchoolId &&
        c.name &&
        !c.isMapaOnly &&
        c.name !== "CONCLUDENTES"
    );
    const results = schoolClasses.filter((turma) => {
      const searchTermLower = searchTerm.toLowerCase();

      if (turma.name.toLowerCase().includes(searchTermLower)) {
        return true;
      }

      if (
        turma.professorName &&
        turma.professorName.toLowerCase().includes(searchTermLower)
      ) {
        return true;
      }

      if (turma.students && turma.students.length > 0) {
        const studentMatch = turma.students.some((student) => {
          const nameMatch =
            student.name &&
            student.name.toLowerCase().includes(searchTermLower);

          const codeMatch =
            student.code &&
            student.code.toString().toLowerCase().includes(searchTermLower);

          const matriculaMatch =
            student.matricula &&
            student.matricula
              .toString()
              .toLowerCase()
              .includes(searchTermLower);

          return nameMatch || codeMatch || matriculaMatch;
        });
        if (studentMatch) {
          return true;
        }
      }

      return false;
    });
    results.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredClasses(results);
  }, [classes, loadingClasses, selectedSchoolId, searchTerm]);

  const handleCreateClass = async (
    className,
    selectedPackageId,
    teacherId,
    scheduleData,
    schoolId
  ) => {
    const selectedPackage = modulePackages.find(
      (p) => p.id === selectedPackageId
    );
    const selectedTeacher = teacherList.find((t) => t.id === teacherId);
    if (!selectedPackage || !selectedTeacher || !schoolId) {
      return alert("Pacote, professor e escola são obrigatórios.");
    }
    const classModules = selectedPackage.moduleKeys.map(
      (key) => masterModuleList[key]
    );
    const newClassData = {
      name: className,
      professorId: selectedTeacher.id,
      professorName: selectedTeacher.name,
      modules: classModules,
      curriculumId: selectedPackageId,
      createdAt: new Date(),
      students: [],
      ...scheduleData,
      isMapaOnly: false,
      schoolId: schoolId,
    };
    await addClass(newClassData);
    toast.success(`Turma "${className}" criada com sucesso!`);
  };

  const getSelectedSchoolName = () => {
    const selectedSchool = schools.find(
      (school) => school.id === selectedSchoolId
    );
    return selectedSchool ? selectedSchool.name : "";
  };

  return (
    <div className="p-4 md:p-8">
      {isUserAdmin && !isNexusUser && (
        <CreateClassForm
          onClassCreated={handleCreateClass}
          packages={modulePackages}
          teachers={teacherList}
        />
      )}

      <div className="my-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-1/3">
          <label
            htmlFor="school-filter"
            className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
          >
            <School size={16} />
            {isNexusUser ? "Unidade Nexus" : "Selecione a Unidade"}
          </label>
          <select
            id="school-filter"
            value={selectedSchoolId}
            onChange={(e) => handleSchoolChange(e.target.value)}
            className={`w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 ${
              isNexusUser ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            disabled={isNexusUser}
          >
            {isNexusUser ? (
              <option value={selectedSchoolId}>
                {getSelectedSchoolName() || "Nexus"}
              </option>
            ) : (
              <>
                <option value="">Escolha uma escola...</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        <div className="w-full md:flex-grow">
          <label
            htmlFor="search-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {isNexusUser ? "Buscar no Nexus" : "Buscar na unidade selecionada"}
            {selectedSchoolId && (
              <span className="text-blue-600 font-semibold ml-1">
                ({getSelectedSchoolName()})
              </span>
            )}
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Buscar por turma, professor, nome do aluno ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            disabled={!selectedSchoolId}
          />
        </div>
      </div>

      {selectedSchoolId && (
        <div className={`mb-6 p-4 border rounded-lg ${
          isNexusUser 
            ? "bg-amber-50 border-amber-200" 
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className={isNexusUser ? "text-amber-600" : "text-blue-600"} size={20} />
              <span className={`font-semibold ${
                isNexusUser ? "text-amber-800" : "text-blue-800"
              }`}>
                {isNexusUser 
                  ? `Visualizando Nexus: ${getSelectedSchoolName()}` 
                  : `Visualizando turmas de: ${getSelectedSchoolName()}`
                }
              </span>
            </div>
            {!isNexusUser && (
              <button
                onClick={() => handleSchoolChange("")}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Trocar unidade
              </button>
            )}
          </div>
        </div>
      )}

      {selectedSchoolId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/turma/concludentes"
            state={{ schoolId: selectedSchoolId }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">Turma de Concludentes</h3>
                <GraduationCap size={28} />
              </div>
              <p className="text-green-100 text-sm">
                Visualizar alunos que concluíram o curso nesta unidade.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-green-200 font-semibold">
              <Users size={16} />
              <span>Acessar Lista</span>
            </div>
          </Link>

          {filteredClasses.map((turma) => (
            <Link key={turma.id} to={`/turma/${turma.id}`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col">
                <h3 className="text-lg font-bold text-blue-700 flex-grow">
                  {turma.name}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Professor(a): {turma.professorName || "A definir"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {selectedSchoolId && filteredClasses.length === 0 && !loadingClasses && (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {searchTerm
              ? "Nenhuma turma encontrada"
              : "Nenhuma turma cadastrada"}
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? `Não encontramos turmas que correspondam a "${searchTerm}" nesta unidade.`
              : "Esta unidade ainda não possui turmas cadastradas."}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              Limpar busca
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BoletimPage;