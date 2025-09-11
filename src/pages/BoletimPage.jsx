import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useClasses } from "../contexts/ClassContext";
import { useUsers } from "../contexts/UserContext";
import CreateClassForm from "../components/CreateClassForm";
import { modulePackages, masterModuleList } from "../data/mockData";
import toast from "react-hot-toast";
import { GraduationCap, Users, School } from "lucide-react"; // Adicionado School
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

function BoletimPage() {
  const { userProfile } = useAuth();
  const { classes, addClass, loadingClasses } = useClasses();
  const { users } = useUsers();

  const [teacherList, setTeacherList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClasses, setFilteredClasses] = useState([]);

  // Lógica de escolas que já implementamos
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const isUserAdmin =
    userProfile &&
    ["coordenador", "diretor", "admin"].includes(userProfile.role);

  // Busca as escolas
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
    const rolesPermitidos = [
      "professor",
      "coordenador",
      "auxiliar_coordenacao",
      "diretor",
    ];
    setTeacherList(users.filter((user) => rolesPermitidos.includes(user.role)));
  }, [users]);

  // Filtra as turmas normais
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
    const results = schoolClasses.filter(
      (turma) =>
        turma.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (turma.professorName &&
          turma.professorName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    results.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredClasses(results);
  }, [classes, loadingClasses, selectedSchoolId, searchTerm]);

  // Função de criar turma (já com schoolId)
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

  return (
    <div className="p-4 md:p-8">
      {isUserAdmin && (
        <CreateClassForm
          onClassCreated={handleCreateClass}
          packages={modulePackages}
          teachers={teacherList}
        />
      )}

      {/* Seletor de Escola e Busca */}
      <div className="my-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-1/3">
          <label
            htmlFor="school-filter"
            className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
          >
            <School size={16} />
            Selecione a Unidade
          </label>
          <select
            id="school-filter"
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Escolha uma escola...</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:flex-grow">
          <label
            htmlFor="search-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Buscar na unidade selecionada
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Buscar por turma, professor ou aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            disabled={!selectedSchoolId}
          />
        </div>
      </div>

      {/* Grid de Turmas */}
      {selectedSchoolId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD RESTAURADO PARA CONCLUDENTES */}
          <Link
            to="/turma/concludentes"
            state={{ schoolId: selectedSchoolId }} // Passando o ID da escola selecionada
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

          {/* Turmas normais filtradas */}
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
    </div>
  );
}

export default BoletimPage;
