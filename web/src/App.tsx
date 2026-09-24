import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthKontext';
import { Anmeldung } from './seiten/Anmeldung';
import { BewerbungBearbeiten } from './seiten/BewerbungBearbeiten';
import { Bewerbungsdetail } from './seiten/Bewerbungsdetail';
import { Bewerbungsliste } from './seiten/Bewerbungsliste';
import { NeueBewerbung } from './seiten/NeueBewerbung';

/** Leitet nicht angemeldete Personen zur Anmeldung und danach zurueck zum Ziel. */
function Geschuetzt({ children }: { children: ReactNode }) {
  const { benutzer } = useAuth();
  const location = useLocation();
  if (!benutzer) return <Navigate to="/anmeldung" replace state={{ von: location.pathname + location.search }} />;
  return <>{children}</>;
}

// Routen der Screens S1 bis S6 (S6 ist der Dialog auf S3).
export function App() {
  return (
    <Routes>
      <Route path="/anmeldung" element={<Anmeldung />} />
      <Route path="/bewerbungen" element={<Geschuetzt><Bewerbungsliste /></Geschuetzt>} />
      <Route path="/bewerbungen/neu" element={<Geschuetzt><NeueBewerbung /></Geschuetzt>} />
      <Route path="/bewerbungen/:id" element={<Geschuetzt><Bewerbungsdetail /></Geschuetzt>} />
      <Route path="/bewerbungen/:id/bearbeiten" element={<Geschuetzt><BewerbungBearbeiten /></Geschuetzt>} />
      <Route path="*" element={<Navigate to="/bewerbungen" replace />} />
    </Routes>
  );
}
