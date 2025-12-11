import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Footer from "./Footer";
import { Menu, X, ChevronDown, CalendarPlus, ListChecks } from "lucide-react";

const MainLayout = () => {
  const { userProfile, logout } = useAuth();

  const adminRoles = [
    "coordenador",
    "diretor",
    "admin",
    "auxiliar_coordenacao",
  ];

  const isUserAdmin = userProfile && adminRoles.includes(userProfile.role);
  const isUserProfessor =
    userProfile && ["professor", "professor_apoio"].includes(userProfile.role);
  const isUserComercial = userProfile && userProfile.role === "comercial";

  const isUserSecretaria = userProfile && userProfile.role === "secretaria";

  const canAccessCursosPage =
    userProfile &&
    ["coordenador", "diretor", "comercial", "admin"].includes(userProfile.role);

  const canAccessNexusAttendance =
    userProfile &&
    ["coordenador", "admin", "diretor", "financeiro"].includes(
      userProfile.role
    );

  const canAccessContractPage =
    userProfile &&
    ["coordenador", "diretor", "secretaria", "comercial"].includes(
      userProfile.role
    );

  const canAccessAttendance = isUserAdmin || isUserProfessor;
  const canAccessFollowUp = isUserAdmin || isUserProfessor;

  const canAccessRetuf =
    userProfile &&
    ["coordenador", "diretor", "auxiliar_coordenacao", "admin"].includes(
      userProfile.role
    );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [academicMenuOpen, setAcademicMenuOpen] = useState(false);
  const [operationalMenuOpen, setOperationalMenuOpen] = useState(false);

  const academicMenuRef = useRef(null);
  const operationalMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        academicMenuRef.current &&
        !academicMenuRef.current.contains(event.target)
      ) {
        setAcademicMenuOpen(false);
      }
      if (
        operationalMenuRef.current &&
        !operationalMenuRef.current.contains(event.target)
      ) {
        setOperationalMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dropdownLinkClass =
    "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100";
  const activeDropdownLinkClass = "bg-blue-50 font-semibold text-blue-600";

  const getDropdownNavLinkClass = ({ isActive }) =>
    isActive
      ? `${dropdownLinkClass} ${activeDropdownLinkClass}`
      : dropdownLinkClass;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="font-bold text-white text-xl hover:opacity-80 transition-opacity"
              >
                Gestão Escolar
              </Link>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {isUserComercial || isUserSecretaria ? (
                    <></>
                  ) : (
                    <>
                      {/* --- GRUPO ACADÊMICO --- */}
                      <div className="relative" ref={academicMenuRef}>
                        <button
                          onClick={() => {
                            setAcademicMenuOpen(!academicMenuOpen);
                            setOperationalMenuOpen(false);
                          }}
                          className="flex items-center text-blue-100 hover:bg-blue-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none"
                        >
                          <span>Acadêmico</span>
                          <ChevronDown
                            size={16}
                            className={`ml-1 transition-transform ${
                              academicMenuOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {academicMenuOpen && (
                          <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1">
                              {canAccessNexusAttendance && (
                                <NavLink
                                  to="/frequencia-nexus"
                                  className={getDropdownNavLinkClass}
                                  onClick={() => setAcademicMenuOpen(false)}
                                >
                                  Frequência Nexus
                                </NavLink>
                              )}
                              <NavLink
                                to="/boletim"
                                className={getDropdownNavLinkClass}
                                onClick={() => setAcademicMenuOpen(false)}
                              >
                                Boletim Escolar
                              </NavLink>
                              {canAccessAttendance && (
                                <NavLink
                                  to="/frequencia"
                                  className={getDropdownNavLinkClass}
                                  onClick={() => setAcademicMenuOpen(false)}
                                >
                                  TBs e Curso Extra
                                </NavLink>
                              )}
                              {canAccessRetuf && (
                                <NavLink
                                  to="/retuf"
                                  className={getDropdownNavLinkClass}
                                  onClick={() => setAcademicMenuOpen(false)}
                                >
                                  RETUF
                                </NavLink>
                              )}
                              <NavLink
                                to="/mapa-turmas"
                                className={getDropdownNavLinkClass}
                                onClick={() => setAcademicMenuOpen(false)}
                              >
                                Mapa de Turmas
                              </NavLink>
                              <NavLink
                                to="/laboratorio"
                                className={getDropdownNavLinkClass}
                                onClick={() => setAcademicMenuOpen(false)}
                              >
                                Laboratório de Apoio
                              </NavLink>
                              <NavLink
                                to="/kanban"
                                className={getDropdownNavLinkClass}
                                onClick={() => setAcademicMenuOpen(false)}
                              >
                                Tarefas
                              </NavLink>
                              {/* ### INÍCIO DA CORREÇÃO ### */}
                              <NavLink
                                to="/alunos-inativos"
                                className={getDropdownNavLinkClass}
                                onClick={() => setAcademicMenuOpen(false)}
                              >
                                Alunos Inativos
                              </NavLink>
                              {/* ### FIM DA CORREÇÃO ### */}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* --- GRUPO OPERACIONAL--- */}
                      <div className="relative" ref={operationalMenuRef}>
                        <button
                          onClick={() => {
                            setOperationalMenuOpen(!operationalMenuOpen);
                            setAcademicMenuOpen(false);
                          }}
                          className="flex items-center text-blue-100 hover:bg-blue-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none"
                        >
                          <span>Operacional</span>
                          <ChevronDown
                            size={16}
                            className={`ml-1 transition-transform ${
                              operationalMenuOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {operationalMenuOpen && (
                          <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1">
                              <NavLink
                                to="/eventos"
                                className={getDropdownNavLinkClass}
                                onClick={() => setOperationalMenuOpen(false)}
                              >
                                Gestão de Eventos
                              </NavLink>
                              {canAccessCursosPage && (
                                <NavLink
                                  to="/cursos"
                                  className={getDropdownNavLinkClass}
                                  onClick={() => setOperationalMenuOpen(false)}
                                >
                                  Cursos e Ementas
                                </NavLink>
                              )}
                              {canAccessContractPage && (
                                <NavLink
                                  to="/gerar-contrato"
                                  className={getDropdownNavLinkClass}
                                  onClick={() => setOperationalMenuOpen(false)}
                                >
                                  Gerar Contrato de Curso
                                </NavLink>
                              )}
                              <NavLink
                                to="/calculadora"
                                className={getDropdownNavLinkClass}
                                onClick={() => setOperationalMenuOpen(false)}
                              >
                                Calculadora de Reposição
                              </NavLink>
                            </div>
                          </div>
                        )}
                      </div>

                      {isUserAdmin && (
                        <NavLink
                          to="/usuarios"
                          className="text-blue-100 hover:bg-blue-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Administração
                        </NavLink>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={logout}
                className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600"
              >
                Sair
              </button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-white"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MENU MOBILE  --- */}
      <div
        className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        <div className="relative w-64 h-full bg-blue-600 shadow-xl p-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 text-white"
          >
            <X size={24} />
          </button>
          <nav className="mt-16 space-y-4">
            {isUserComercial || isUserSecretaria ? (
              <></>
            ) : (
              <>
                <h4 className="px-4 pt-2 text-sm font-bold text-blue-200 uppercase">
                  Acadêmico
                </h4>
                {canAccessNexusAttendance && (
                  <NavLink
                    to="/frequencia-nexus"
                    className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Frequência Nexus
                  </NavLink>
                )}
                <NavLink
                  to="/boletim"
                  className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Boletim Escolar
                </NavLink>
                {canAccessAttendance && (
                  <NavLink
                    to="/frequencia"
                    className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    TBs e Curso Extra
                  </NavLink>
                )}
                {canAccessRetuf && (
                  <NavLink
                    to="/retuf"
                    className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    RETUF
                  </NavLink>
                )}
                <NavLink
                  to="/mapa-turmas"
                  className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Mapa de Turmas
                </NavLink>
                <NavLink
                  to="/laboratorio"
                  className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Laboratório de Apoio
                </NavLink>
                <NavLink
                  to="/kanban"
                  className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tarefas
                </NavLink>

                <h4 className="px-4 pt-4 text-sm font-bold text-blue-200 uppercase">
                  Operacional
                </h4>
                <NavLink
                  to="/eventos"
                  className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Gestão de Eventos
                </NavLink>
                {canAccessCursosPage && (
                  <NavLink
                    to="/cursos"
                    className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Cursos e Ementas
                  </NavLink>
                )}
                {canAccessContractPage && (
                  <NavLink
                    to="/gerar-contrato"
                    className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Gerar Contrato de Curso
                  </NavLink>
                )}
                <NavLink
                  to="/calculadora"
                  className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Calculadora de Reposição
                </NavLink>

                {isUserAdmin && (
                  <>
                    <h4 className="px-4 pt-4 text-sm font-bold text-blue-200 uppercase">
                      Administração
                    </h4>
                    <NavLink
                      to="/usuarios"
                      className="block py-2 px-4 text-lg text-white hover:bg-blue-700 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Usuários
                    </NavLink>
                  </>
                )}
              </>
            )}
            <div className="absolute bottom-4 w-full pr-8">
              <button
                onClick={logout}
                className="w-full bg-red-500 text-white py-2 rounded-md text-sm font-medium hover:bg-red-600"
              >
                Sair
              </button>
            </div>
          </nav>
        </div>
      </div>

      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;