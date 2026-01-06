import React, { useEffect, useState } from 'react';
import { useWeatherStore } from '../store/weatherStore.ts';
import { Link } from 'react-router-dom';
import { Wind, Navigation, AlertTriangle, FileText, Plus, Search, MapPin } from 'lucide-react';
import MetarCard from '../components/MetarCard.tsx';

const Dashboard = () => {
  const { user, weatherData, fetchWeather, pireps, fetchPireps, activeAirport, setActiveAirport } = useWeatherStore();
  const [searchInput, setSearchInput] = useState('');

  // Initial load
  useEffect(() => {
    if (user?.favoriteAirports) {
      user.favoriteAirports.forEach(icao => fetchWeather(icao));
      // Set default active airport to first favorite if not set
      if (!activeAirport) {
        setActiveAirport(user.favoriteAirports[0]);
      }
    }
    fetchPireps();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.length >= 3) {
      const icao = searchInput.toUpperCase();
      fetchWeather(icao);
      setActiveAirport(icao);
      setSearchInput('');
    }
  };

  const recentPireps = pireps.slice(0, 3);
  
  // Determine which airport data to show in the main card
  const displayIcao = activeAirport || (user?.favoriteAirports ? user.favoriteAirports[0] : 'KJFK');
  const displayWeather = weatherData[displayIcao];

  // Simulated Nearest Airports Data
  const nearestAirports = [
    { icao: 'KTEB', dist: '12nm', bearing: 'NW', cat: 'IFR' },
    { icao: 'KLGA', dist: '15nm', bearing: 'NE', cat: 'VFR' },
    { icao: 'KEWR', dist: '18nm', bearing: 'W', cat: 'MVFR' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Bar with Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Flight Operations Center</h1>
           <p className="text-slate-400">Welcome, Captain {user?.username}</p>
        </div>
        
        <div className="flex flex-1 md:justify-end gap-3">
           <form onSubmit={handleSearch} className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search Airport (ICAO)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 uppercase font-mono"
                maxLength={4}
              />
           </form>
           <Link to="/plan" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap">
             <Plus size={16} /> New Plan
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Weather Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
              Current Conditions <span className="text-sm font-normal text-slate-500">| {displayIcao}</span>
            </h3>
            {displayIcao !== user?.favoriteAirports[0] && (
               <button 
                  onClick={() => user?.favoriteAirports[0] && setActiveAirport(user.favoriteAirports[0])}
                  className="text-xs text-sky-400 hover:underline"
               >
                 Reset to Default
               </button>
            )}
          </div>
          
          {displayWeather && displayWeather.metar ? (
            <MetarCard 
                data={displayWeather.metar} 
                taf={displayWeather.taf || undefined} 
            />
          ) : (
             <div className="h-64 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-center flex-col gap-3 text-slate-500 animate-pulse">
               <Wind size={32} className="opacity-50" />
               <span>Acquiring Telemetry for {displayIcao}...</span>
             </div>
          )}

          {/* Favorites Grid */}
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-8 mb-4">Monitored Stations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.favoriteAirports.map(icao => {
              const data = weatherData[icao]?.metar;
              // Skip if this is the currently displayed main airport to avoid duplication visual
              if (icao === displayIcao) return null; 

              return (
                <div 
                   key={icao} 
                   onClick={() => setActiveAirport(icao)}
                   className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-sky-500/50 transition-all group cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white">{icao}</span>
                    {data && (
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        data.flight_category === 'VFR' ? 'bg-green-500/20 text-green-400' : 
                        data.flight_category === 'IFR' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {data.flight_category}
                      </span>
                    )}
                  </div>
                  {data ? (
                    <div className="text-sm text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                         <Wind size={14} /> {data.wind.direction_degrees}/{data.wind.speed_kts}kt
                      </div>
                      <div className="mt-1">
                        {data.temperature.celsius}°C / A{data.altimeter.hg}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">Loading...</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar - PIREPs & Alerts */}
        <div className="space-y-6">
          {/* Alerts Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <div className="flex items-center gap-2 mb-4 text-amber-400">
                <AlertTriangle size={20} />
                <h3 className="font-semibold text-slate-200">Active Alerts</h3>
             </div>
             <div className="space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded text-sm text-amber-200">
                   <span className="font-bold block mb-1">SIGMET (KJFK)</span>
                   Severe turbulence forecast FL300-380.
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded text-sm text-blue-200">
                   <span className="font-bold block mb-1">AIRMET (Northeast)</span>
                   Icing potential between 1200Z and 1800Z.
                </div>
             </div>
          </div>
          
          {/* Nearest Airports Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <MapPin size={20} />
                <h3 className="font-semibold text-slate-200">Nearest Airports</h3>
             </div>
             <div className="space-y-1">
                {nearestAirports.map(apt => (
                    <div key={apt.icao} className="flex items-center justify-between p-2 rounded hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => { fetchWeather(apt.icao); setActiveAirport(apt.icao); }}>
                        <div>
                            <span className="font-bold text-white mr-2">{apt.icao}</span>
                            <span className="text-xs text-slate-500">{apt.dist} {apt.bearing}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            apt.cat === 'VFR' ? 'bg-green-500/20 text-green-400' :
                            apt.cat === 'IFR' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>{apt.cat}</span>
                    </div>
                ))}
             </div>
          </div>

          {/* Recent PIREPs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <div className="flex items-center gap-2 mb-4 text-sky-400">
                <Navigation size={20} />
                <h3 className="font-semibold text-slate-200">Recent PIREPs</h3>
             </div>
             <div className="space-y-4">
               {recentPireps.map(pirep => (
                 <div key={pirep.id} className="border-b border-slate-800 last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                       <span>{pirep.icao_code}</span>
                       <span>{new Date(pirep.submitted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-sm text-slate-300 font-medium">{pirep.aircraft_type} @ FL{pirep.flight_level}</div>
                    <div className="text-sm text-slate-400 mt-1">{pirep.turbulence} • {pirep.weather_conditions}</div>
                 </div>
               ))}
             </div>
             <Link to="/pireps" className="block text-center mt-4 text-sm text-sky-500 hover:text-sky-400">
               View Global Map
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;