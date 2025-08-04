const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

const isAdmin = async (idToken) => {
  try {
    if (!idToken) {
        console.log("isAdmin check: Falhou porque o idToken não foi fornecido.");
        return false;
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    const userRole = decodedToken.role;

    console.log("Verificando permissão para o perfil (role):", userRole);

    return ["diretor", "coordenador", "admin", "auxiliar_coordenacao", "professor_apoio", "financeiro"].includes(
      userRole
    );
  } catch (error) {
    console.error("Erro ao verificar token de admin:", error);
    return false;
  }
};

exports.listAllUsers = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) {
      return res
        .status(403)
        .json({ error: "Ação não autorizada para listar todos os usuários." });
    }

    try {
      const listUsersResult = await auth.listUsers(1000);
      const firestoreUsers = await db.collection("users").get();

      const usersData = new Map();
      firestoreUsers.forEach((doc) => {
        usersData.set(doc.id, doc.data());
      });

      const combinedUsers = listUsersResult.users.map((userRecord) => {
        const firestoreData = usersData.get(userRecord.uid) || {};
        return {
          id: userRecord.uid,
          name: userRecord.displayName || firestoreData.name,
          email: userRecord.email,
          role: firestoreData.role || "sem_perfil",
        };
      });

      const filteredUsers = combinedUsers.filter((user) => {
        return (
          user.name && user.email && user.role && user.role !== "sem_perfil"
        );
      });

      return res.status(200).json({ users: filteredUsers });
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      return res
        .status(500)
        .json({ error: "Erro no servidor ao buscar usuários." });
    }
  });
});

exports.createNewUserAccount = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST")
      return res.status(405).send("Método não permitido");
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken)))
      return res.status(403).json({ error: "Ação não autorizada." });

    // CORREÇÃO CRÍTICA: Lendo os dados de 'req.body.data'
    const { name, email, role } = req.body.data;
    if (!name || !email || !role)
      return res.status(400).json({ error: "Dados em falta." });

    try {
      const userRecord = await auth.createUser({ email, displayName: name });
      await db
        .collection("users")
        .doc(userRecord.uid)
        .set({ name, email, role });
      await auth.setCustomUserClaims(userRecord.uid, { role: role });
      return res
        .status(200)
        .json({ message: `Usuário ${name} criado com sucesso.` });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      return res
        .status(500)
        .json({ error: "Erro ao criar usuário: " + error.message });
    }
  });
});

exports.updateUserProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST")
      return res.status(405).send("Método não permitido");
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken)))
      return res.status(403).json({ error: "Ação não autorizada." });

    // CORREÇÃO CRÍTICA: Lendo os dados de 'req.body.data'
    const { uid, name, role } = req.body.data;
    if (!uid || !name || !role)
      return res.status(400).json({ error: "Dados em falta." });

    try {
      await db.collection("users").doc(uid).update({ name, role });
      await auth.updateUser(uid, { displayName: name });
      await auth.setCustomUserClaims(uid, { role: role });
      return res
        .status(200)
        .json({ message: "Perfil atualizado com sucesso." });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return res.status(500).json({ error: "Erro ao atualizar perfil." });
    }
  });
});

exports.deleteUserAccount = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST")
      return res.status(405).send("Método não permitido");
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken)))
      return res.status(403).json({ error: "Ação não autorizada." });

    // CORREÇÃO CRÍTICA: Lendo os dados de 'req.body.data'
    const { uid } = req.body.data;
    if (!uid) return res.status(400).json({ error: "UID em falta." });

    try {
      await auth.deleteUser(uid);
      await db.collection("users").doc(uid).delete();
      return res.status(200).json({ message: "Usuário apagado com sucesso." });
    } catch (error) {
      console.error("Erro ao apagar usuário:", error);
      return res.status(500).json({ error: "Erro ao apagar usuário." });
    }
  });
});

