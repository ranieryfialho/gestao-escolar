import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts e Componentes de Rota
import MainLayout from './components/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute'; // O nome correto do componente
import MapaTurmasPage from './pages/MapaTurmasPage';
import LabSupportPage from "./pages/LabSupportPage";
import CalculatorPage from "./pages/CalculatorPage";
import KanbanPage from './pages/KanbanPage';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import UsersPage from './pages/UsersPage';
import NotFoundPage from './pages/NotFoundPage';

// --- NOVAS PÁGINAS IMPORTADAS ---
import AttendancePage from './pages/AttendancePage';
import AttendanceDetailPage from './pages/AttendanceDetailPage';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Rota protegida com o nome correto: ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<DashboardPage />} /> 
          <Route path="mapa-turmas" element={<MapaTurmasPage />} />
          <Route path="laboratorio" element={<LabSupportPage />} />
          <Route path="calculadora" element={<CalculatorPage />} />
          <Route path="turma/:turmaId" element={<ClassDetailsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="kanban" element={<KanbanPage />} />

          {/* --- NOVAS ROTAS DE FREQUÊNCIA ADICIONADAS --- */}
          <Route path="frequencia" element={<AttendancePage />} />
          <Route path="frequencia/:classId" element={<AttendanceDetailPage />} />
          
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;