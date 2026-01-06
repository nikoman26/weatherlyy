import React, { useState } from 'react';
import { useWeatherStore } from '../store/weatherStore.ts';
import { Settings as SettingsIcon, User, Bell, Save, Moon, Sun, Wind, Thermometer } from 'lucide-react';

const Settings = () => {
  const { user, updatePreferences, updateUserProfile, isLoading } = useWeatherStore();
  
  const [username, setUsername] = useState(user?.username || '');
  const [license, setLicense] = useState(user?.licenseNumber || '');
  const [cert, setCert] = useState(user?.pilotCertification || '');

  // Safety check if user isn't loaded yet
  if (!user) return null;

  const handleProfileSave = (e: React.FormEvent) => {
      e.preventDefault();
      updateUserProfile({
          username,
          licenseNumber: license,
          pilotCertification: cert
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div>
           <h1 className="text-2xl font-bold text-white flex items-center gap-2">
             <SettingsIcon className="text-sky-500" /> Settings & Preferences
           </h1>
           <p className="text-slate-400 text-sm mt-1">Manage your pilot profile and system configuration.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Navigation / Sidebar for Settings (Visual only for now, could be active tabs) */}
           <div className="space-y-2">
               <button className="w-full text-left px-4 py-3 bg-slate-800 text-sky-400 rounded-lg font-medium border border-sky-500/30">
                   General Preferences
               </button>
               <button className="w-full text-left px-4 py-3 text-slate-400 hover:bg-slate-800/50 rounded-lg transition-colors">
                   Account Security
               </button>
               <button className="w-full text-left px-4 py-3 text-slate-400 hover:bg-slate-800/50 rounded-lg transition-colors">
                   Billing & Plan
               </button>
           </div>

           <div className="md:col-span-2 space-y-8">
               
               {/* Display Settings */}
               <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                       <Sun size={20} /> Interface & Units
                   </h3>
                   
                   <div className="space-y-6">
                       <div className="flex items-center justify-between">
                           <div>
                               <label className="text-slate-200 font-medium">Dark Mode</label>
                               <p className="text-xs text-slate-500">Toggle system-wide dark theme</p>
                           </div>
                           <button 
                               onClick={() => updatePreferences({ darkMode: !user.preferences.darkMode })}
                               className={`w-12 h-6 rounded-full p-1 transition-colors ${user.preferences.darkMode ? 'bg-sky-600' : 'bg-slate-700'}`}
                           >
                               <div className={`w-4 h-4 rounded-full bg-white transition-transform ${user.preferences.darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                           </button>
                       </div>

                       <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                               <Thermometer size={16} className="text-slate-400" />
                               <label className="text-slate-200 font-medium">Temperature Unit</label>
                           </div>
                           <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                               <button 
                                   onClick={() => updatePreferences({ temperatureUnit: 'celsius' })}
                                   className={`px-3 py-1 text-sm rounded ${user.preferences.temperatureUnit === 'celsius' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                               >
                                   Celsius
                               </button>
                               <button 
                                   onClick={() => updatePreferences({ temperatureUnit: 'fahrenheit' })}
                                   className={`px-3 py-1 text-sm rounded ${user.preferences.temperatureUnit === 'fahrenheit' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                               >
                                   Fahrenheit
                               </button>
                           </div>
                       </div>

                       <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                               <Wind size={16} className="text-slate-400" />
                               <label className="text-slate-200 font-medium">Wind Speed Unit</label>
                           </div>
                           <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                               <button 
                                   onClick={() => updatePreferences({ windUnit: 'kts' })}
                                   className={`px-3 py-1 text-sm rounded ${user.preferences.windUnit === 'kts' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                               >
                                   Knots
                               </button>
                               <button 
                                   onClick={() => updatePreferences({ windUnit: 'mph' })}
                                   className={`px-3 py-1 text-sm rounded ${user.preferences.windUnit === 'mph' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                               >
                                   MPH
                               </button>
                           </div>
                       </div>
                   </div>
               </section>

               {/* Notifications */}
               <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                       <Bell size={20} /> Notifications
                   </h3>
                   <div className="space-y-4">
                       <label className="flex items-center gap-3 cursor-pointer">
                           <input 
                                type="checkbox" 
                                checked={user.preferences.emailAlerts}
                                onChange={() => updatePreferences({ emailAlerts: !user.preferences.emailAlerts })}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-sky-600 focus:ring-sky-500"
                           />
                           <div>
                               <div className="text-slate-200 text-sm font-medium">Email Alerts</div>
                               <div className="text-slate-500 text-xs">Receive flight plan updates and major SIGMETs via email.</div>
                           </div>
                       </label>
                       
                       <label className="flex items-center gap-3 cursor-pointer">
                           <input 
                                type="checkbox" 
                                checked={user.preferences.smsAlerts}
                                onChange={() => updatePreferences({ smsAlerts: !user.preferences.smsAlerts })}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-sky-600 focus:ring-sky-500"
                           />
                           <div>
                               <div className="text-slate-200 text-sm font-medium">SMS Alerts</div>
                               <div className="text-slate-500 text-xs">Receive critical alerts via text message.</div>
                           </div>
                       </label>
                   </div>
               </section>

               {/* Profile Form */}
               <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                       <User size={20} /> Pilot Profile
                   </h3>
                   <form onSubmit={handleProfileSave} className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Username / Call Sign</label>
                               <input 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-sky-500 focus:outline-none" 
                                />
                           </div>
                           <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                               <input type="email" disabled value={user.email} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-500 cursor-not-allowed" />
                           </div>
                           <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">License Number</label>
                               <input 
                                    type="text" 
                                    value={license} 
                                    onChange={(e) => setLicense(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-sky-500 focus:outline-none" 
                                />
                           </div>
                           <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Certification</label>
                               <input 
                                    type="text" 
                                    value={cert} 
                                    onChange={(e) => setCert(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-sky-500 focus:outline-none" 
                                />
                           </div>
                       </div>
                       <div className="flex justify-end pt-4">
                           <button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                               <Save size={18} /> {isLoading ? 'Saving...' : 'Save Profile'}
                           </button>
                       </div>
                   </form>
               </section>
           </div>
       </div>
    </div>
  );
};

export default Settings;