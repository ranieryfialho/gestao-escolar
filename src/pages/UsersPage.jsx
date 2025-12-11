import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useUsers } from "../contexts/UserContext.jsx";
import Modal from "../components/Modal.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

function UsersPage() {
  const { userProfile, firebaseUser } = useAuth();
  const { users, loadingUsers, fetchUsers } = useUsers();
  const navigate = useNavigate();

  // State para criar novo usuário
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("professor");
  const [isCreating, setIsCreating] = useState(false);

  // State para editar usuário
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userProfile) {
      const authorizedRoles = ["diretor", "coordenador", "admin"];
      if (!authorizedRoles.includes(userProfile.role)) {
        toast.error("Você não tem permissão para acessar esta página.");
        navigate("/dashboard");
      }
    }
  }, [userProfile, navigate]);

  // Função para fazer chamadas HTTP diretas para as Cloud Functions
  const makeHttpRequest = async (endpoint, method = 'POST', data = null) => {
    if (!firebaseUser) {
      throw new Error("Usuário não autenticado");
    }

    const token = await firebaseUser.getIdToken();
    const baseUrl = "https://us-central1-boletim-escolar-app.cloudfunctions.net";
    
    const config = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify({ data });
    }

    const response = await fetch(`${baseUrl}/${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na requisição');
    }

    return response.json();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    const toastId = toast.loading("Criando usuário...");
    
    try {
      const result = await makeHttpRequest('createNewUserAccount', 'POST', {
        name: userName,
        email: userEmail,
        role: userRole
      });

      toast.success(result.message || "Usuário criado com sucesso!", { id: toastId });
      
      // Limpar formulário
      setUserName("");
      setUserEmail("");
      setUserRole("professor");
      
      // Atualizar lista de usuários
      fetchUsers();
      
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast.error(`Erro: ${error.message}`, { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsUpdating(true);
    const toastId = toast.loading("Atualizando usuário...");
    
    try {
      const result = await makeHttpRequest('updateUserProfile', 'POST', {
        uid: editingUser.id,
        name: editingUser.name,
        role: editingUser.role
      });

      toast.success(result.message || "Usuário atualizado com sucesso!", { id: toastId });
      
      // Fechar modal e atualizar lista
      setEditingUser(null);
      fetchUsers();
      
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error(`Erro: ${error.message}`, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!window.confirm(
      `Tem certeza que deseja apagar o usuário ${userToDelete.name}? Esta ação é irreversível.`
    )) {
      return;
    }

    const toastId = toast.loading("Excluindo usuário...");
    
    try {
      const result = await makeHttpRequest('deleteUserAccount', 'POST', {
        uid: userToDelete.id
      });

      toast.success(result.message || "Usuário excluído com sucesso!", { id: toastId });
      
      // Atualizar lista
      fetchUsers();
      
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast.error(`Erro: ${error.message}`, { id: toastId });
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser({ ...user });
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
  };

  if (loadingUsers && !users.length) {
    return <div className="p-8 text-center">Carregando usuários...</div>;
  }

  const rolesOptions = [
    { value: "professor", label: "Professor" },
    { value: "professor_nexus", label: "Professor Nexus" },
    { value: "professor_apoio", label: "Professor de Apoio" },
    { value: "auxiliar_coordenacao", label: "Auxiliar de Coordenação" },
    { value: "coordenador", label: "Coordenador" },
    { value: "diretor", label: "Diretor" },
    { value: "financeiro", label: "Financeiro" },
    { value: "comercial", label: "Comercial" },
    { value: "secretaria", label: "Secretaria" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestão de Usuários</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Criar Novo Usuário</h2>
        <form
          onSubmit={handleCreateUser}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div className="col-span-1">
            <label
              htmlFor="userName"
              className="block text-sm font-medium text-gray-700"
            >
              Nome
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="userEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="userEmail"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div className="col-span-1">
            <label
              htmlFor="userRole"
              className="block text-sm font-medium text-gray-700"
            >
              Função
            </label>
            <select
              id="userRole"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              {rolesOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {isCreating ? "Criando..." : "Criar Usuário"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Usuários Cadastrados</h2>
        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum usuário encontrado.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Função
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rolesOptions.find(role => role.value === user.role)?.label || user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      title="Editar usuário"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-600 hover:text-red-900"
                      title="Excluir usuário"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={handleCloseEditModal}
          title="Editar Usuário"
        >
          <form onSubmit={handleUpdateUser}>
            <div className="mb-4">
              <label
                htmlFor="editName"
                className="block text-sm font-medium text-gray-700"
              >
                Nome
              </label>
              <input
                type="text"
                id="editName"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="editEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="editEmail"
                value={editingUser.email}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                title="O email não pode ser alterado"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="editRole"
                className="block text-sm font-medium text-gray-700"
              >
                Função
              </label>
              <select
                id="editRole"
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                {rolesOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-300"
              >
                {isUpdating ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default UsersPage;