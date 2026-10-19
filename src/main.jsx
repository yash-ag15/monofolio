import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { StoreProvider } from './store.jsx';
import { ToastProvider } from './components/ui.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StoreProvider>
  </React.StrictMode>
);
