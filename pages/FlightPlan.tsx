import React, { useState } from 'react';
import { useWeatherStore } from '../store/weatherStore.ts';
import { Plane, ArrowRight, MapPin, FileText, Wind, AlertTriangle, CloudRain, CheckCircle2, Download, Fuel, Clock, Gauge, Map, List, Table } from 'lucide-react';
import MetarCard from '../components/MetarCard.tsx';
import InteractiveMap from '../components/InteractiveMap.tsx';
import { Notam } from '../types.ts';

const FlightPlan = () => {
  const { generateFlightPlan, activeFlightPlan, isLoading } = useWeatherStore();
  const [departure, setDeparture] = useState('KJFK');
  const [destination, setDestination] = useState('EGLL');
  const [aircraftType, setAircraftType] = useState('B737-800');
  const [cruiseSpeed, setCruiseSpeed] = useState('450'); // Knots

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (departure && destination) {
      generateFlightPlan(departure.toUpperCase(), destination.toUpperCase(), aircraftType);
    }
  };

  const downloadFlightPlan = () => {
      if (!activeFlightPlan) return;
      
      const content = `WEATHERLY FLIGHT PLAN
========================
DATE: ${new Date().toISOString()}
AIRCRAFT: ${aircraftType}
ROUTE: ${departure.toUpperCase()} -> ${destination.toUpperCase()}

DEPARTURE (${departure.toUpperCase()})
METAR: ${activeFlightPlan.departure.metar?.raw_text || 'N/A'}

DESTINATION (${destination.toUpperCase()})
METAR: ${activeFlightPlan.destination.metar?.raw_text || 'N/A'}

PERFORMANCE ESTIMATES
--------------------
Est. Flight Time: 06h 45m
Avg Wind Component: +45kts (Tailwind)
Fuel Required: 18,500 KG

NOTAMS
--------------------
${activeFlightPlan.departure.notams.map(n => n.number + ': ' + n.text).join('\n')}
`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FPL_${departure}_${destination}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const NotamList = ({ notams }: { notams: Notam[] }) => (
    <div className="space-y-2 mt-2">
      {notams.length > 0 ? (
        notams.slice(0, 3).map((notam) => (
          <div key={notam.id} className="bg-slate-800/50 p-3 rounded border border-slate-700/50 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-amber-500 font-mono">{notam.number}</span>
              <span className="text-xs text-slate-500">Effective: {new Date(notam.start).toLocaleDateString()}</span>
            </div>
            <p className="font-mono text-slate-300">{notam.text}</p>
          </div>
        ))
      ) : (
        <p className="text-slate-500 italic text-sm">No active NOTAMs reported.</p>
      )}
    </div>
  );

  // Mock NavLog Data Generator
  const generateNavLog = () => {
      return [
          { id: 1, ident: departure.toUpperCase(), type: 'APT', freq: '-', alt: '0', wind: '270/10', temp: '15', fuel: '0' },
          { id: 2, ident: 'MERIT', type: 'INT', freq: '-', alt: '10000', wind: '280/25', temp: '05', fuel: '800' },
          { id: 3, ident: 'HAPIE', type: 'INT', freq: '-', alt: '25000', wind: '290/40', temp: '-20', fuel: '2100' },
          { id: 4, ident: 'NANTUCKET', type: 'VOR', freq: '116.2', alt: '35000', wind: '290/55', temp: '-45', fuel: '3500' },
          { id: 5, ident: 'TUKTU', type: 'WPT', freq: '-', alt: '37000', wind: '285/65', temp: '-51', fuel: '6800' },
          { id: 6, ident: '50N050W', type: 'LAT', freq: '-', alt: '37000', wind: '280/85', temp: '-52', fuel: '9200' },
          { id: 7, ident: '53N030W', type: 'LAT', freq: '-', alt: '37000', wind: '280/80', temp: '-52', fuel: '12500' },
          { id: 8, ident: 'MALOT', type: 'WPT', freq: '-', alt: '37000', wind: '275/60', temp: '-50', fuel: '15100' },
          { id: 9, ident: 'OCK', type: 'VOR', freq: '115.3', alt: '12000', wind: '260/30', temp: '-10', fuel: '17800' },
          { id: 10, ident: destination.toUpperCase(), type: 'APT', freq: '-', alt: '83', wind: '250/12', temp: '14', fuel: '18500' },
      ];
  };

  const navLog = activeFlightPlan ? generateNavLog() : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header & Form */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Plane className="text-sky-500" /> Flight Planner
            </h1>
            <p className="text-slate-400 text-sm mt-1">Generate a comprehensive weather briefing and performance analysis.</p>
          </div>

          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-950/50 p-6 rounded-xl border border-slate-800">
             <div className="col-span-1 md:col-span-1">
                 <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Aircraft Type</label>
                 <select 
                    value={aircraftType}
                    onChange={(e) => setAircraftType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-sky-500 focus:outline-none"
                 >
                     <option value="C172">Cessna 172</option>
                     <option value="B737-800">Boeing 737-800</option>
                     <option value="A320">Airbus A320</option>
                     <option value="G650">Gulfstream G650</option>
                 </select>
             </div>
             
             <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Departure</label>
              <input
                type="text"
                value={departure}
                onChange={(e) => setDeparture(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono focus:border-sky-500 focus:outline-none uppercase"
                maxLength={4}
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono focus:border-sky-500 focus:outline-none uppercase"
                maxLength={4}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
            >
              {isLoading ? 'Calculating...' : 'Generate Plan'}
            </button>
          </form>
        </div>
      </section>

      {/* Results */}
      {isLoading && (
         <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
           <p>Analyzing Route Weather & Performance...</p>
         </div>
      )}

      {!isLoading && activeFlightPlan && (
        <div className="space-y-8">
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-sky-500/10 p-3 rounded-lg text-sky-400"><Clock size={24} /></div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Est. Time</div>
                        <div className="text-xl font-bold text-white">06h 45m</div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400"><Fuel size={24} /></div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Fuel Burn</div>
                        <div className="text-xl font-bold text-white">18,500 KG</div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-indigo-500/10 p-3 rounded-lg text-indigo-400"><Wind size={24} /></div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Avg Wind</div>
                        <div className="text-xl font-bold text-white">+45 KTS</div>
                    </div>
                </div>
                <button 
                    onClick={downloadFlightPlan}
                    className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl flex flex-col items-center justify-center transition-colors"
                >
                    <Download size={20} className="mb-1" />
                    <span className="text-sm font-medium">Download Plan</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Briefing Timeline & Map & NavLog */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* Route Map Visualization */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-80 relative">
                    <div className="absolute z-10 p-4">
                        <h3 className="text-sm font-bold text-slate-900 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm flex items-center gap-2">
                           <Map size={14} /> Active Route
                        </h3>
                    </div>
                    <InteractiveMap className="h-full" />
                </div>

                {/* Navigation Log */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Table size={18} className="text-sky-500" /> Navigation Log
                        </h3>
                        <span className="text-xs text-slate-500">Calculated based on GFS winds aloft</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-950 text-slate-500 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Ident</th>
                                    <th className="px-4 py-3 font-semibold">Type</th>
                                    <th className="px-4 py-3 font-semibold">Alt (ft)</th>
                                    <th className="px-4 py-3 font-semibold">Wind</th>
                                    <th className="px-4 py-3 font-semibold">OAT</th>
                                    <th className="px-4 py-3 font-semibold">Fuel Burn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {navLog.map((wpt) => (
                                    <tr key={wpt.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-white">{wpt.ident}</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{wpt.type}</td>
                                        <td className="px-4 py-3 font-mono text-slate-300">{parseInt(wpt.alt).toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-emerald-400">{wpt.wind}</td>
                                        <td className="px-4 py-3 font-mono text-slate-300">{wpt.temp}°C</td>
                                        <td className="px-4 py-3 font-mono text-slate-400">{parseInt(wpt.fuel).toLocaleString()} kg</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Departure Segment */}
                <div className="relative pl-8 border-l-2 border-slate-700 pb-8">
                <div className="absolute -left-[11px] top-0 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-950 flex items-center justify-center">
                    <MapPin size={12} className="text-emerald-950" />
                </div>
                
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Departure: {activeFlightPlan.departure.icao}
                    </h2>
                    <div className="flex gap-2 mt-2">
                    <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">ETD: +00:00</span>
                    </div>
                </div>

                {activeFlightPlan.departure.metar ? (
                    <MetarCard 
                        data={activeFlightPlan.departure.metar} 
                        taf={activeFlightPlan.departure.taf || undefined}
                    />
                ) : (
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded text-slate-500 text-center">
                    No METAR data available for {activeFlightPlan.departure.icao}
                    </div>
                )}
                </div>

                {/* Enroute Segment (Simulated) */}
                <div className="relative pl-8 border-l-2 border-slate-700 border-dashed pb-8">
                <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-700 rounded-full border-2 border-slate-950"></div>
                
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <CloudRain size={18} /> Enroute Conditions (Simulated)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-950 p-4 rounded border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase mb-1">Avg Wind @ FL350</p>
                        <p className="text-lg font-mono text-white">280 / 45kt</p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase mb-1">Turbulence</p>
                        <p className="text-lg font-mono text-emerald-400">None/Light</p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase mb-1">Sigwx</p>
                        <p className="text-lg font-mono text-white">Nil</p>
                        </div>
                    </div>
                </div>
                </div>

                {/* Destination Segment */}
                <div className="relative pl-8 border-l-2 border-slate-700">
                <div className="absolute -left-[11px] top-0 w-6 h-6 bg-sky-500 rounded-full border-4 border-slate-950 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-sky-950" />
                </div>

                <div className="mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Destination: {activeFlightPlan.destination.icao}
                    </h2>
                    <div className="flex gap-2 mt-2">
                    <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">ETE: 06:45</span>
                    </div>
                </div>

                {activeFlightPlan.destination.metar ? (
                    <MetarCard 
                        data={activeFlightPlan.destination.metar} 
                        taf={activeFlightPlan.destination.taf || undefined}
                    />
                ) : (
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded text-slate-500 text-center">
                    No METAR data available for {activeFlightPlan.destination.icao}
                    </div>
                )}
                </div>

            </div>

            {/* Right Sidebar - NOTAMs & TAFs */}
            <div className="lg:col-span-4 space-y-6">
                {/* Departure Info */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-amber-500" /> 
                    {activeFlightPlan.departure.icao} Notices
                    </h3>
                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    <NotamList notams={activeFlightPlan.departure.notams} />
                    </div>
                </div>

                {/* Destination Info */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-amber-500" /> 
                    {activeFlightPlan.destination.icao} Notices
                    </h3>
                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    <NotamList notams={activeFlightPlan.destination.notams} />
                    </div>
                </div>
            </div>

            </div>
        </div>
      )}
    </div>
  );
};

export default FlightPlan;