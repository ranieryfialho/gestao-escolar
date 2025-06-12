// src/components/MainLayout.jsx

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';

const MainLayout = () => {
  const { userProfile, logout } = useAuth();
  const adminRoles = ['coordenador', 'diretor', 'admin'];
  const isUserAdmin = userProfile && adminRoles.includes(userProfile.role);

  const activeLinkClass = "bg-blue-700 text-white";
  const inactiveLinkClass = "text-blue-100 hover:bg-blue-500 hover:text-white";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50"> 
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-white text-xl">Boletim Escolar</span>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <NavLink to="/dashboard" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>Dashboard</NavLink>
                  {isUserAdmin && (
                    <NavLink to="/usuarios" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>Usuários</NavLink>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
               <button onClick={logout} className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600">Sair</button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;