import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../src/integrations/supabase/client';
import { CloudSun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../src/components/SessionProvider';

const Login = () => {
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-20 left-20 w-96 h-96 bg-sky-900 rounded-full blur-[128px]"></div>
         <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-900 rounded-full blur-[128px]"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-sky-900/50">
            <CloudSun size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Weatherly</h1>
          <p className="text-slate-400">Aviation Weather Mission Control</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#0ea5e9',
                    brandAccent: '#0284c7',
                    inputBackground: '#0f172a',
                    inputText: 'white',
                    inputPlaceholder: '#64748b',
                  }
                }
              }
            }}
            theme="dark"
            providers={[]}
          />
        </div>
        
        <p className="text-center mt-6 text-slate-500 text-sm">
          Authorized Flight Personnel Only
        </p>
      </div>
    </div>
  );
};

export default Login;