import React, { useState, useEffect, useRef } from "react";
import { useClasses } from "../contexts/ClassContext";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Users,
  GraduationCap,
  School,
  ClipboardList,
  Loader,
  ClipboardCheck,
  CalendarClock,
  BookOpenCheck,
  BookCopy,
  FileText,
  CalendarPlus,
  BookMarked,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import BarChart from "../components/charts/BarChart";
import DoughnutChart from "../components/charts/DoughnutChart";
import "../styles/slider.css";

const StatCard = ({
  title,
  value,
  icon,
  to,
  state,
  bgColor = "bg-blue-100",
  textColor = "text-blue-600",
}) => {
  const IconComponent = icon;
  const content = (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col items-center text-center h-full justify-center">
      <div className={`${bgColor} p-3 rounded-full mb-3`}>
        <IconComponent className={`h-7 w-7 ${textColor}`} />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        <h3 className="text-sm font-medium text-gray-500 mt-1">{title}</h3>
      </div>
    </div>
  );

  return (
    <div className="p-2 h-full">
      {to ? (
        <Link to={to} state={state} className="h-full block">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
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
    return { moduloAtual: "Sem Módulos" };
  }

  let currentModuleId;

  if (turma.mapa_modulo_atual_id) {
    currentModuleId = turma.mapa_modulo_atual_id;
  } else {
    const modAtualPorData = turma.modules.find((mod) => {
      const inicio = parseDate(mod.startDate);
      const termino = parseDate(mod.endDate);
      return inicio && termino && hoje >= inicio && hoje <= termino;
    });

    if (modAtualPorData) {
      currentModuleId = modAtualPorData.id;
    } else {
      const modulosPassados = turma.modules
        .filter((mod) => {
          const termino = parseDate(mod.endDate);
          return termino && termino < hoje;
        })
        .sort((a, b) => parseDate(b.endDate) - parseDate(a.endDate));

      if (modulosPassados.length > 0) {
        currentModuleId = modulosPassados[0].id;
      } else if (turma.modules.length > 0) {
        currentModuleId = turma.modules[0].id;
      } else {
        currentModuleId = "N/D";
      }
    }
  }
  return { moduloAtual: currentModuleId };
};

// Componente Principal HomePage
function HomePage() {
  const { classes, graduates, loadingClasses } = useClasses();
  const { userProfile } = useAuth();
  const [taskCounts, setTaskCounts] = useState({ todo: 0, inprogress: 0 });
  const navigate = useNavigate();
  const barChartRef = useRef();
  const doughnutChartRef = useRef();

  const isSecretaria = userProfile?.role === "secretaria";
  const isComercial = userProfile?.role === "comercial";
  const isProfessorNexus = userProfile?.role === "professor_nexus";
  const hasRestrictedAccess = isSecretaria || isComercial;

  useEffect(() => {
    if (!hasRestrictedAccess && !isProfessorNexus) {
      const tasksQuery = query(
        collection(db, "tasks"),
        where("status", "in", ["todo", "inprogress"])
      );
      const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
        const counts = { todo: 0, inprogress: 0 };
        querySnapshot.forEach((doc) => {
          const task = doc.data();
          if (task.status === "todo") counts.todo += 1;
          else if (task.status === "inprogress") counts.inprogress += 1;
        });
        setTaskCounts(counts);
      });
      return () => unsubscribe();
    }
  }, [hasRestrictedAccess, isProfessorNexus]);

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  if (loadingClasses) {
    return (
      <div className="p-8 text-center">Carregando dados do dashboard...</div>
    );
  }

  if (isProfessorNexus) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Bem-vindo(a), {userProfile?.name || "Professor(a) Nexus"}!
          </h2>
          <p className="text-md text-gray-600">
            O seu perfil de acesso é:{" "}
            <span className="font-semibold text-blue-600 capitalize">
              {userProfile?.role?.replace(/_/g, " ") || "Carregando..."}
            </span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="h-full">
            <Link to="/frequencia-nexus" className="h-full block">
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col items-center text-center h-full justify-center">
                <div className="bg-cyan-100 p-3 rounded-full mb-3">
                  <CalendarPlus className="h-7 w-7 text-cyan-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-800">Acessar</p>
                  <h3 className="text-sm font-medium text-gray-500 mt-1">
                    Frequência Nexus
                  </h3>
                </div>
              </div>
            </Link>
          </div>
          <div className="h-full">
            <Link
              to="/boletim"
              state={{
                isNexusUser: true,
                lockedSchoolId: "GEYs70ghHbdAm9oeE8hu",
              }}
              className="h-full block"
            >
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col items-center text-center h-full justify-center">
                <div className="bg-amber-100 p-3 rounded-full mb-3">
                  <BookMarked className="h-7 w-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-800">Consultar</p>
                  <h3 className="text-sm font-medium text-gray-500 mt-1">
                    Boletim Nexus
                  </h3>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }


  const activeClasses = classes.filter(
    (c) => c.name !== "CONCLUDENTES" && !c.isMapaOnly
  );
  const totalStudents = activeClasses.reduce(
    (sum, c) => sum + (c.students?.length || 0),
    0
  );

  const certificatesReady = graduates.filter(
    (g) =>
      g.certificateStatus === "impresso" || g.certificateStatus === "entregue"
  ).length;
  const tbClassesCount = classes.filter(
    (c) => (c.modules?.[0]?.id || "").toUpperCase() === "TB"
  ).length;
  const extraCoursesCount = classes.filter(
    (c) => (c.modules?.[0]?.id || "").toUpperCase() === "CURSO EXTRA"
  ).length;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const classesWithModulesEndingThisMonth = activeClasses.filter((turma) => {
    if (!turma.modules || turma.modules.length === 0) {
      const termDate = parseDate(turma.dataTermino);
      return (
        termDate &&
        termDate.getMonth() === currentMonth &&
        termDate.getFullYear() === currentYear
      );
    }

    return turma.modules.some((mod) => {
      const termDate = parseDate(
        mod.endDate || mod.dataTermino || turma.dataTermino
      );
      return (
        termDate &&
        termDate.getMonth() === currentMonth &&
        termDate.getFullYear() === currentYear
      );
    });
  });
  const modulesEndingCount = classesWithModulesEndingThisMonth.length;

  const classesEndingCourseThisMonth = activeClasses.filter((turma) => {
    const { moduloAtual } = getDisplayModules(turma);
    const isLastModule = moduloAtual === "CMV";

    const termDate = parseDate(turma.dataTermino);
    const isEndingThisMonth =
      termDate &&
      termDate.getMonth() === currentMonth &&
      termDate.getFullYear() === currentYear;

    return isLastModule && isEndingThisMonth;
  });
  const courseEndingCount = classesEndingCourseThisMonth.length;

  const moduleOrder = ["ICN", "OFFA", "ADM", "PWB", "TRI", "CMV"];
  const moduleCounts = activeClasses.reduce((acc, turma) => {
    const { moduloAtual } = getDisplayModules(turma);
    acc[moduloAtual] = (acc[moduloAtual] || 0) + 1;
    return acc;
  }, {});
  const allModulesInChart = Object.keys(moduleCounts);
  const sortedLabels = moduleOrder.filter((mod) =>
    allModulesInChart.includes(mod)
  );

  const remainingLabels = allModulesInChart.filter(
    (mod) => !moduleOrder.includes(mod) && mod !== "Sem Módulos"
  );

  const finalLabels = [...sortedLabels, ...remainingLabels];
  const finalData = finalLabels.map((label) => moduleCounts[label]);

  const moduleChartData = {
    labels: finalLabels,
    datasets: [
      {
        label: "Nº de Turmas",
        data: finalData,
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const handleBarChartClick = (event, elements) => {
    if (!elements || elements.length === 0) return;
    const { index } = elements[0];
    const moduleName = moduleChartData.labels[index];
    navigate("/mapa-turmas", {
      state: { filter: "module", moduleName: moduleName },
    });
  };

  const moduleChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleBarChartClick,
    onHover: (event, chartElement) => {
      const target = event.native ? event.native.target : event.target;
      target.style.cursor = chartElement[0] ? "pointer" : "default";
    },
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Turmas por Módulo Atual" },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  let studentsWithLowGrades = [];
  let gradeStatusCounts = { green: 0, red: 0 };
  let doughnutChartData = null;
  let doughnutChartOptions = null;
  let handleDoughnutChartClick = null;

  if (!hasRestrictedAccess) {
    gradeStatusCounts = activeClasses.reduce(
      (acc, turma) => {
        turma.students?.forEach((student) => {
          if (student.grades) {
            Object.entries(student.grades).forEach(([moduleId, gradeInfo]) => {
              const grade = parseFloat(
                typeof gradeInfo === "object" ? gradeInfo.finalGrade : gradeInfo
              );
              if (!isNaN(grade)) {
                if (grade < 7) {
                  acc.red++;
                  studentsWithLowGrades.push({
                    studentName: student.name,
                    studentCode: student.code,
                    className: turma.name,
                    professorName: turma.professorName || "A definir",
                    module: moduleId,
                    grade: grade.toFixed(1),
                  });
                } else {
                  acc.green++;
                }
              }
            });
          }
        });
        return acc;
      },
      { green: 0, red: 0 }
    );

    doughnutChartData = {
      labels: ["Notas Acima da Média", "Notas Abaixo da Média"],
      datasets: [
        {
          data: [gradeStatusCounts.green, gradeStatusCounts.red],
          backgroundColor: ["#4CAF50", "#F44336"],
          hoverBackgroundColor: ["#66BB6A", "#EF5350"],
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };

    handleDoughnutChartClick = (event, elements) => {
      if (!elements || elements.length === 0) return;
      const { index } = elements[0];
      if (index === 1) {
        navigate("/alunos-nota-baixa", {
          state: { students: studentsWithLowGrades },
        });
      }
    };

    doughnutChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      onClick: handleDoughnutChartClick,
      onHover: (event, chartElement) => {
        const target = event.native ? event.native.target : event.target;
        target.style.cursor = chartElement[0] ? "pointer" : "default";
      },
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Desempenho Geral de Notas" },
      },
    };
  }

  const getVisibleCards = () => {
    if (!userProfile) return [];

    let cards = [];

    const canSeeNexusCards = [
      "auxiliar_coordenacao",
      "coordenador",
      "diretor",
      "admin",
    ].includes(userProfile.role);

    if (canSeeNexusCards) {
      cards.push(
        <StatCard
          key="frequencia-nexus"
          title="Frequência Nexus"
          value="Acessar"
          icon={CalendarPlus}
          to="/frequencia-nexus"
          bgColor="bg-cyan-100"
          textColor="text-cyan-600"
        />
      );
    }

    if (hasRestrictedAccess) {
      cards.push(
        <StatCard
          key="mapa-turmas"
          title="Mapa de Turmas"
          value="Visualizar"
          icon={CalendarClock}
          to="/mapa-turmas"
          bgColor="bg-green-100"
          textColor="text-green-600"
        />,
        <StatCard
          key="gerar-contrato"
          title="Gerar Contrato - Treinamento Básico"
          value="Criar"
          icon={FileText}
          to="/gerar-contrato"
          bgColor="bg-purple-100"
          textColor="text-purple-600"
        />,
        <StatCard
          key="laboratorio-apoio"
          title="Laboratório de Apoio"
          value="Acessar"
          icon={ClipboardCheck}
          to="/laboratorio"
          bgColor="bg-orange-100"
          textColor="text-orange-600"
        />,
        <StatCard
          key="tb-classes"
          title="Treinamentos Básicos"
          value={tbClassesCount}
          icon={BookOpenCheck}
          to="/frequencia"
          bgColor="bg-indigo-100"
          textColor="text-indigo-600"
        />
      );
    } else {
      cards.push(
        <StatCard
          key="students"
          title="Alunos Ativos"
          value={totalStudents}
          icon={Users}
          to="/boletim"
        />,
        <StatCard
          key="classes"
          title="Turmas Ativas"
          value={activeClasses.length}
          icon={School}
          to="/boletim"
        />,
        <StatCard
          key="course-ending"
          title="Turmas Finalizando Este Mês"
          value={courseEndingCount}
          icon={GraduationCap}
          to="/mapa-turmas"
          state={{ filter: "endingCourseThisMonth" }}
          bgColor="bg-orange-100"
          textColor="text-orange-600"
        />,
        <StatCard
          key="modules-ending"
          title="Módulos Finalizando Este Mês"
          value={modulesEndingCount}
          icon={CalendarClock}
          to="/mapa-turmas"
          state={{ filter: "endingThisMonth" }}
          bgColor="bg-teal-100"
          textColor="text-teal-600"
        />,
        <StatCard
          key="certificates"
          title="Certificados Prontos"
          value={certificatesReady}
          icon={GraduationCap}
          to="/turma/concludentes"
          state={{ schoolId: "1SzXUMMWR0MtndKZXIa1" }}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />,
        <StatCard
          key="tb-classes"
          title="Treinamentos Básicos"
          value={tbClassesCount}
          icon={BookOpenCheck}
          to="/frequencia"
          bgColor="bg-indigo-100"
          textColor="text-indigo-600"
        />,
        <StatCard
          key="extra-courses"
          title="Cursos Extras"
          value={extraCoursesCount}
          icon={BookCopy}
          to="/frequencia"
          bgColor="bg-purple-100"
          textColor="text-purple-600"
        />,
        <StatCard
          key="todo-tasks"
          title="Tarefas a Fazer"
          value={taskCounts.todo}
          icon={ClipboardList}
          to="/kanban"
          bgColor="bg-red-100"
          textColor="text-red-600"
        />,
        <StatCard
          key="progress-tasks"
          title="Tarefas em Progresso"
          value={taskCounts.inprogress}
          icon={Loader}
          to="/kanban"
          bgColor="bg-yellow-100"
          textColor="text-yellow-600"
        />
      );
    }

    return cards;
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Geral</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Bem-vindo(a), {userProfile?.name || "Usuário"}!
        </h2>
        <p className="text-md text-gray-600">
          O seu perfil de acesso é:{" "}
          <span className="font-semibold text-blue-600 capitalize">
            {userProfile?.role?.replace(/_/g, " ") || "Carregando..."}
          </span>
        </p>
      </div>

      <div className="mb-8">
        <Slider {...sliderSettings}>{getVisibleCards()}</Slider>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={
            hasRestrictedAccess
              ? "lg:col-span-3 h-80 sm:h-96"
              : "lg:col-span-2 h-80 sm:h-96"
          }
        >
          <BarChart
            chartRef={barChartRef}
            chartData={moduleChartData}
            chartOptions={moduleChartOptions}
          />
        </div>
        {!hasRestrictedAccess && (
          <div className="lg:col-span-1 h-80 sm:h-96">
            <DoughnutChart
              chartRef={doughnutChartRef}
              chartData={doughnutChartData}
              chartOptions={doughnutChartOptions}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;