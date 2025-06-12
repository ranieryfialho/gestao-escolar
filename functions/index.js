// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Função para verificar se o usuário que chama a API é um administrador
const isAdmin = async (idToken) => {
  try {
    if (!idToken) return false;
    const decodedToken = await auth.verifyIdToken(idToken);
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (userDoc.exists) {
      const userRole = userDoc.data().role;
      return ["diretor", "coordenador", "admin"].includes(userRole);
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Suas 3 funções existentes
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
      await auth.setCustomUserClaims(userRecord.uid, { roles: [role] });
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
      await auth.setCustomUserClaims(uid, { roles: [role] });
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

// ================================================================= //
//      FUNÇÃO TRANSFERSTUDENT CORRIGIDA PARA onRequest              //
// ================================================================= //

exports.transferStudent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método não permitido");
    }

    // Usamos a sua função helper 'isAdmin' para consistência
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!(await isAdmin(idToken))) {
      return res.status(403).json({ error: "Ação não autorizada." });
    }

    // Lemos os dados do corpo do pedido, que o seu frontend encapsula em 'data'
    const { studentData, sourceClassId, targetClassId } = req.body.data;

    if (!studentData || !sourceClassId || !targetClassId || sourceClassId === targetClassId) {
      return res.status(400).json({ error: 'Dados inválidos para a transferência.' });
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
        const updatedSourceStudents = sourceStudents.filter(s => s.id !== studentData.id);

        const targetStudents = targetData.students || [];
        if (!targetStudents.some(s => s.id === studentData.id)) {
           targetStudents.push(studentData);
        }
        
        transaction.update(sourceClassRef, { students: updatedSourceStudents });
        transaction.update(targetClassRef, { students: targetStudents });
      });

      console.log(`Aluno ${studentData.id} transferido com sucesso da turma ${sourceClassId} para ${targetClassId}.`);
      return res.status(200).json({ message: 'Aluno transferido com sucesso!' });

    } catch (error) {
      console.error('Erro na transação de transferência:', error);
      return res.status(500).json({ error: 'Ocorreu um erro ao transferir o aluno.' });
    }
  });
});