const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Define as configurações globais para todas as funções de 2ª Geração
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

// --- Função Auxiliar de Permissão (Substitui isAdmin, isProfessorOrAdmin, etc.) ---
const checkPermission = async (context, allowedRoles = []) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "A requisição não foi autenticada.");
  }
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new HttpsError("not-found", "Perfil de usuário não encontrado.");
  }
  const userRole = userDoc.data().role;
  if (!allowedRoles.includes(userRole)) {
    throw new HttpsError("permission-denied", "Você não tem permissão para executar esta ação.");
  }
  return { uid: context.auth.uid, role: userRole, name: userDoc.data().name };
};

// ===================================================================
// ROTEADOR DE FUNÇÕES DE USUÁRIOS
// ===================================================================
exports.users = onCall(async (request) => {
  const { action, data } = request.data;
  const adminRoles = ["diretor", "coordenador", "admin"];

  switch (action) {
    case "listAll": {
      await checkPermission(request, adminRoles);
      const listUsersResult = await auth.listUsers(1000);
      const firestoreUsers = await db.collection("users").get();
      const usersData = new Map();
      firestoreUsers.forEach((doc) => usersData.set(doc.id, doc.data()));

      const combinedUsers = listUsersResult.users.map((userRecord) => {
        const firestoreData = usersData.get(userRecord.uid) || {};
        return {
          id: userRecord.uid,
          name: userRecord.displayName || firestoreData.name,
          email: userRecord.email,
          role: firestoreData.role || "sem_perfil",
        };
      }).filter(u => u.name && u.email && u.role !== "sem_perfil");
      
      return { users: combinedUsers };
    }

    case "create": {
      await checkPermission(request, adminRoles);
      const { name, email, role } = data;
      if (!name || !email || !role) throw new HttpsError("invalid-argument", "Dados insuficientes.");
      
      const userRecord = await auth.createUser({ email, displayName: name });
      await db.collection("users").doc(userRecord.uid).set({ name, email, role });
      await auth.setCustomUserClaims(userRecord.uid, { role });
      
      return { message: `Usuário ${name} criado com sucesso.` };
    }

    case "updateProfile": {
      await checkPermission(request, adminRoles);
      const { uid, name, role } = data;
      if (!uid || !name || !role) throw new HttpsError("invalid-argument", "Dados insuficientes.");

      await db.collection("users").doc(uid).update({ name, role });
      await auth.updateUser(uid, { displayName: name });
      await auth.setCustomUserClaims(uid, { role });

      return { message: "Perfil atualizado com sucesso." };
    }

    case "delete": {
      await checkPermission(request, adminRoles);
      const { uid } = data;
      if (!uid) throw new HttpsError("invalid-argument", "UID não fornecido.");

      await auth.deleteUser(uid);
      await db.collection("users").doc(uid).delete();
      
      return { message: "Usuário apagado com sucesso." };
    }

    case "syncRole": {
        const { uid } = await checkPermission(request, ["diretor", "coordenador", "admin", "professor", "professor_apoio", "professor_nexus", "financeiro", "comercial", "secretaria"]);
        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) throw new HttpsError("not-found", "Usuário não encontrado.");
        
        const firestoreRole = userDoc.data().role;
        if (!firestoreRole) throw new HttpsError("failed-precondition", "Perfil não definido no banco de dados.");

        await auth.setCustomUserClaims(uid, { role: firestoreRole });
        return { message: `Permissão '${firestoreRole}' sincronizada.` };
    }

    default:
      throw new HttpsError("not-found", "Ação de usuário desconhecida.");
  }
});