// --- OUTRAS FUNÇÕES DA APLICAÇÃO (SEM ALTERAÇÕES, JÁ ESTAVAM CORRETAS) ---

exports.transferStudent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método não permitido");
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) {
      return res.status(403).json({ error: "Ação não autorizada." });
    }

    const { studentData, sourceClassId, targetClassId } = req.body.data;

    if (!studentData || !studentData.code || !sourceClassId || !targetClassId) {
      return res
        .status(400)
        .json({
          error:
            "Dados inválidos para a transferência (código do aluno, turma de origem e destino são obrigatórios).",
        });
    }

    // --- NOVA LÓGICA INTELIGENTE ---

    // CASO 1: O ALUNO ESTÁ SENDO MOVIDO PARA CONCLUDENTES
    if (targetClassId === "concludentes") {
      const sourceClassRef = db.collection("classes").doc(sourceClassId);
      // O ID do documento na coleção 'concludentes' será o próprio código do aluno
      const concludentesRef = db
        .collection("concludentes")
        .doc(String(studentData.code));

      try {
        await db.runTransaction(async (transaction) => {
          const sourceDoc = await transaction.get(sourceClassRef);
          if (!sourceDoc.exists)
            throw new Error("Turma de origem não encontrada.");

          // Garante que os dados do concluinte estão perfeitos e completos
          const graduateData = {
            code: String(studentData.code),
            name: studentData.name,
            grades: studentData.grades || {},
            observation: studentData.observation || "",
            graduatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          // Remove o aluno da lista de estudantes da turma de origem
          const sourceStudents = sourceDoc.data().students || [];
          const updatedSourceStudents = sourceStudents.filter(
            (s) => String(s.code) !== String(studentData.code)
          );

          transaction.update(sourceClassRef, {
            students: updatedSourceStudents,
          });

          // Cria ou sobrescreve o registro do aluno na coleção 'concludentes'
          transaction.set(concludentesRef, graduateData);
        });
        return res
          .status(200)
          .json({ message: "Aluno movido para Concludentes com sucesso!" });
      } catch (error) {
        console.error("Erro ao mover para concludentes:", error);
        return res
          .status(500)
          .json({ error: `Erro ao graduar aluno: ${error.message}` });
      }
    }

    // CASO 2: TRANSFERÊNCIA NORMAL ENTRE DUAS TURMAS (LÓGICA ANTIGA)
    else {
      const sourceClassRef = db.collection("classes").doc(sourceClassId);
      const targetClassRef = db.collection("classes").doc(targetClassId);
      try {
        await db.runTransaction(async (transaction) => {
          const sourceDoc = await transaction.get(sourceClassRef);
          const targetDoc = await transaction.get(targetClassRef);
          if (!sourceDoc.exists || !targetDoc.exists)
            throw new Error("Turma de origem ou destino não encontrada.");

          const sourceStudents = sourceDoc.data().students || [];
          const targetStudents = targetDoc.data().students || [];

          // Encontra e remove o aluno da origem
          const studentIndex = sourceStudents.findIndex(
            (s) => String(s.code) === String(studentData.code)
          );
          if (studentIndex === -1)
            throw new Error(
              `Aluno com código ${studentData.code} não encontrado na turma de origem.`
            );
          const [studentToMove] = sourceStudents.splice(studentIndex, 1);

          // Adiciona o aluno ao destino se ele já não estiver lá
          if (
            !targetStudents.some(
              (s) => String(s.code) === String(studentToMove.code)
            )
          ) {
            targetStudents.push(studentToMove);
          }

          transaction.update(sourceClassRef, { students: sourceStudents });
          transaction.update(targetClassRef, { students: targetStudents });
        });
        return res
          .status(200)
          .json({ message: "Aluno transferido com sucesso!" });
      } catch (error) {
        console.error("Erro na transação de transferência:", error);
        return res
          .status(500)
          .json({ error: `Erro ao transferir aluno: ${error.message}` });
      }
    }
  });
});

