import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts e Componentes de Rota
import MainLayout from './components/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import MapaTurmasPage from './pages/MapaTurmasPage';
import LabSupportPage from "./pages/LabSupportPage";
import CalculatorPage from "./pages/CalculatorPage";

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import UsersPage from './pages/UsersPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="mapa-turmas" element={<MapaTurmasPage />} />
          <Route path="/laboratorio" element={<LabSupportPage />} />
          <Route path="/calculadora" element={<CalculatorPage />} />
          <Route path="turma/:turmaId" element={<ClassDetailsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
        </Route>
      </Route>

      {/* Rota de Fallback para páginas não encontradas */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;