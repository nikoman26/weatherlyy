import React, { useState } from 'react';
import { useWeatherStore } from '../store/weatherStore.ts';
import { CloudSun, ArrowRight, Plane } from 'lucide-react';

const Login = () => {
  const { login, isLoading } = useWeatherStore();
  const [email, setEmail] = useState('pilot@weatherly.co.ke');
  const [password, setPassword] = useState('password');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-20 left-20 w-96 h-96 bg-sky-900 rounded-full blur-[128px]"></div>
         <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-900 rounded-full blur-[128px]"></div>
      </div>

      <div className="z-10 w-full max-w-md p-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-sky-900/50">
            <CloudSun size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back, Captain</h1>
          <p className="text-slate-400">Sign in to access flight briefings and weather.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                Initialize Session <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-500 text-sm">
          System Access Restricted • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default Login;