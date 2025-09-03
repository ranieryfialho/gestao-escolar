import React, { useState, useEffect, useRef } from "react";
import { useClasses } from "../contexts/ClassContext";
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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import BarChart from "../components/charts/BarChart";
import DoughnutChart from "../components/charts/DoughnutChart";
import { getElementAtEvent } from "react-chartjs-2";
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

function HomePage() {
  const { classes, graduates, loadingClasses } = useClasses();
  const [taskCounts, setTaskCounts] = useState({ todo: 0, inprogress: 0 });
  const navigate = useNavigate();
  const barChartRef = useRef();
  const doughnutChartRef = useRef();

  useEffect(() => {
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
  }, []);

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

  const activeClasses = classes.filter(
    (c) => c.name !== "CONCLUDENTES" && !c.isMapaOnly
  );
  const totalStudents = activeClasses.reduce(
    (sum, c) => sum + (c.students?.length || 0),
    0
  );
  const activeTeachers = new Set(
    activeClasses.map((c) => c.professorName).filter(Boolean)
  ).size;
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
    if (!turma.dataTermino) return false;
    let termDate;
    if (turma.dataTermino.toDate) {
      termDate = turma.dataTermino.toDate();
    } else if (typeof turma.dataTermino === "string") {
      termDate = new Date(turma.dataTermino + "T12:00:00");
    } else {
      termDate = new Date(turma.dataTermino);
    }
    return (
      termDate.getMonth() === currentMonth &&
      termDate.getFullYear() === currentYear
    );
  });
  const modulesEndingCount = classesWithModulesEndingThisMonth.length;

  const moduleCounts = activeClasses.reduce((acc, turma) => {
    const currentModule = turma.modules?.[0]?.id || "N/D";
    acc[currentModule] = (acc[currentModule] || 0) + 1;
    return acc;
  }, {});
  const moduleChartData = {
    labels: Object.keys(moduleCounts),
    datasets: [
      {
        label: "Nº de Turmas",
        data: Object.values(moduleCounts),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const handleBarChartClick = (event, elements) => {
    if (!elements || elements.length === 0) {
      return;
    }
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

  const studentsWithLowGrades = [];
  const gradeStatusCounts = activeClasses.reduce(
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
                  professorName: turma.professorName || "A definir", // <-- ADICIONADO AQUI
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

  const doughnutChartData = {
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

  const handleDoughnutChartClick = (event, elements) => {
    if (!elements || elements.length === 0) return;
    const { index } = elements[0];
    if (index === 1) {
      navigate("/alunos-nota-baixa", {
        state: { students: studentsWithLowGrades },
      });
    }
  };

  const doughnutChartOptions = {
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

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Geral</h1>
      <div className="mb-8">
        <Slider {...sliderSettings}>
          <StatCard
            title="Alunos Ativos"
            value={totalStudents}
            icon={Users}
            to="/boletim"
          />
          <StatCard
            title="Turmas Ativas"
            value={activeClasses.length}
            icon={School}
            to="/boletim"
          />
          <StatCard
            title="Professores Ativos"
            value={activeTeachers}
            icon={ClipboardCheck}
            to="/mapa-turmas"
          />
          <StatCard
            title="Módulos Finalizando Este Mês"
            value={modulesEndingCount}
            icon={CalendarClock}
            to="/mapa-turmas"
            state={{ filter: "endingThisMonth" }}
            bgColor="bg-teal-100"
            textColor="text-teal-600"
          />
          <StatCard
            title="Certificados Prontos"
            value={certificatesReady}
            icon={GraduationCap}
            to="/turma/concludentes"
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
          <StatCard
            title="Treinamentos Básicos"
            value={tbClassesCount}
            icon={BookOpenCheck}
            to="/frequencia"
            bgColor="bg-indigo-100"
            textColor="text-indigo-600"
          />
          <StatCard
            title="Cursos Extras"
            value={extraCoursesCount}
            icon={BookCopy}
            to="/frequencia"
            bgColor="bg-purple-100"
            textColor="text-purple-600"
          />
          <StatCard
            title="Tarefas a Fazer"
            value={taskCounts.todo}
            icon={ClipboardList}
            to="/kanban"
            bgColor="bg-red-100"
            textColor="text-red-600"
          />
          <StatCard
            title="Tarefas em Progresso"
            value={taskCounts.inprogress}
            icon={Loader}
            to="/kanban"
            bgColor="bg-yellow-100"
            textColor="text-yellow-600"
          />
        </Slider>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 sm:h-96">
          <BarChart
            chartRef={barChartRef}
            chartData={moduleChartData}
            chartOptions={moduleChartOptions}
          />
        </div>
        <div className="lg:col-span-1 h-80 sm:h-96">
          <DoughnutChart
            chartRef={doughnutChartRef}
            chartData={doughnutChartData}
            chartOptions={doughnutChartOptions}
          />
        </div>
      </div>
    </div>
  );
}

export default HomePage;