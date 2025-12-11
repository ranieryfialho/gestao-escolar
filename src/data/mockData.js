// src/data/mockData.js

// 1. Uma "biblioteca" com todos os módulos que a escola oferece.
export const masterModuleList = {
  'ICN': { id: 'ICN', title: 'ICN - Internet e Computação em Nuvem', syllabus: 'Conceitos de internet, serviços na nuvem, segurança e ferramentas de colaboração online.' },
  
  'OFFA': { 
    id: 'OFFA', 
    title: 'OFFA - Office Aplicado', 
    syllabus: 'Domínio das ferramentas do pacote Office: Word, Excel, PowerPoint com foco em produtividade.',
    subGrades: [
      'Avaliação de Word',
      'Avaliação de Excel',
      'Avaliação de PowerPoint'
    ] 
  },

  'ADM': { 
    id: 'ADM', 
    title: 'ADM - Assistente Administrativo', 
    syllabus: 'Rotinas administrativas, gestão de documentos, atendimento ao cliente e noções de finanças.',
    subGrades: [
      'Gestão de Pessoas e Pensamento Estratégico',
      'Gestão Financeira',
      'Projeto'
    ]
  },

  'PWB': { id: 'PWB', title: 'PWB - PowerBi', syllabus: 'Criação de dashboards interativos, tratamento de dados e visualização para tomada de decisão.' },
  'TRI': { id: 'TRI', title: 'TRI - Tratamento de Imagens com Photoshop', syllabus: 'Edição, retoque, montagens e preparação de imagens para mídias digitais e impressas.' },
  'CMV': { id: 'CMV', title: 'CMV - Comunicação Visual com Illustrator', syllabus: 'Criação de vetores, logotipos, identidades visuais e peças gráficas.' },
};

// 2. Os pacotes pré-definidos que um coordenador pode escolher.
export const modulePackages = [
  {
    id: 'especializacao_19',
    name: 'Grade com Especialização (19 meses)',
    moduleKeys: ['ICN', 'OFFA', 'ADM', 'PWB', 'TRI', 'CMV']
  },
  {
    id: 'info_admin_12',
    name: 'Grade Informática e Administração (12 meses)',
    moduleKeys: ['ICN', 'OFFA', 'ADM']
  }
];

// 3. Nossa lista inicial de turmas. 
export const initialClassesData = [
  {
    
  },
];