exports.addStudentToClass = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { classId, studentCode, studentName } = req.body.data;
    if (!classId || !studentCode || !studentName) {
      return res
        .status(400)
        .json({ error: "Dados incompletos para adicionar aluno." });
    }
    const studentsRef = db.collection("students");
    const classRef = db.collection("classes").doc(classId);
    try {
      const existingStudentQuery = await studentsRef
        .where("code", "==", studentCode)
        .limit(1)
        .get();
      if (!existingStudentQuery.empty) {
        throw new Error(
          `Já existe um aluno cadastrado com o código ${studentCode}.`
        );
      }
      const newStudentRef = await studentsRef.add({
        name: studentName,
        code: studentCode,
        currentClassId: classId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const newStudentForClass = {
        studentId: newStudentRef.id,
        code: studentCode,
        name: studentName,
        grades: {},
      };
      await classRef.update({
        students: admin.firestore.FieldValue.arrayUnion(newStudentForClass),
      });
      return res.status(200).json({ message: "Aluno adicionado com sucesso!" });
    } catch (error) {
      console.error("Erro ao adicionar aluno:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});

exports.importStudentsBatch = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método não permitido");
    }
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) {
      return res.status(403).json({ error: "Ação não autorizada." });
    }
    const { classId, studentsToImport } = req.body.data;
    if (
      !classId ||
      !Array.isArray(studentsToImport) ||
      studentsToImport.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Dados inválidos para importar alunos." });
    }
    const studentsRef = db.collection("students");
    const classRef = db.collection("classes").doc(classId);
    try {
      let skippedCount = 0;
      let importedCount = 0;
      const classDoc = await classRef.get();
      if (!classDoc.exists) {
        throw new Error("A turma de destino não foi encontrada.");
      }
      const existingStudentsInClass = classDoc.data().students || [];
      for (const student of studentsToImport) {
        if (!student.code || !student.name) continue;
        const studentCodeStr = String(student.code);
        const existingStudentQuery = await studentsRef
          .where("code", "==", studentCodeStr)
          .limit(1)
          .get();
        if (!existingStudentQuery.empty) {
          skippedCount++;
          continue;
        }
        const newStudentRef = await studentsRef.add({
          name: student.name,
          code: studentCodeStr,
          currentClassId: classId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        existingStudentsInClass.push({
          studentId: newStudentRef.id,
          code: studentCodeStr,
          name: student.name,
          grades: {},
        });
        importedCount++;
      }
      await classRef.update({ students: existingStudentsInClass });
      let message = `${importedCount} aluno(s) importado(s) com sucesso!`;
      if (skippedCount > 0) {
        message += ` ${skippedCount} aluno(s) foram ignorados por já existirem.`;
      }
      return res.status(200).json({ message });
    } catch (error) {
      console.error("Erro ao importar alunos em massa:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao importar os alunos." });
    }
  });
});

exports.syncUserRole = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método não permitido");
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
      return res.status(401).json({ error: "Token não fornecido." });
    }

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        return res
          .status(404)
          .json({ error: "Documento de usuário não encontrado no Firestore." });
      }
      const firestoreRole = userDoc.data().role;

      if (!firestoreRole) {
        return res
          .status(400)
          .json({
            error: "O perfil (role) não está definido no banco de dados.",
          });
      }

      await auth.setCustomUserClaims(uid, { role: firestoreRole });

      return res
        .status(200)
        .json({
          message: `Sucesso! Permissão '${firestoreRole}' sincronizada para o usuário ${uid}. Por favor, faça logout e login novamente.`,
        });
    } catch (error) {
      console.error("Erro ao sincronizar permissão:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro interno ao sincronizar a permissão." });
    }
  });
});

