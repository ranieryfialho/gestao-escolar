import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import { AuthProvider } from './contexts/AuthContext.jsx';
import { ClassesProvider } from './contexts/ClassContext.jsx';
import { UsersProvider } from './contexts/UserContext.jsx';

import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ClassesProvider>
          <UsersProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </UsersProvider>
        </ClassesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);