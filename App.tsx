import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useWeatherStore } from './store/weatherStore.ts';
import Layout from './components/ui/Layout.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Weather from './pages/Weather.tsx';
import FlightPlan from './pages/FlightPlan.tsx';
import Notams from './pages/Notams.tsx';
import MapViewer from './pages/MapViewer.tsx';
import Pireps from './pages/Pireps.tsx';
import Settings from './pages/Settings.tsx';
import Tools from './pages/Tools.tsx';
import Checklists from './pages/Checklists.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';

// FIX: Moved ProtectedRoute and AdminRoute outside of the App component.
// Defining components inside another component is an anti-pattern in React. It causes the component to be
// re-created on every render, which can lead to state loss, performance issues, and confusing type errors like the one encountered.
// By moving them to the top level, they become stable components, which resolves the TypeScript errors.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useWeatherStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useWeatherStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useWeatherStore();

  return (
    <MemoryRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        {/* FIX: Explicitly passing the 'children' prop to work around a TypeScript inference issue where the children were not being recognized when nested inside the 'element' prop. */}
        <Route path="/" element={<ProtectedRoute children={<Dashboard />} />} />
        <Route path="/map" element={<ProtectedRoute children={<MapViewer />} />} />
        <Route path="/plan" element={<ProtectedRoute children={<FlightPlan />} />} />
        <Route path="/weather" element={<ProtectedRoute children={<Weather />} />} />
        <Route path="/notams" element={<ProtectedRoute children={<Notams />} />} />
        <Route path="/pireps" element={<ProtectedRoute children={<Pireps />} />} />
        <Route path="/settings" element={<ProtectedRoute children={<Settings />} />} />
        <Route path="/tools" element={<ProtectedRoute children={<Tools />} />} />
        <Route path="/checklists" element={<ProtectedRoute children={<Checklists />} />} />
        
        {/* Admin Route */}
        {/* FIX: Explicitly passing the 'children' prop to work around a TypeScript inference issue. */}
        <Route path="/admin" element={<AdminRoute children={<AdminDashboard />} />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </MemoryRouter>
  );
};

export default App;