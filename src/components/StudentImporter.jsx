// src/components/StudentImporter.jsx (CORRIGIDO)

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const normalizeHeader = (header) => {
  if (typeof header !== 'string') return '';
  return header.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

function StudentImporter({ onStudentsImported }) {
  const [loading, setLoading] = useState(false);

  const handleFile = (event) => {
    setLoading(true);
    const file = event.target.files[0];
    if (!file) {
      setLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error("A planilha parece estar vazia ou num formato incorreto.");
        }

        const firstStudent = json[0];
        const headers = Object.keys(firstStudent);
        
        const nameHeader = headers.find(h => normalizeHeader(h) === "nome do aluno") || headers.find(h => normalizeHeader(h) === "nome");
        const codeHeader = headers.find(h => normalizeHeader(h) === "codigo");

        if (!nameHeader || !codeHeader) {
          throw new Error("Não foi possível encontrar as colunas 'Nome do Aluno' e 'Código' na planilha.");
        }

        const formattedStudents = json.map((student) => ({
          name: student[nameHeader] || 'Nome não encontrado',
          code: student[codeHeader] || 'Código não encontrado',
        }));
        
        onStudentsImported(formattedStudents);
      } catch (error) {
        console.error("Erro ao processar o arquivo:", error);
        alert(error.message || "Ocorreu um erro ao ler a planilha.");
      } finally {
        setLoading(false);
        event.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="my-4">
      <label
        htmlFor="file-upload"
        className="inline-block px-6 py-3 text-white font-bold rounded-lg cursor-pointer transition duration-300 bg-blue-600 hover:bg-blue-700"
      >
        {loading ? 'A processar...' : 'Importar Alunos (Excel)'}
      </label>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept=".xlsx, .xls, .csv"
        onChange={handleFile}
        disabled={loading}
      />
    </div>
  );
}

export default StudentImporter;