const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

const isAdmin = async (idToken) => {
  try {
    if (!idToken) return false;
    const decodedToken = await auth.verifyIdToken(idToken);
    const userRole = decodedToken.role; 
    return ["diretor", "coordenador", "admin", "auxiliar_coordenacao", "professor"].includes(userRole);
  } catch (error) {
    console.error("Erro ao verificar token de admin:", error);
    return false;
  }
};

exports.createNewUserAccount = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Método não permitido");

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) return res.status(403).json({ error: "Ação não autorizada." });

    const { name, email, role } = req.body;
    if (!name || !email || !role) return res.status(400).json({ error: "Dados em falta." });

    try {
      const userRecord = await auth.createUser({ email, displayName: name });
      await db.collection("users").doc(userRecord.uid).set({ name, email, role });

      await auth.setCustomUserClaims(userRecord.uid, { role: role });
      
      return res.status(200).json({ message: `Usuário ${name} criado com sucesso.` });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao criar usuário: " + error.message });
    }
  });
});

exports.updateUserProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Método não permitido");

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) return res.status(403).json({ error: "Ação não autorizada." });

    const { uid, name, role } = req.body;
    if (!uid || !name || !role) return res.status(400).json({ error: "Dados em falta." });

    try {
      await db.collection("users").doc(uid).update({ name, role });
      await auth.updateUser(uid, { displayName: name });

      await auth.setCustomUserClaims(uid, { role: role });

      return res.status(200).json({ message: "Perfil atualizado com sucesso." });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar perfil." });
    }
  });
});

exports.deleteUserAccount = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Método não permitido");
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) return res.status(403).json({ error: "Ação não autorizada." });
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "UID em falta." });
    try {
      await auth.deleteUser(uid);
      await db.collection("users").doc(uid).delete();
      return res.status(200).json({ message: "Usuário apagado com sucesso." });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao apagar usuário." });
    }
  });
});

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

    const db = admin.firestore();
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
        if (targetStudents.some(s => s.studentId === studentData.studentId)) {
          console.log(`Aluno ${studentData.studentId} já existe na turma de destino.`);
        } else {
           targetStudents.push(studentData);
        }
        
        transaction.update(sourceClassRef, { students: updatedSourceStudents });
        transaction.update(targetClassRef, { students: targetStudents });
      });

      console.log(`Aluno ${studentData.studentId} transferido com sucesso da turma ${sourceClassId} para ${targetClassId}.`);
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
    if (!classId || !studentCode || !studentName) { /* ... */ }

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
          console.log(`Aluno com código ${studentCodeStr} já existe. Pulando.`);
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