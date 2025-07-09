const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Função helper com as permissões de administrador consistentes e corretas.
const isAdmin = async (idToken) => {
  try {
    if (!idToken) return false;
    const decodedToken = await auth.verifyIdToken(idToken);
    const userRole = decodedToken.role;
    // CORREÇÃO: "professor" foi removido. Apenas estes perfis são considerados administradores.
    return ["diretor", "coordenador", "admin", "auxiliar_coordenacao"].includes(userRole);
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
       return res.status(403).json({ error: "Ação não autorizada para listar todos os usuários." });
    }

    try {
      const listUsersResult = await auth.listUsers(1000);
      const firestoreUsers = await db.collection('users').get();
      
      const usersData = new Map();
      firestoreUsers.forEach(doc => {
        usersData.set(doc.id, doc.data());
      });

      const combinedUsers = listUsersResult.users.map(userRecord => {
        const firestoreData = usersData.get(userRecord.uid) || {};
        return {
          id: userRecord.uid,
          name: userRecord.displayName || firestoreData.name,
          email: userRecord.email,
          role: firestoreData.role || 'sem_perfil',
        };
      });

      const filteredUsers = combinedUsers.filter(user => {
        return user.name && user.email && user.role && user.role !== 'sem_perfil';
      });

      return res.status(200).json({ users: filteredUsers });

    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      return res.status(500).json({ error: "Erro no servidor ao buscar usuários." });
    }
  });
});

exports.createNewUserAccount = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Método não permitido");
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) return res.status(403).json({ error: "Ação não autorizada." });
    
    // CORREÇÃO CRÍTICA: Lendo os dados de 'req.body.data'
    const { name, email, role } = req.body.data;
    if (!name || !email || !role) return res.status(400).json({ error: "Dados em falta." });

    try {
      const userRecord = await auth.createUser({ email, displayName: name });
      await db.collection("users").doc(userRecord.uid).set({ name, email, role });
      await auth.setCustomUserClaims(userRecord.uid, { role: role });
      return res.status(200).json({ message: `Usuário ${name} criado com sucesso.` });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      return res.status(500).json({ error: "Erro ao criar usuário: " + error.message });
    }
  });
});

exports.updateUserProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Método não permitido");
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) return res.status(403).json({ error: "Ação não autorizada." });
    
    // CORREÇÃO CRÍTICA: Lendo os dados de 'req.body.data'
    const { uid, name, role } = req.body.data;
    if (!uid || !name || !role) return res.status(400).json({ error: "Dados em falta." });

    try {
      await db.collection("users").doc(uid).update({ name, role });
      await auth.updateUser(uid, { displayName: name });
      await auth.setCustomUserClaims(uid, { role: role });
      return res.status(200).json({ message: "Perfil atualizado com sucesso." });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return res.status(500).json({ error: "Erro ao atualizar perfil." });
    }
  });
});

exports.deleteUserAccount = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Método não permitido");
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) return res.status(403).json({ error: "Ação não autorizada." });
    
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
    if (!studentData || !sourceClassId || !targetClassId || sourceClassId === targetClassId) {
      return res.status(400).json({ error: 'Dados inválidos para a transferência.' });
    }
    if (!studentData.studentId) {
        return res.status(400).json({ error: 'Dados do aluno inválidos, studentId não encontrado.' });
    }
    const sourceClassRef = db.collection('classes').doc(sourceClassId);
    const targetClassRef = db.collection('classes').doc(targetClassId);
    try {
      await db.runTransaction(async (transaction) => {
        const sourceDoc = await transaction.get(sourceClassRef);
        const targetDoc = await transaction.get(targetClassRef);
        if (!sourceDoc.exists || !targetDoc.exists) {
          throw new Error('Turma de origem ou destino não encontrada.');
        }
        const sourceData = sourceDoc.data();
        const targetData = targetDoc.data();
        const sourceStudents = sourceData.students || [];
        const updatedSourceStudents = sourceStudents.filter(s => s.studentId !== studentData.studentId);
        if (updatedSourceStudents.length === sourceStudents.length) {
            throw new Error(`Aluno com ID ${studentData.studentId} não foi encontrado na turma de origem.`);
        }
        const targetStudents = targetData.students || [];
        if (!targetStudents.some(s => s.studentId === studentData.studentId)) {
           targetStudents.push(studentData);
        }
        transaction.update(sourceClassRef, { students: updatedSourceStudents });
        transaction.update(targetClassRef, { students: targetStudents });
      });
      return res.status(200).json({ message: 'Aluno transferido com sucesso!' });
    } catch (error) {
      console.error('Erro na transação de transferência:', error);
      return res.status(500).json({ error: 'Ocorreu um erro ao transferir o aluno.' });
    }
  });
});