// ===================================================================
// ROTEADOR DE FUNÇÕES DE TURMAS E ALUNOS
// ===================================================================
exports.classes = onCall(async (request) => {
    const { action, data } = request.data;
    const adminRoles = ["diretor", "coordenador", "admin", "auxiliar_coordenacao", "professor_apoio"];
    const allStaffRoles = [...adminRoles, "professor", "professor_nexus", "financeiro", "comercial", "secretaria"];

    switch (action) {
        case "listAll": { // FUNÇÃO REINCORPORADA
            await checkPermission(request, allStaffRoles);
            const snapshot = await db.collection("classes").get();
            const classesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { classes: classesList };
        }

        case "transferStudent": {
            await checkPermission(request, adminRoles);
            const { studentData, sourceClassId, targetClassId } = data;
            if (!studentData || !sourceClassId || !targetClassId) throw new HttpsError("invalid-argument", "Dados insuficientes.");

            const sourceClassRef = db.collection("classes").doc(sourceClassId);
            
            if (targetClassId === "concludentes") {
                const concludentesRef = db.collection("concludentes").doc(String(studentData.code));
                await db.runTransaction(async (t) => {
                    const sourceDoc = await t.get(sourceClassRef);
                    if (!sourceDoc.exists) throw new HttpsError("not-found", "Turma de origem não existe.");
                    
                    const updatedStudents = sourceDoc.data().students.filter(s => String(s.code) !== String(studentData.code));
                    t.update(sourceClassRef, { students: updatedStudents });
                    t.set(concludentesRef, {
                        code: String(studentData.code),
                        name: studentData.name,
                        grades: studentData.grades || {},
                        observation: studentData.observation || "",
                        graduatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        certificateStatus: "nao_impresso",
                    });
                });
                return { message: "Aluno movido para Concludentes." };

            } else {
                const targetClassRef = db.collection("classes").doc(targetClassId);
                await db.runTransaction(async (t) => {
                    const sourceDoc = await t.get(sourceClassRef);
                    const targetDoc = await t.get(targetClassRef);
                    if (!sourceDoc.exists || !targetDoc.exists) throw new HttpsError("not-found", "Turma de origem ou destino não existe.");

                    const sourceStudents = sourceDoc.data().students || [];
                    const studentIndex = sourceStudents.findIndex(s => String(s.code) === String(studentData.code));
                    if (studentIndex === -1) throw new HttpsError("not-found", "Aluno não encontrado na turma de origem.");
                    
                    const [studentToMove] = sourceStudents.splice(studentIndex, 1);
                    t.update(sourceClassRef, { students: sourceStudents });

                    const targetStudents = targetDoc.data().students || [];
                    if (!targetStudents.some(s => String(s.code) === String(studentToMove.code))) {
                        targetStudents.push(studentToMove);
                        t.update(targetClassRef, { students: targetStudents });
                    }
                });
                return { message: "Aluno transferido com sucesso." };
            }
        }

        case "addStudent": {
            await checkPermission(request, [...adminRoles, "professor", "secretaria"]);
            const { classId, studentCode, studentName } = data;
            if (!classId || !studentCode || !studentName) throw new HttpsError("invalid-argument", "Dados insuficientes.");

            const classRef = db.collection("classes").doc(classId);
            const newStudentPayload = { studentId: db.collection("students").doc().id, code: studentCode, name: studentName, grades: {} };
            await classRef.update({ students: admin.firestore.FieldValue.arrayUnion(newStudentPayload) });
            
            return { message: "Aluno adicionado com sucesso!" };
        }

        case "importStudents": {
            await checkPermission(request, adminRoles);
            const { classId, studentsToImport } = data;
            if (!classId || !Array.isArray(studentsToImport)) throw new HttpsError("invalid-argument", "Dados inválidos.");

            const classRef = db.collection("classes").doc(classId);
            const classDoc = await classRef.get();
            if (!classDoc.exists) throw new HttpsError("not-found", "Turma não encontrada.");
            
            const existingStudents = classDoc.data().students || [];
            const studentsToAdd = studentsToImport.map(s => ({
                studentId: db.collection("students").doc().id,
                code: String(s.code),
                name: s.name,
                grades: {},
            }));

            await classRef.update({ students: [...existingStudents, ...studentsToAdd] });
            return { message: `${studentsToAdd.length} alunos importados.` };
        }

        case "removeStudent": {
            await checkPermission(request, adminRoles);
            const { classId, studentData } = data;
            if (!classId || !studentData) throw new HttpsError("invalid-argument", "Dados insuficientes.");
            
            const classRef = db.collection("classes").doc(classId);
            await classRef.update({ students: admin.firestore.FieldValue.arrayRemove(studentData) });

            return { message: "Aluno removido com sucesso." };
        }
        
        default:
            throw new HttpsError("not-found", "Ação de turma desconhecida.");
    }
});

// ===================================================================
// ROTEADOR DE FUNÇÕES DE FORMANDOS (CONCLUDENTES)
// ===================================================================
exports.graduates = onCall(async (request) => {
    const { action, data } = request.data;
    const adminRoles = ["diretor", "coordenador", "admin", "secretaria"];

    switch (action) {
        case "list": { // FUNÇÃO REINCORPORADA
            await checkPermission(request, adminRoles);
            const snapshot = await db.collection("concludentes").get();
            const graduatesList = snapshot.docs.map(doc => ({ code: doc.id, ...doc.data() }));
            return { graduates: graduatesList };
        }
        case "updateBatch": { // FUNÇÃO REINCORPORADA
            await checkPermission(request, adminRoles);
            const { updatedStudents } = data;
            if (!Array.isArray(updatedStudents)) throw new HttpsError("invalid-argument", "Dados inválidos.");
            
            const batch = db.batch();
            updatedStudents.forEach(student => {
                const docRef = db.collection("concludentes").doc(String(student.code));
                batch.update(docRef, { certificateStatus: student.certificateStatus });
            });
            await batch.commit();
            return { message: "Status dos certificados atualizado." };
        }
        default:
            throw new HttpsError("not-found", "Ação de formandos desconhecida.");
    }
});


