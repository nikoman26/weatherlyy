import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeatherStore } from '../store/weatherStore.ts';
import { Search, MapPin, Clock, Calendar, ArrowRight, Wind, Eye, Cloud, BarChart3, Map } from 'lucide-react';
import MetarCard from '../components/MetarCard.tsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Custom Tooltip for the Wind Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="text-slate-200 text-sm font-bold mb-2 font-mono border-b border-slate-700 pb-2">
          {label}
        </p>
        <div className="space-y-1.5 font-mono text-sm">
          <div className="flex items-center justify-between gap-4 text-sky-400">
            <span>Wind Speed:</span>
            <span className="font-bold text-white">{data.wind} kt</span>
          </div>
          {data.gust > 0 && (
            <div className="flex items-center justify-between gap-4 text-rose-400">
              <span>Gust Speed:</span>
              <span className="font-bold text-white">{data.gust} kt</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const Weather = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialIcao = searchParams.get('icao') || 'KJFK';
  const [inputIcao, setInputIcao] = useState(initialIcao);
  const [activeTab, setActiveTab] = useState<'terminal' | 'charts'>('terminal');
  
  const { weatherData, notams, fetchWeather, fetchNotams, isLoading, error } = useWeatherStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputIcao) {
      setSearchParams({ icao: inputIcao.toUpperCase() });
      fetchWeather(inputIcao.toUpperCase());
      fetchNotams(inputIcao.toUpperCase());
    }
  };

  useEffect(() => {
    fetchWeather(initialIcao);
    fetchNotams(initialIcao);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount for the initial icao

  const currentData = weatherData[initialIcao];
  const currentNotams = notams[initialIcao] || [];

  // Prepare data for forecast chart (simulated from TAF)
  const chartData = currentData?.taf?.forecast.map((f, i) => {
    const date = new Date(f.timestamp.from);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      wind: f.wind?.speed_kts || 0,
      gust: f.wind?.gust_kts || 0,
    };
  }) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
            type="text"
            value={inputIcao}
            onChange={(e) => setInputIcao(e.target.value.toUpperCase())}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all uppercase"
            placeholder="Enter Airport ICAO..."
            maxLength={4}
            />
            <button type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors text-sm">
            Fetch
            </button>
        </form>

        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-full md:w-auto">
            <button 
                onClick={() => setActiveTab('terminal')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'terminal' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Wind size={16} /> Terminal Weather
            </button>
            <button 
                onClick={() => setActiveTab('charts')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'charts' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Map size={16} /> Synoptic Charts
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <>
            {activeTab === 'terminal' && currentData && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                    {/* METAR Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <Clock size={18} /> Current Conditions (METAR)
                        </h3>
                        {currentData.metar ? (
                            <MetarCard 
                                data={currentData.metar} 
                                taf={currentData.taf || undefined}
                            />
                        ) : (
                            <p className="text-slate-500">No METAR available.</p>
                        )}
                    </section>

                    {/* Wind Chart */}
                    <section>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2"><BarChart3 size={18} /> Wind Forecast Trend</h3>
                            {currentData.taf ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <XAxis 
                                        dataKey="time" 
                                        stroke="#64748b" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        />
                                        <YAxis 
                                        stroke="#64748b" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        unit="kt" 
                                        />
                                        <Tooltip 
                                        content={<CustomTooltip />}
                                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                        />
                                        <Bar dataKey="wind" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.wind > 20 ? '#ef4444' : '#0ea5e9'} />
                                        ))}
                                        </Bar>
                                    </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-slate-500">
                                    No Forecast Data Available
                                </div>
                            )}
                        </div>
                    </section>

                    {/* NOTAMs Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <MapPin size={18} /> Active NOTAMs
                        </h3>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        {currentNotams.length > 0 ? (
                            <div className="divide-y divide-slate-800">
                                {currentNotams.map(notam => (
                                <div key={notam.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-amber-500 font-bold">{notam.number}</span>
                                        <span className="text-xs text-slate-500">
                                            EFF: {new Date(notam.start).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="font-mono text-sm text-slate-300 whitespace-pre-wrap">{notam.text}</p>
                                </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500">No active NOTAMs found for this station.</div>
                        )}
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'charts' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mock Chart Cards */}
                        {[
                            { title: 'Surface Analysis', color: 'bg-blue-900/20 border-blue-800' },
                            { title: 'Significant Weather (Low Level)', color: 'bg-emerald-900/20 border-emerald-800' },
                            { title: 'Winds / Temps Aloft (FL180)', color: 'bg-indigo-900/20 border-indigo-800' },
                            { title: 'Satellite (IR)', color: 'bg-slate-800 border-slate-700' }
                        ].map((chart, i) => (
                            <div key={i} className={`rounded-xl border p-4 ${chart.color} aspect-video relative group cursor-pointer overflow-hidden`}>
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="bg-slate-950/80 backdrop-blur text-white px-2 py-1 rounded text-sm font-bold border border-slate-700">
                                        {chart.title}
                                    </span>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs uppercase tracking-widest font-bold">
                                    Simulated Chart Image
                                </div>
                                {/* Grid effect overlay */}
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-sky-600 text-white px-4 py-2 rounded-lg font-medium">View Fullscreen</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center text-slate-500 text-sm">
                        <p>Charts are valid for: {new Date().toLocaleDateString()} 1200Z</p>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default Weather;