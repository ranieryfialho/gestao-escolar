import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useClasses } from "../contexts/ClassContext"
import { useUsers } from "../contexts/UserContext"
import CreateClassForm from "../components/CreateClassForm"
import { modulePackages, masterModuleList } from "../data/mockData"

function DashboardPage() {
  const { userProfile } = useAuth()
  const { classes, addClass, loadingClasses } = useClasses()
  const { users } = useUsers()

  const [teacherList, setTeacherList] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClasses, setFilteredClasses] = useState([])

  const adminRoles = ["coordenador", "diretor", "admin"]
  const viewAllClassesRoles = [
    "diretor",
    "coordenador",
    "auxiliar_coordenacao",
    "professor_apoio",
    "financeiro",
    "admin",
  ]

  const isUserAdmin = userProfile && adminRoles.includes(userProfile.role)
  const canViewAll = userProfile && viewAllClassesRoles.includes(userProfile.role)
  const turmasDoBoletim = useMemo(() => classes.filter((turma) => !turma.isMapaOnly), [classes])

  useEffect(() => {
    const rolesPermitidos = ["professor", "coordenador", "auxiliar_coordenacao", "diretor"]
    const filteredTeachers = users.filter((user) => rolesPermitidos.includes(user.role))
    setTeacherList(filteredTeachers)
  }, [users])

  useEffect(() => {
    if (!userProfile || loadingClasses) {
      setFilteredClasses([])
      return
    }

    let userClasses = []
    const validClasses = turmasDoBoletim.filter((c) => c && c.id && c.name)
    if (canViewAll) {
      userClasses = validClasses
    } else if (userProfile.role === "professor") {
      userClasses = validClasses.filter((c) => c.professorId === userProfile.id)
    }

    const results = userClasses.filter((turma) => {
      const term = searchTerm.toLowerCase()
      if (turma.name.toLowerCase().includes(term)) return true
      if (turma.professorName && turma.professorName.toLowerCase().includes(term)) return true
      if (turma.students && Array.isArray(turma.students)) {
        return turma.students.some(
          (student) =>
            (student.name && student.name.toLowerCase().includes(term)) ||
            (student.code && student.code.toString().toLowerCase().includes(term)),
        )
      }
      return false
    })

    results.sort((a, b) => {
      const numA = Number.parseInt(a.name, 10)
      const numB = Number.parseInt(b.name, 10)
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      return a.name.localeCompare(b.name)
    })

    setFilteredClasses(results)
  }, [userProfile, turmasDoBoletim, loadingClasses, canViewAll, searchTerm]) // ALTERADO: Usamos 'turmasDoBoletim' como dependência

  const handleCreateClass = async (className, selectedPackageId, teacherId) => {
    const selectedPackage = modulePackages.find((p) => p.id === selectedPackageId);
    const selectedTeacher = teacherList.find((t) => t.id === teacherId);
    if (!selectedPackage || !selectedTeacher) {
      return alert("Por favor, selecione um pacote e um professor.");
    }

    const classModules = selectedPackage.moduleKeys.map((key) => masterModuleList[key]);

    const newClassData = {
      name: className,
      professorId: selectedTeacher.id,
      professorName: selectedTeacher.name,
      modules: classModules,

      curriculumId: selectedPackageId,

      createdAt: new Date(),
      students: [],
    };

    await addClass(newClassData);
    toast.success(`Turma "${className}" criada com sucesso!`);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Bem-vindo(a), {userProfile?.name || "Usuário"}!</h1>
        <p className="text-md text-gray-600">
          O seu perfil de acesso é:{" "}
          <span className="font-semibold text-blue-600 capitalize">{userProfile?.role.replace(/_/g, " ")}</span>
        </p>
      </div>

      {isUserAdmin && (
        <CreateClassForm onClassCreated={handleCreateClass} packages={modulePackages} teachers={teacherList} />
      )}

      <div className="my-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex-shrink-0">
          {canViewAll ? "Todas as Turmas do Boletim" : "Minhas Turmas do Boletim"}
        </h2>
        <div className="w-full md:flex-grow">
          <input
            type="text"
            placeholder="Buscar por turma, professor ou aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((turma) => (
            <Link key={turma.id} to={`/turma/${turma.id}`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col">
                <h3 className="text-lg font-bold text-blue-700 flex-grow">{turma.name}</h3>
                <p className="text-sm text-gray-500 mt-2">Professor(a): {turma.professorName || "A definir"}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhuma turma encontrada para os critérios atuais.</p>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
