import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import { ExtensionPanel } from './ExtensionPanel';

createRoot(document.getElementById('root')!).render(
  <StrictMode><ExtensionPanel /></StrictMode>
);
