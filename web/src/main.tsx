import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import './styles/variablen.css';
import './styles/app.css';
import { App } from './App';
import { AuthAnbieter } from './auth/AuthKontext';
import { SprachAnbieter } from './i18n/SprachKontext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SprachAnbieter>
        <AuthAnbieter>
          <App />
        </AuthAnbieter>
      </SprachAnbieter>
    </BrowserRouter>
  </StrictMode>,
);
