import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ArenaDashboard } from './components/Arena/ArenaDashboard';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ArenaDashboard />
  </StrictMode>,
);
