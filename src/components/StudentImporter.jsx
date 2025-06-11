// src/components/StudentImporter.jsx

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// Função helper para "limpar" e normalizar os nomes dos cabeçalhos
const normalizeHeader = (header) => {
  if (typeof header !== 'string') return '';
  return header
    .trim() // Remove espaços no início e no fim
    .toLowerCase() // Converte para minúsculas
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
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
          alert("A planilha parece estar vazia ou num formato incorreto.");
          setLoading(false);
          return;
        }

        // --- LÓGICA DE DETECÇÃO INTELIGENTE DE CABEÇALHOS ---
        const firstStudent = json[0];
        const headers = Object.keys(firstStudent);
        
        const nameHeader = headers.find(h => normalizeHeader(h) === "nome do aluno") || headers.find(h => normalizeHeader(h) === "nome");
        const codeHeader = headers.find(h => normalizeHeader(h) === "codigo");

        if (!nameHeader || !codeHeader) {
          throw new Error("Não foi possível encontrar as colunas 'Nome do Aluno' e 'Código' na planilha.");
        }
        // --- FIM DA LÓGICA DE DETECÇÃO ---

        const formattedStudents = json.map((student, index) => ({
          id: Date.now() + index,
          // Usamos os cabeçalhos que encontrámos para aceder aos dados
          name: student[nameHeader] || 'Nome não encontrado',
          code: student[codeHeader] || 'Código não encontrado',
          grades: {},
        }));
        
        onStudentsImported(formattedStudents);
      } catch (error) {
        console.error("Erro ao processar o arquivo:", error);
        alert(error.message || "Ocorreu um erro ao ler a planilha.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
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