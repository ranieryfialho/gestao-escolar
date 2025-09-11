import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Certifique-se que o caminho para o firebase.js está correto
import { collection, getDocs } from "firebase/firestore";

// Adicionamos a busca e seleção de escolas, mantendo suas props originais
function CreateClassForm({ onClassCreated, packages, teachers }) {
  const [className, setClassName] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [diaSemana, setDiaSemana] = useState("Segunda-feira");
  const [horario, setHorario] = useState("07:30 as 09:20");
  const [sala, setSala] = useState("Lab 01");

  // Estados para a nova funcionalidade de escolas
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  // Efeito para buscar as escolas do Firestore quando o componente montar
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsCollection = collection(db, "schools");
        const schoolSnapshot = await getDocs(schoolsCollection);
        const schoolList = schoolSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSchools(schoolList);
      } catch (err) {
        console.error("Erro ao buscar as escolas: ", err);
        // Opcional: Adicionar um feedback de erro para o usuário
      }
    };
    fetchSchools();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Adicionamos a validação para o campo de escola
    if (
      !className.trim() ||
      !selectedPackageId ||
      !selectedTeacherId ||
      !selectedSchoolId
    ) {
      alert(
        "Por favor, preencha todos os campos: nome, pacote, professor e escola."
      );
      return;
    }

    // Adicionamos o 'selectedSchoolId' ao chamar a função onClassCreated
    onClassCreated(
      className,
      selectedPackageId,
      selectedTeacherId,
      {
        dia_semana: diaSemana,
        horario,
        sala,
      },
      selectedSchoolId // Passando o ID da escola selecionada
    );

    // Limpando todos os campos após o envio
    setClassName("");
    setSelectedPackageId("");
    setSelectedTeacherId("");
    setDiaSemana("Segunda-feira");
    setHorario("07:30 as 09:20");
    setSala("Lab 01");
    setSelectedSchoolId(""); // Limpa a escola selecionada
  };

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-bold mb-4">Cadastrar Nova Turma</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Nome da Turma (sem alterações) */}
        <div>
          <label
            htmlFor="className"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nome da Turma
          </label>
          <input
            id="className"
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Ex: 2001-A (ESP) || 05.2025"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Linha com Pacote e Professor (sem alterações) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="package"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Pacote de Módulos
            </label>
            <select
              id="package"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="" disabled>
                Selecione um pacote de módulos
              </option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="teacher"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Professor Responsável
            </label>
            <select
              id="teacher"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="" disabled>
                Selecione um professor
              </option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NOVA SEÇÃO: Seletor de Escola */}
        <div>
          <label
            htmlFor="school"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Unidade Escolar
          </label>
          <select
            id="school"
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="" disabled>
              Selecione a unidade
            </option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {/* Seção de agendamento (sem alterações) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
          <div>
            <label
              htmlFor="dia_semana"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Dia da Semana
            </label>
            <select
              id="dia_semana"
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="horario"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Horário
            </label>
            <select
              id="horario"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {scheduleOptions.map((schedule) => (
                <option key={schedule} value={schedule}>
                  {schedule}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="sala"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sala
            </label>
            <select
              id="sala"
              value={sala}
              onChange={(e) => setSala(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {roomOptions.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Criar Turma
        </button>
      </form>
    </div>
  );
}

export default CreateClassForm;