exports.addStudentToClass = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { classId, studentCode, studentName } = req.body.data;
    if (!classId || !studentCode || !studentName) {
        return res.status(400).json({ error: "Dados incompletos para adicionar aluno."});
    }
    const studentsRef = db.collection('students');
    const classRef = db.collection('classes').doc(classId);
    try {
      const existingStudentQuery = await studentsRef.where('code', '==', studentCode).limit(1).get();
      if (!existingStudentQuery.empty) {
        throw new Error(`Já existe um aluno cadastrado com o código ${studentCode}.`);
      }
      const newStudentRef = await studentsRef.add({
        name: studentName,
        code: studentCode,
        currentClassId: classId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const newStudentForClass = {
        studentId: newStudentRef.id,
        code: studentCode,
        name: studentName,
        grades: {}
      };
      await classRef.update({
        students: admin.firestore.FieldValue.arrayUnion(newStudentForClass)
      });
      return res.status(200).json({ message: 'Aluno adicionado com sucesso!' });
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
    if (!classId || !Array.isArray(studentsToImport) || studentsToImport.length === 0) {
      return res.status(400).json({ error: 'Dados inválidos para importar alunos.' });
    }
    const studentsRef = db.collection('students');
    const classRef = db.collection('classes').doc(classId);
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
        const existingStudentQuery = await studentsRef.where('code', '==', studentCodeStr).limit(1).get();
        if (!existingStudentQuery.empty) {
          skippedCount++;
          continue;
        }
        const newStudentRef = await studentsRef.add({
          name: student.name,
          code: studentCodeStr,
          currentClassId: classId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        existingStudentsInClass.push({
          studentId: newStudentRef.id,
          code: studentCodeStr,
          name: student.name,
          grades: {}
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
      return res.status(500).json({ error: 'Ocorreu um erro ao importar os alunos.' });
    }
  });
});

exports.syncUserRole = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Método não permitido');
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
      return res.status(401).json({ error: "Token não fornecido." });
    }

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "Documento de usuário não encontrado no Firestore." });
      }
      const firestoreRole = userDoc.data().role;

      if (!firestoreRole) {
        return res.status(400).json({ error: "O perfil (role) não está definido no banco de dados." });
      }

      await auth.setCustomUserClaims(uid, { role: firestoreRole });

      return res.status(200).json({ message: `Sucesso! Permissão '${firestoreRole}' sincronizada para o usuário ${uid}. Por favor, faça logout e login novamente.` });

    } catch (error) {
      console.error("Erro ao sincronizar permissão:", error);
      return res.status(500).json({ error: "Ocorreu um erro interno ao sincronizar a permissão." });
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
      return res.status(401).json({ error: "Acesso não autorizado. Token não fornecido." });
    }

    try {

      await auth.verifyIdToken(idToken);

      const classesSnapshot = await db.collection('classes').get();
      const classesData = [];
      classesSnapshot.forEach(doc => {
        classesData.push({ id: doc.id, ...doc.data() });
      });

      return res.status(200).json({ classes: classesData });

    } catch (error) {
      console.error("Erro ao listar turmas:", error);
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: "Token expirado. Por favor, faça login novamente." });
      }
      return res.status(500).json({ error: "Erro no servidor ao buscar as turmas." });
    }
  });
});