// ===================================================================
// ROTEADOR DE FUNÇÕES DE EVENTOS E CHECK-IN
// ===================================================================
exports.events = onCall(async (request) => {
    const { action, data } = request.data;
    const allStaffRoles = ["diretor", "coordenador", "admin", "professor", "professor_apoio", "professor_nexus", "financeiro", "comercial", "secretaria"];

    switch (action) {
        case "listActive": {
            await checkPermission(request, allStaffRoles);
            const eventsSnapshot = await db.collection('events').where('isActive', '==', true).get();
            const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { events: eventsList };
        }

        case "generateAndAssignToken": {
            await checkPermission(request, allStaffRoles);
            const { eventId } = data;
            if (!eventId) throw new HttpsError("invalid-argument", "ID do evento é obrigatório.");

            const token = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

            await db.collection("attendanceTokens").doc(token).set({
                eventId: eventId,
                expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { token, expiresAt: expiresAt.toISOString() };
        }

        case "processCheckin": {
            const { token, studentName } = data;
            if (!token || !studentName) throw new HttpsError("invalid-argument", "Token e nome são obrigatórios.");

            const tokenRef = db.collection("attendanceTokens").doc(token);
            const tokenDoc = await tokenRef.get();

            if (!tokenDoc.exists) throw new HttpsError("not-found", "Token inválido ou expirado.");
            
            const tokenData = tokenDoc.data();
            if (tokenData.used) throw new HttpsError("already-exists", "Token já foi utilizado.");
            if (tokenData.expiresAt.toDate() < new Date()) throw new HttpsError("deadline-exceeded", "Token expirou.");

            const regQuery = db.collection("event_registrations").where("eventId", "==", tokenData.eventId).where("name", "==", studentName).limit(1);
            const regSnapshot = await regQuery.get();
            if (regSnapshot.empty) throw new HttpsError("not-found", "Inscrição não encontrada. Verifique o nome.");

            await regSnapshot.docs[0].ref.update({ checkedIn: true });
            await tokenRef.update({ used: true });

            return { message: "Check-in realizado com sucesso!" };
        }

        default:
            throw new HttpsError("not-found", "Ação de evento desconhecida.");
    }
});


// ===================================================================
// ROTEADOR DE FUNÇÕES DE ACOMPANHAMENTO E FREQUÊNCIA
// ===================================================================
exports.followup = onCall(async (request) => {
    const { action, data } = request.data;
    const permittedRoles = ["diretor", "coordenador", "admin", "auxiliar_coordenacao", "professor", "professor_apoio", "professor_nexus"];

    switch (action) {
        case "get": {
            await checkPermission(request, permittedRoles);
            const { classId, date } = data;
            if (!classId || !date) throw new HttpsError("invalid-argument", "Dados insuficientes.");

            const docRef = db.collection("classes").doc(classId).collection("academicFollowUp").doc(date);
            const docSnap = await docRef.get();
            return docSnap.exists() ? docSnap.data() : {};
        }

        case "save": {
            await checkPermission(request, permittedRoles);
            const { classId, date, followUpData } = data;
            if (!classId || !date || !followUpData) throw new HttpsError("invalid-argument", "Dados insuficientes.");

            const docRef = db.collection("classes").doc(classId).collection("academicFollowUp").doc(date);
            await docRef.set(followUpData, { merge: true });

            return { message: "Acompanhamento salvo com sucesso!" };
        }

        case "saveAttendance": {
            await checkPermission(request, permittedRoles);
            const { classId, date, attendanceRecords } = data;
            if (!classId || !date || !attendanceRecords) throw new HttpsError("invalid-argument", "Dados insuficientes.");

            const docRef = db.collection("classes").doc(classId).collection("attendance").doc(date);
            await docRef.set({
                records: attendanceRecords,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { message: "Frequência salva com sucesso!" };
        }

        default:
            throw new HttpsError("not-found", "Ação de acompanhamento desconhecida.");
    }
});