# Boletim Escolar - Sistema de Gestão Acadêmica

Este projeto é uma aplicação web completa para a gestão de informações acadêmicas de uma escola, desenvolvida com React e Firebase. O sistema permite que administradores, coordenadores, professores e outros funcionários gerenciem turmas, alunos, notas e usuários com diferentes níveis de permissão.

## ✨ Funcionalidades Principais

* **Autenticação e Perfis de Usuário:** Sistema de login seguro com diferentes perfis (Diretor, Coordenador, Professor, Financeiro, etc.), cada um com suas permissões específicas.
* **Dashboard de Turmas:** Visualização centralizada das turmas, com busca e filtros por professor ou aluno.
* **Gestão de Turmas (Diário de Classe):**
    * Criação e edição de turmas com pacotes de módulos pré-definidos (ex: Grade 12 meses, Grade 19 meses).
    * Lançamento de notas finais e detalhadas por matéria.
    * Adição de observações por aluno.
    * Transferência de alunos entre turmas.
* **Importação de Alunos em Massa:** Facilidade para importar listas de alunos a partir de planilhas Excel (`.xlsx`).
* **Mapa de Turmas:** Uma visão geral de todas as turmas em andamento, ideal para planejamento e alocação de recursos.
* **Ferramentas de Apoio:**
    * **Calculadora de Reposição:** Ajuda a calcular quantas aulas um aluno precisa repor para atingir a frequência mínima.
    * **Controle de Laboratório:** Página para registrar e controlar os atendimentos e atividades realizadas no laboratório de apoio.
* **Gestão de Usuários (Admin):** Painel para administradores criarem, editarem e removerem contas de usuários do sistema.

## 🛠️ Tecnologias Utilizadas

* **Front-end:**
    * [React](https://react.dev/) (v19)
    * [Vite](https://vitejs.dev/)
    * [React Router](https://reactrouter.com/) (v7)
    * [Tailwind CSS](https://tailwindcss.com/)
* **Back-end e Banco de Dados:**
    * [Firebase](https://firebase.google.com/)
        * **Firestore:** Banco de dados NoSQL para armazenar informações de turmas, alunos e usuários.
        * **Firebase Authentication:** Para gerenciamento de login e autenticação.
        * **Cloud Functions:** Para a lógica de back-end, como criação de usuários e manipulação de dados sensíveis.
* **Outras Bibliotecas:**
    * `react-hot-toast` para notificações
    * `lucide-react` para ícones
    * `xlsx` para importação de planilhas
    * `jspdf` e `jspdf-autotable` para exportação de PDFs

## 🚀 Como Executar o Projeto

### Pré-requisitos

* Node.js (versão 22 ou superior, conforme `functions/package.json`)
* Uma conta no Firebase com um projeto configurado.

### Configuração

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/ranieryfialho/boletim-escolar.git](https://github.com/ranieryfialho/boletim-escolar.git)
    cd boletim-escolar
    ```

2.  **Instale as dependências do front-end:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto e adicione as suas credenciais do Firebase, seguindo o exemplo de `src/firebase.js`:
    ```env
    VITE_FIREBASE_API_KEY=SUA_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN=SEU_AUTH_DOMAIN
    VITE_FIREBASE_PROJECT_ID=SEU_PROJECT_ID
    VITE_FIREBASE_STORAGE_BUCKET=SEU_STORAGE_BUCKET
    VITE_FIREBASE_MESSAGING_SENDER_ID=SEU_MESSAGING_SENDER_ID
    VITE_FIREBASE_APP_ID=SEU_APP_ID
    ```

4.  **Instale as dependências e configure o back-end (Firebase Functions):**
    ```bash
    cd functions
    npm install
    ```
    Certifique-se de estar logado no Firebase CLI e com o projeto correto selecionado.

5.  **Faça o deploy das Cloud Functions:**
    ```bash
    firebase deploy --only functions
    ```

### Executando

1.  **Inicie a aplicação front-end em modo de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:5173` (ou outra porta indicada pelo Vite).

2.  **Para fazer o build de produção:**
    ```bash
    npm run build
    ```