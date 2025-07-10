"use client"

import { useState, useEffect, useMemo } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { db } from "../firebase"
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore"
import { useAuth } from "../contexts/AuthContext"
import { useUsers } from "../contexts/UserContext"
import { PlusCircle, Pencil, Trash2, AlertCircle } from "lucide-react"
import AddTaskModal from "../components/AddTaskModal"
import EditTaskModal from "../components/EditTaskModal"
import toast from "react-hot-toast"

const initialColumns = {
  todo: {
    id: "todo",
    title: "A Fazer",
    taskIds: [],
    headerColor: "bg-blue-500",
    borderColor: "border-blue-500",
  },
  inprogress: {
    id: "inprogress",
    title: "Em Progresso",
    taskIds: [],
    headerColor: "bg-yellow-500",
    borderColor: "border-yellow-500",
  },
  done: {
    id: "done",
    title: "Feito",
    taskIds: [],
    headerColor: "bg-green-500",
    borderColor: "border-green-500",
  },
}

const columnOrder = ["todo", "inprogress", "done"]

function KanbanPage() {
  const [columns, setColumns] = useState(initialColumns)
  const [tasks, setTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { userProfile } = useAuth()
  const { users } = useUsers()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)

  // Memoização para otimizar performance
  const canAddTasks = useMemo(() => {
    return userProfile && ["coordenador", "diretor"].includes(userProfile.role)
  }, [userProfile])

  useEffect(() => {
    if (!userProfile) {
      setLoading(false)
      setError("Utilizador não autenticado")
      return
    }

    setLoading(true)
    setError(null)

    const tasksCollectionRef = collection(db, "tasks")

    const unsubscribe = onSnapshot(
      tasksCollectionRef,
      (querySnapshot) => {
        try {
          const allTasks = {}
          const newColumns = JSON.parse(JSON.stringify(initialColumns))

          querySnapshot.forEach((doc) => {
            const taskData = { id: doc.id, ...doc.data() }
            allTasks[taskData.id] = taskData

            if (newColumns[taskData.status]) {
              newColumns[taskData.status].taskIds.push(taskData.id)
            }
          })

          setTasks(allTasks)
          setColumns(newColumns)
          setLoading(false)
          setError(null)
        } catch (err) {
          console.error("Erro ao processar tarefas:", err)
          setError("Erro ao carregar tarefas")
          setLoading(false)
        }
      },
      (err) => {
        console.error("Erro na subscrição:", err)
        setError("Erro de conexão com a base de dados")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [userProfile])

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    const taskRef = doc(db, "tasks", draggableId)

    try {
      await updateDoc(taskRef, {
        status: destination.droppableId,
        updatedAt: serverTimestamp(),
      })

      toast.success("Tarefa movida com sucesso!")
    } catch (error) {
      console.error("Erro ao mover tarefa:", error)
      toast.error("Erro ao mover a tarefa.")
    }
  }

  const handleAddTask = async (taskData) => {
    if (!canAddTasks) {
      toast.error("Não tem permissão para adicionar tarefas.")
      return
    }

    const selectedUser = users.find((u) => u.id === taskData.assigneeId)
    if (!selectedUser) {
      toast.error("Utilizador responsável não encontrado.")
      return
    }

    const newTask = {
      ...taskData,
      assigneeName: selectedUser.name,
      status: "todo",
      createdAt: serverTimestamp(),
      createdBy: userProfile.id,
      createdByName: userProfile.name,
    }

    try {
      const promise = addDoc(collection(db, "tasks"), newTask)

      await toast.promise(promise, {
        loading: "A guardar tarefa...",
        success: "Tarefa adicionada com sucesso!",
        error: "Erro ao guardar a tarefa.",
      })

      setIsAddModalOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error)
    }
  }

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task)
    setIsEditModalOpen(true)
  }

  const handleUpdateTask = async (taskId, updatedData) => {
    const taskRef = doc(db, "tasks", taskId)

    try {
      const dataToUpdate = {
        ...updatedData,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile.id,
        updatedByName: userProfile.name,
      }

      const promise = updateDoc(taskRef, dataToUpdate)

      await toast.promise(promise, {
        loading: "A atualizar tarefa...",
        success: "Tarefa atualizada com sucesso!",
        error: "Erro ao atualizar a tarefa.",
      })

      setIsEditModalOpen(false)
      setTaskToEdit(null)
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error)
    }
  }

  const handleDeleteTask = async (taskId) => {
    const confirmDelete = window.confirm("Tem a certeza de que deseja apagar esta tarefa? Esta ação é irreversível.")

    if (!confirmDelete) return

    const taskRef = doc(db, "tasks", taskId)

    try {
      const promise = deleteDoc(taskRef)

      await toast.promise(promise, {
        loading: "A apagar tarefa...",
        success: "Tarefa apagada com sucesso!",
        error: "Erro ao apagar a tarefa.",
      })
    } catch (error) {
      console.error("Erro ao apagar tarefa:", error)
    }
  }

  const handleCloseModals = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setTaskToEdit(null)
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">A carregar tarefas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Por favor, faça login para aceder ao quadro de tarefas.</p>
      </div>
    )
  }

  return (
    <>
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quadro de Tarefas</h1>
            <p className="text-sm text-gray-600 mt-1">
              Bem-vindo, {userProfile.name} ({userProfile.role})! 👋
            </p>
          </div>

          {canAddTasks && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <PlusCircle size={18} />
              Adicionar Tarefa
            </button>
          )}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columnOrder.map((columnId) => {
              const column = columns[columnId]
              const columnTasks = column.taskIds.map((taskId) => tasks[taskId]).filter(Boolean)

              return (
                <div key={column.id} className="bg-gray-50 rounded-lg flex flex-col">
                  <div className={`p-4 rounded-t-lg ${column.headerColor}`}>
                    <h3 className="font-bold text-white text-lg text-center">
                      {column.title}
                      <span className="ml-2 text-sm opacity-80">({columnTasks.length})</span>
                    </h3>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-4 flex-grow min-h-[200px] transition-colors duration-200 ${
                          snapshot.isDraggingOver ? "bg-gray-100" : "bg-gray-50"
                        }`}
                      >
                        {columnTasks.length === 0 ? (
                          <div className="text-center text-gray-400 py-8">
                            <p className="text-sm">Nenhuma tarefa</p>
                          </div>
                        ) : (
                          columnTasks.map((task, index) => {
                            // LÓGICA DE PERMISSÃO ATUALIZADA
                            const canEditOrDelete = userProfile && (
                                userProfile.role === 'coordenador' ||
                                userProfile.role === 'diretor'
                            );
                            
                            const canDrag = userProfile && (
                                canEditOrDelete || // Admins podem arrastar
                                task.assigneeId === userProfile.id // O responsável pode arrastar o seu próprio card
                            );


                            return (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                                isDragDisabled={!canDrag}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white p-4 mb-3 rounded-lg shadow border-l-4 ${column.borderColor} ${
                                      snapshot.isDragging ? "shadow-xl scale-105 rotate-2" : "shadow-sm hover:shadow-md"
                                    } ${
                                      !canDrag
                                        ? "opacity-60 cursor-not-allowed"
                                        : "cursor-grab hover:cursor-grabbing"
                                    } transition-all duration-200`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-grow pr-2">
                                        <h4 className="font-semibold text-gray-900 mb-2 leading-tight">{task.title}</h4>

                                        {task.description && (
                                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                        )}

                                        <div className="flex flex-col gap-1">
                                          <p className="text-xs text-gray-500">
                                            <span className="font-medium">Responsável:</span> {task.assigneeName}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Ícones só aparecem para Coordenador/Diretor */}
                                      {canEditOrDelete && (
                                        <div className="flex items-center space-x-1 ml-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenEditModal(task)
                                            }}
                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                                            aria-label="Editar tarefa"
                                          >
                                            <Pencil size={14} />
                                          </button>

                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDeleteTask(task.id)
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                            aria-label="Deletar tarefa"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      <AddTaskModal isOpen={isAddModalOpen} onClose={handleCloseModals} onSave={handleAddTask} users={users} />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        onSave={handleUpdateTask}
        task={taskToEdit}
        users={users}
      />
    </>
  )
}

export default KanbanPage