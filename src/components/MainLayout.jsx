import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';
import ChatPopup from './ChatPopup';
import { Menu, X } from 'lucide-react';

const MainLayout = () => {
  const { userProfile, logout } = useAuth();
  
  const adminRoles = ['coordenador', 'diretor', 'admin', 'auxiliar_coordenacao'];
  const isUserAdmin = userProfile && adminRoles.includes(userProfile.role);
  const isUserProfessor = userProfile && ["professor", "professor_apoio"].includes(userProfile.role);

  const canAccessAttendance = isUserAdmin || isUserProfessor;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeLinkClass = "bg-blue-700 text-white";
  const inactiveLinkClass = "text-blue-100 hover:bg-blue-500 hover:text-white";
  
  const mobileLinkClass = "block py-3 px-4 text-lg text-white hover:bg-blue-700 rounded-md";

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-white text-xl">Gestão Escolar</span>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <NavLink to="/dashboard" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>Boletim Escolar</NavLink>
                  <NavLink to="/mapa-turmas" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>Mapa de Turmas</NavLink>

                  {canAccessAttendance && (
                    <NavLink to="/frequencia" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>TBs e Curso Extra</NavLink>
                  )}

                  <NavLink to="/laboratorio" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>Laboratório de Apoio</NavLink>
                  <NavLink to="/kanban" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>Tarefas</NavLink>
                  <NavLink to="/calculadora" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>Calculadora de Reposição</NavLink>
                  {isUserAdmin && (
                    <NavLink to="/usuarios" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>Usuários</NavLink>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
               <button onClick={logout} className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600">Sair</button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-white">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="fixed inset-0 bg-black opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className="relative w-64 h-full bg-blue-600 shadow-xl p-4">
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 text-white">
            <X size={24} />
          </button>
          <nav className="mt-16 space-y-2">
            <NavLink to="/dashboard" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Boletim Escolar</NavLink>
            <NavLink to="/mapa-turmas" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Mapa de Turmas</NavLink>

            {canAccessAttendance && (
              <NavLink to="/frequencia" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>TBs e Curso Extra</NavLink>
            )}

            <NavLink to="/laboratorio" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Laboratório de Apoio</NavLink>
            <NavLink to="/kanban" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Tarefas</NavLink>
            <NavLink to="/calculadora" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Calculadora de Reposição</NavLink>
            {isUserAdmin && (
              <NavLink to="/usuarios" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Usuários</NavLink>
            )}
            <div className="absolute bottom-4 w-full pr-8">
              <button onClick={logout} className="w-full bg-red-500 text-white py-2 rounded-md text-sm font-medium hover:bg-red-600">Sair</button>
            </div>
          </nav>
        </div>
      </div>

      <main className="flex-grow">
        <Outlet />
      </main>

      <ChatPopup />
      
      <Footer />
    </div>
  );
};

export default MainLayout;