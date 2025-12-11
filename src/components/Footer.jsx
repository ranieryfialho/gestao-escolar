import React from 'react';
import { Code } from 'lucide-react'; 

function Footer() {
  return (
    <footer className="w-full mt-auto py-6 text-center">
      <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
        <Code size={16} className="text-gray-500" />
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