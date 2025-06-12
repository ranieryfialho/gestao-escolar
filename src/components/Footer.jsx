// src/components/Footer.jsx

import React from 'react';
// 1. Ícone alterado de 'Heart' para 'Code' para um visual mais técnico
import { Code } from 'lucide-react'; 

function Footer() {
  return (
    <footer className="w-full mt-auto py-6 text-center">
      {/* 2. Ordem e texto alterados: Ícone -> "Desenvolvido por" -> Link */}
      <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
        <Code size={16} className="text-gray-500" /> {/* 3. Ícone na frente */}
        <span>Desenvolvido por</span>
        <a 
          href="https://github.com/ranieryfialho/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Raniery Fialho
        </a>
      </p>
    </footer>
  );
}

export default Footer;