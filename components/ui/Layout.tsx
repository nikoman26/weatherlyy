import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeatherStore } from '../../store/weatherStore.ts';
import { 
  CloudSun, 
  Map, 
  LayoutDashboard, 
  FileWarning, 
  LogOut, 
  Settings,
  Plane,
  Globe,
  Calculator,
  ClipboardList,
  Shield,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout, user } = useWeatherStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path 
    ? "bg-slate-800 text-sky-400 border-r-2 border-sky-400" 
    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200";

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-sky-900/50">
          <CloudSun size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white">Weatherly</h1>
          <p className="text-xs text-slate-500 font-mono">PRO FLIGHT OPS</p>
        </div>
        {/* Close button for mobile */}
        <button className="ml-auto lg:hidden text-slate-400" onClick={toggleMenu}>
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive('/')}`}>
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link to="/map" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive('/map')}`}>
          <Globe size={20} />
          <span className="font-medium">Interactive Map</span>
        </Link>
        <Link to="/plan" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive('/plan')}`}>
          <Map size={20} />
          <span className="font-medium">Flight Plan</span>
        </Link>
        <Link to="/weather" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive('/weather')}`}>
          <CloudSun size={20} />
          <span className="font-medium">Weather</span>
        </Link>
        <Link to="/notams" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive('/notams')}`}>
          <FileWarning size={20} />
          <span className="font-medium">NOTAMs</span>
        </Link>
        <Link to="/pireps" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive('/pireps')}`}>
          <Plane size={20} />
          <span className="font-medium">PIREPs</span>
        </Link>
        <Link to="/tools" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive('/tools')}`}>
          <Calculator size={20} />
          <span className="font-medium">Tools</span>
        </Link>
        <Link to="/checklists" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive('/checklists')}`}>
          <ClipboardList size={20} />
          <span className="font-medium">Checklists</span>
        </Link>
        
        {/* Admin Link - RBAC */}
        {user?.role === 'admin' && (
           <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all mt-6 ${isActive('/admin')}`}>
             <Shield size={20} />
             <span className="font-medium">Admin Panel</span>
           </Link>
        )}

        <div className="my-4 border-t border-slate-800 pt-4">
            <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive('/settings')}`}>
                <Settings size={20} />
                <span className="font-medium">Settings</span>
            </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            {user?.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-md transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Mobile Hamburger Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 z-40">
         <button onClick={toggleMenu} className="text-slate-200 p-2">
            <Menu size={24} />
         </button>
         <div className="ml-4 font-bold text-white flex items-center gap-2">
            <CloudSun size={20} className="text-sky-500" /> Weatherly
         </div>
      </div>

      {/* Sidebar - Desktop (Static) & Mobile (Drawer) */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pt-16 lg:pt-0">
        {/* Desktop Top Header - Hidden on Mobile */}
        <header className="hidden lg:flex h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 items-center justify-between px-8">
            <h2 className="font-semibold text-slate-100">
              {location.pathname === '/' ? 'Mission Control' : 
               location.pathname === '/admin' ? 'Admin Dashboard' :
               location.pathname === '/plan' ? 'Flight Planning' :
               location.pathname === '/map' ? 'Global Interactive Map' :
               location.pathname === '/tools' ? 'Aviation Calculators' :
               location.pathname === '/checklists' ? 'Electronic Checklist' :
               location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)}
            </h2>
            <div className="flex items-center gap-4">
               <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">SYSTEM ONLINE</span>
               <span className="text-xs text-slate-500">{new Date().toUTCString()}</span>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;