exports.listAllClasses = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
      return res
        .status(401)
        .json({ error: "Acesso não autorizado. Token não fornecido." });
    }

    try {
      await auth.verifyIdToken(idToken);

      const classesSnapshot = await db.collection("classes").get();
      const classesData = [];
      classesSnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() });
      });

      return res.status(200).json({ classes: classesData });
    } catch (error) {
      console.error("Erro ao listar turmas:", error);
      if (error.code === "auth/id-token-expired") {
        return res
          .status(401)
          .json({ error: "Token expirado. Por favor, faça login novamente." });
      }
      return res
        .status(500)
        .json({ error: "Erro no servidor ao buscar as turmas." });
    }
  });
});

exports.createTaskOnModuleEnd = onSchedule("every day 01:00", async (event) => {
  process.env.TZ = "America/Sao_Paulo";

  console.log("Iniciando verificação diária de fim de módulo.");
  const db = admin.firestore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const classesSnapshot = await db.collection("classes").get();

    if (classesSnapshot.empty) {
      console.log("Nenhuma turma encontrada.");
      return null;
    }

    for (const classDoc of classesSnapshot.docs) {
      const classData = classDoc.data();
      const classId = classDoc.id;

      if (
        !classData.professorId ||
        !classData.modules ||
        classData.modules.length === 0
      ) {
        continue;
      }

      for (const mod of classData.modules) {
        if (!mod.dataTermino || !mod.dataTermino.toDate) continue;

        const dataTermino = mod.dataTermino.toDate();
        dataTermino.setHours(0, 0, 0, 0);

        if (dataTermino.getTime() === today.getTime()) {
          console.log(
            `Módulo "${mod.id}" da turma "${classData.name}" terminou hoje. Criando tarefa...`
          );

          const taskData = {
            title: `Entregar notas do módulo "${mod.id}" (Turma ${classData.name})`,
            description: `O módulo ${mod.id} foi concluído. Por favor, lance as notas dos alunos.`,
            status: "todo",
            assigneeId: classData.professorId,
            assigneeName: classData.professorName || "Professor não definido",
            relatedClassId: classId,
            relatedModuleId: mod.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            dueDate: admin.firestore.Timestamp.fromDate(
              new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            ),
          };

          await db.collection("tasks").add(taskData);
          console.log(
            `Tarefa criada com sucesso para ${classData.professorName}.`
          );
        }
      }
    }

    console.log("Verificação diária concluída.");
    return null;
  } catch (error) {
    console.error("Erro ao executar a função de criar tarefas:", error);
    return null;
  }
});

exports.listGraduates = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // ALTERAÇÃO: Mudamos o método para GET, que é o correto para buscar dados.
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) {
       return res.status(403).json({ error: "Ação não autorizada." });
    }

    try {
      const graduatesSnapshot = await db.collection('concludentes').get();
      const graduatesData = [];
      graduatesSnapshot.forEach(doc => {
        const data = doc.data();
        graduatesData.push({
          id: doc.id,
          studentId: doc.id, 
          ...data
        });
      });

      // MANTIDO: O formato da resposta está correto.
      return res.status(200).json({ result: { graduates: graduatesData } });

    } catch (error) {
      console.error("Erro ao listar concludentes:", error);
      return res.status(500).json({ error: "Erro no servidor ao buscar concludentes." });
    }
  });
});

exports.updateGraduatesBatch = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método não permitido");
    }
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    
    if (!(await isAdmin(idToken))) {
      return res.status(403).json({ error: "Ação não autorizada." });
    }

    const { updatedStudents } = req.body.data;
    if (!Array.isArray(updatedStudents)) {
        return res.status(400).json({ error: "Dados dos alunos inválidos." });
    }

    try {
        const batch = db.batch();
        updatedStudents.forEach(student => {
            if (student.code && student.grades) {
                const docRef = db.collection("concludentes").doc(String(student.code));
                batch.update(docRef, { grades: student.grades });
            }
        });
        await batch.commit();
        return res.status(200).json({ message: "Notas dos concludentes atualizadas com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar notas dos concludentes:", error);
        return res.status(500).json({ error: "Erro no servidor ao atualizar notas." });
    }
  });
});