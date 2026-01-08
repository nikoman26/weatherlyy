import React, { useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSession, SessionProvider } from './src/components/SessionProvider.tsx';
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading: sessionLoading } = useSession();
  const { initialize, user, isLoading: storeLoading } = useWeatherStore();
  
  useEffect(() => {
    if (session && !user) {
      initialize();
    }
  }, [session, user, initialize]);

  if (sessionLoading || (session && storeLoading && !user)) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }
  
  if (!session) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading: sessionLoading } = useSession();
  const { initialize, user, isLoading: storeLoading } = useWeatherStore();
  
  useEffect(() => {
    if (session && !user) {
      initialize();
    }
  }, [session, user, initialize]);

  if (sessionLoading || (session && storeLoading && !user)) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" />;
  
  if (user?.role !== 'admin') return <Navigate to="/" />;
  
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <SessionProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapViewer /></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute><FlightPlan /></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
          <Route path="/notams" element={<ProtectedRoute><Notams /></ProtectedRoute>} />
          <Route path="/pireps" element={<ProtectedRoute><Pireps /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
          <Route path="/checklists" element={<ProtectedRoute><Checklists /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>
  );
};

export default App;