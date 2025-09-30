import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useUsers } from "../contexts/UserContext.jsx";
import Modal from "../components/Modal.jsx";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase"; // Importe a instância de functions
import toast from "react-hot-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

// Apontamos para o nosso roteador 'users' que está no index.js das functions
const usersApi = httpsCallable(functions, "users");

function UsersPage() {
  const { userProfile } = useAuth();
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

  // Função centralizada para chamar a API
  const handleApiAction = async (
    action,
    payload,
    loadingSetter,
    successCallback
  ) => {
    loadingSetter(true);
    const toastId = toast.loading("Executando operação...");
    try {
      // Chama a função 'users' com a ação e os dados corretos
      const result = await usersApi({ action, data: payload });
      toast.success(result.data.message || "Operação bem-sucedida!", {
        id: toastId,
      });
      if (successCallback) {
        successCallback();
      }
    } catch (error) {
      console.error(`Erro ao executar a ação '${action}':`, error);
      toast.error(`Erro: ${error.message}`, { id: toastId });
    } finally {
      loadingSetter(false);
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    handleApiAction(
      "create",
      { name: userName, email: userEmail, role: userRole },
      setIsCreating,
      () => {
        setUserName("");
        setUserEmail("");
        setUserRole("professor");
        fetchUsers(); // Atualiza a lista de usuários
      }
    );
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    handleApiAction(
      "updateProfile",
      { uid: editingUser.id, name: editingUser.name, role: editingUser.role },
      setIsUpdating,
      () => {
        setEditingUser(null); // Fecha o modal
        fetchUsers(); // Atualiza a lista de usuários
      }
    );
  };

  const handleDeleteUser = (userToDelete) => {
    if (
      window.confirm(
        `Tem certeza que deseja apagar o usuário ${userToDelete.name}? Esta ação é irreversível.`
      )
    ) {
      handleApiAction("delete", { uid: userToDelete.id }, () => {}, fetchUsers);
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
                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md"
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