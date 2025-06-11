// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ClassProvider } from './contexts/ClassContext.jsx';
import { UserProvider } from './contexts/UserContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ClassProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </ClassProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
