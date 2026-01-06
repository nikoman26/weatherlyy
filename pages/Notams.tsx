import React, { useState } from 'react';
import { MOCK_NOTAMS } from '../services/mockData.ts';
import { List, Search, MapPin, X } from 'lucide-react';

const Notams = () => {
  const [selectedNotam, setSelectedNotam] = useState<any | null>(null);
  
  // Flatten all notams for map display
  const allNotams = Object.entries(MOCK_NOTAMS).flatMap(([icao, list]) => 
      list.map(n => ({...n, station: icao}))
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
        {/* Sidebar List */}
        <div className="w-full lg:w-96 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full">
            <div className="p-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <List size={20} /> Active NOTAMs
                </h2>
                <div className="mt-3 relative">
                    <input 
                        type="text" 
                        placeholder="Filter by ICAO..." 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-10 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                    <Search size={16} className="absolute right-3 top-2.5 text-slate-500" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {allNotams.map(notam => (
                    <div 
                        key={notam.id}
                        onClick={() => setSelectedNotam(notam)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedNotam?.id === notam.id ? 'bg-sky-500/10 border-sky-500' : 'bg-slate-800/50 border-slate-800 hover:border-slate-600'}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                             <span className="font-bold text-amber-500 font-mono">{notam.station}</span>
                             <span className="text-xs text-slate-500">{new Date(notam.start).toLocaleDateString()}</span>
                        </div>
                        <div className="font-mono text-xs text-slate-300 truncate">{notam.text}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Map View Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden group">
             {/* Fake Map Background */}
             <div className="absolute inset-0 bg-[#0f172a] opacity-50 z-0">
                 {/* Grid lines for effect */}
                 <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
             </div>
             
             {/* Instructions Overlay */}
             <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg z-20 text-xs text-slate-400 max-w-xs">
                 <p className="flex items-center gap-2"><MapPin size={14} className="text-red-500" /> Red markers indicate active critical NOTAMs.</p>
             </div>

             {/* Simulated Map Markers */}
             {allNotams.map((notam, index) => {
                 // Random positioning for demo purposes since we don't have a real projection library loaded here
                 // In a real app, we'd use Leaflet or Mapbox with lat/lng
                 const top = 20 + (index * 15) + '%';
                 const left = 20 + (index * 20) + '%';
                 
                 return (
                     <button
                        key={notam.id}
                        onClick={() => setSelectedNotam(notam)}
                        style={{ top, left }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group/marker z-10 hover:z-30 transition-all"
                     >
                         <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${selectedNotam?.id === notam.id ? 'bg-sky-500 scale-125' : 'bg-red-500'} animate-pulse`}></div>
                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/marker:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                             {notam.station}
                         </div>
                     </button>
                 );
             })}

             {/* Selected Notam Detail Overlay on Map */}
             {selectedNotam && (
                 <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-96 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl z-30 animate-in slide-in-from-bottom-4 duration-300">
                     <div className="flex justify-between items-start mb-3">
                         <div>
                             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                 {selectedNotam.station} <span className="text-sm font-normal text-slate-400">({selectedNotam.number})</span>
                             </h3>
                             <span className="text-xs text-amber-500 font-bold uppercase">{selectedNotam.type === 'N' ? 'Notice' : 'Warning'}</span>
                         </div>
                         <button onClick={() => setSelectedNotam(null)} className="text-slate-400 hover:text-white">
                             <X size={18} />
                         </button>
                     </div>
                     <p className="text-sm font-mono text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                         {selectedNotam.text}
                     </p>
                     <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-500">
                         <span>Source: {selectedNotam.source}</span>
                         <span>Valid: {new Date(selectedNotam.start).toLocaleDateString()} - {new Date(selectedNotam.end).toLocaleDateString()}</span>
                     </div>
                 </div>
             )}
        </div>
    </div>
  );
};

export default Notams;