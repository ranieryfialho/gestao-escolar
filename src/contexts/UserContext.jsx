import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
// Importa a instância 'functions' do nosso arquivo centralizado
import { functions } from '../firebase'; 
import { httpsCallable } from 'firebase/functions';

const UserContext = createContext(null);

export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  const fetchUsers = useCallback(async () => {
    // Apenas usuários autorizados podem buscar a lista
    const authorizedRoles = ['diretor', 'coordenador', 'admin', 'auxiliar_coordenacao', 'professor', 'professor_apoio'];
    if (!userProfile || !authorizedRoles.includes(userProfile.role)) {
      setUsers([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Aponta para o roteador 'users'
      const usersApi = httpsCallable(functions, 'users');
      // Chama a ação 'listAll'
      const result = await usersApi({
        action: 'listAll',
        data: {} // Nenhum dado extra é necessário para listar
      });
      
      setUsers(result.data.users);

    } catch (error) {
      console.error("Erro ao carregar usuários via Cloud Function:", error);
      setUsers([]); 
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    // Garante que só busca usuários depois que o perfil já foi carregado
    if(userProfile) {
      fetchUsers();
    }
  }, [userProfile, fetchUsers]);

  const value = { users, loadingUsers: loading, fetchUsers };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  return useContext(UserContext);
};