import React, { useState } from 'react';
import { MetarData, TafData } from '../types.ts';
import { useWeatherStore } from '../store/weatherStore.ts';
import { 
  Wind, Eye, Cloud, Gauge, ChevronDown, ChevronUp, 
  TrendingUp, TrendingDown, Minus, Info, X, Radio, Ruler, FileText, ArrowUp, ArrowDown
} from 'lucide-react';

interface MetarCardProps {
  data: MetarData;
  taf?: TafData;
}

const MetarCard: React.FC<MetarCardProps> = ({ data, taf }) => {
  const [showTaf, setShowTaf] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showRunways, setShowRunways] = useState(false);
  const { fetchAirportDetails, airportDetails } = useWeatherStore();

  const handleAirportClick = () => {
      fetchAirportDetails(data.station);
      setShowDetails(true);
  };

  const getFlightCategoryColor = (cat: string) => {
    switch (cat) {
      case 'VFR': return 'bg-green-500 text-green-950';
      case 'MVFR': return 'bg-blue-500 text-blue-950';
      case 'IFR': return 'bg-red-500 text-red-950';
      case 'LIFR': return 'bg-fuchsia-500 text-fuchsia-950';
      default: return 'bg-slate-500 text-slate-950';
    }
  };

  const renderTrend = (trend?: 'rising' | 'falling' | 'steady', colorClass = 'text-slate-400') => {
      if (trend === 'rising') return <TrendingUp size={14} className="text-red-400" />;
      if (trend === 'falling') return <TrendingDown size={14} className="text-blue-400" />;
      return <Minus size={14} className={colorClass} />;
  };

  const details = airportDetails[data.station];

  // Helper to calculate wind components
  const calculateWindComponents = (rwyHeading: number, windDir: number, windSpeed: number) => {
      let angleDiff = windDir - rwyHeading;
      while (angleDiff <= -180) angleDiff += 360;
      while (angleDiff > 180) angleDiff -= 360;
      const rads = (angleDiff * Math.PI) / 180;
      const headwind = Math.cos(rads) * windSpeed;
      const crosswind = Math.sin(rads) * windSpeed;
      return { 
          headwind: Math.round(headwind), 
          crosswind: Math.abs(Math.round(crosswind)),
          cwDir: crosswind > 0 ? 'Right' : 'Left'
      };
  };

  return (
    <>
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button 
                onClick={handleAirportClick}
                className="text-2xl font-bold text-white tracking-wider hover:text-sky-400 flex items-center gap-2 transition-colors border-b border-transparent hover:border-sky-400 border-dashed"
                title="View Airport Details"
            >
                {data.station} <Info size={16} className="text-slate-500" />
            </button>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getFlightCategoryColor(data.flight_category)}`}>
              {data.flight_category}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Observed: {new Date(data.observed).toUTCString()}</p>
        </div>
        <div className="text-right">
           <div className="flex items-center justify-end gap-2">
               {renderTrend(data.temp_trend)}
               <div className="text-3xl font-mono text-white font-light">{data.temperature.celsius}°C</div>
           </div>
           <div className="text-slate-500 text-sm">Dewpoint {data.dewpoint.celsius}°C</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2 text-sky-400 mb-1">
            <Wind size={16} />
            <span className="text-xs font-semibold uppercase">Wind</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-mono text-slate-200">
                {data.wind.direction_degrees}° / {data.wind.speed_kts}kt
            </div>
            {renderTrend(data.wind_trend)}
          </div>
          {data.wind.gust_kts && <div className="text-xs text-red-400">Gusts {data.wind.gust_kts}kt</div>}
        </div>

        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Eye size={16} />
            <span className="text-xs font-semibold uppercase">Visibility</span>
          </div>
          <div className="text-lg font-mono text-slate-200">{data.visibility.miles} SM</div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Cloud size={16} />
            <span className="text-xs font-semibold uppercase">Ceiling</span>
          </div>
          <div className="text-lg font-mono text-slate-200">
            {data.clouds.length > 0 ? `${data.clouds[0].cover} ${data.clouds[0].base || ''}` : 'CLR'}
          </div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Gauge size={16} />
            <span className="text-xs font-semibold uppercase">Altimeter</span>
          </div>
          <div className="text-lg font-mono text-slate-200">{data.altimeter.hg.toFixed(2)} inHg</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
         <div className="flex-1 min-w-[200px]">
             <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Raw METAR</p>
             <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-sky-100 break-all">
               {data.raw_text}
             </div>
         </div>
         <div className="flex gap-2">
            {details && (
                 <button 
                    onClick={() => setShowRunways(!showRunways)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${showRunways ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}
                 >
                     <Ruler size={16} /> Winds
                 </button>
            )}
             {taf && (
                 <button 
                    onClick={() => setShowTaf(!showTaf)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-sm font-medium rounded-lg transition-colors border border-slate-700"
                 >
                     {showTaf ? 'Hide TAF' : 'View TAF'} 
                     {showTaf ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                 </button>
             )}
         </div>
      </div>

      {/* Runway Analysis Section */}
      {showRunways && details && (
          <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
              <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Ruler size={16} /> Runway Wind Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {details.runways.flatMap(r => {
                      // Process both ends of the runway
                      const idents = r.ident.split('/');
                      return idents.map((id, idx) => {
                           // Approx heading from ident (e.g. 04 -> 40 deg)
                           const numeric = parseInt(id.replace(/[LRC]/g, '')) * 10; 
                           const comps = calculateWindComponents(numeric, data.wind.direction_degrees, data.wind.speed_kts);
                           return { id, ...comps };
                      });
                  }).sort((a, b) => b.headwind - a.headwind) // Sort by best headwind
                  .map((rw, i) => (
                      <div key={i} className={`p-3 rounded border flex justify-between items-center ${i === 0 && rw.headwind > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
                          <div>
                              <span className={`font-mono font-bold text-lg ${i === 0 && rw.headwind > 0 ? 'text-emerald-400' : 'text-white'}`}>{rw.id}</span>
                              {i === 0 && rw.headwind > 0 && <span className="ml-2 text-[10px] bg-emerald-500 text-slate-900 px-1.5 py-0.5 rounded font-bold uppercase">Best</span>}
                          </div>
                          <div className="text-right text-xs">
                              <div className={`${rw.headwind < 0 ? 'text-amber-500' : 'text-emerald-500'} font-bold`}>
                                  {rw.headwind < 0 ? 'Tail' : 'Head'}: {Math.abs(rw.headwind)}kt
                              </div>
                              <div className="text-slate-500">
                                  X-Wind: {rw.crosswind}kt {rw.crosswind > 0 ? (rw.cwDir === 'Left' ? 'L' : 'R') : ''}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* TAF Expansion */}
      {showTaf && taf && (
          <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
              <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <FileText size={16} /> Terminal Aerodrome Forecast
              </h4>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-indigo-200 mb-4 whitespace-pre-wrap">
                  {taf.raw_text}
              </div>
              <div className="space-y-3 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-800">
                  {taf.forecast.map((f, i) => (
                      <div key={i} className="relative pl-12">
                          {/* Timeline Dot */}
                          <div className={`absolute left-4 top-3 w-2.5 h-2.5 rounded-full border-2 border-slate-900 z-10 ${f.type === 'TEMPO' ? 'bg-amber-500' : 'bg-slate-500'}`}></div>
                          
                          <div className="bg-slate-800/30 border border-slate-800 rounded p-3 text-sm">
                             {/* Header: Time and Type */}
                             <div className="flex flex-wrap items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
                                 <span className="font-mono text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                                     {new Date(f.timestamp.from).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                     - 
                                     {new Date(f.timestamp.to).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                 </span>
                                 {f.type && (
                                     <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                        f.type === 'TEMPO' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                                     }`}>
                                        {f.type}
                                     </span>
                                 )}
                                 {f.probability && <span className="text-xs text-slate-500 italic">Prob {f.probability}%</span>}
                             </div>

                             {/* Details Grid */}
                             <div className="grid grid-cols-1 gap-2">
                                 {/* Wind & Vis Row */}
                                 <div className="flex flex-wrap items-center gap-4">
                                     {f.wind && (
                                         <div className="flex items-center gap-2 min-w-[120px]">
                                             <Wind size={14} className="text-sky-500" />
                                             <span className="text-slate-300 font-mono text-xs">
                                                 {f.wind.direction_degrees === 0 ? 'VRB' : f.wind.direction_degrees.toString().padStart(3, '0')} 
                                                 <span className="text-slate-500">/</span> {f.wind.speed_kts}kt
                                                 {f.wind.gust_kts ? <span className="text-red-400 ml-1">G{f.wind.gust_kts}</span> : ''}
                                             </span>
                                         </div>
                                     )}
                                     {f.visibility && (
                                         <div className="flex items-center gap-2">
                                             <Eye size={14} className="text-emerald-500" />
                                             <span className="text-slate-300 font-mono text-xs">
                                                 {f.visibility.miles === 'P6' ? 'P6' : f.visibility.miles} SM
                                             </span>
                                         </div>
                                     )}
                                 </div>

                                 {/* Clouds Row */}
                                 {f.clouds && f.clouds.length > 0 ? (
                                     <div className="flex items-start gap-2 mt-1">
                                         <Cloud size={14} className="text-indigo-400 mt-0.5" />
                                         <div className="flex flex-wrap gap-2">
                                             {f.clouds.map((c, idx) => (
                                                 <span key={idx} className="text-xs font-mono bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                                     {c.cover}
                                                     {c.base !== undefined ? (c.base / 100).toString().padStart(3, '0') : ''}
                                                 </span>
                                             ))}
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs pl-6">
                                        No Significant Clouds
                                     </div>
                                 )}
                             </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>

    {/* Airport Details Modal */}
    {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-800 flex justify-between items-start sticky top-0 bg-slate-900 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                            {data.station} 
                            {details && <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{details.elevation}ft MSL</span>}
                        </h2>
                        <p className="text-sky-400">{details?.name || 'Loading details...'}</p>
                    </div>
                    <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {details ? (
                        <>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-4">
                                   <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                       <Ruler size={16} /> Runways
                                   </h3>
                                   <div className="space-y-2">
                                       {details.runways.map((rwy, i) => (
                                           <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                                               <span className="font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded">{rwy.ident}</span>
                                               <div className="text-right">
                                                   <div className="text-sm text-slate-300">{rwy.length_ft}' x {rwy.width_ft}'</div>
                                                   <div className="text-xs text-slate-500">{rwy.surface}</div>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               </div>

                               <div className="space-y-4">
                                   <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                       <Radio size={16} /> Frequencies
                                   </h3>
                                   <div className="grid grid-cols-1 gap-2">
                                       {details.frequencies.map((freq, i) => (
                                           <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                                               <span className="text-sm text-slate-400">{freq.type}</span>
                                               <span className="font-mono text-emerald-400 font-bold">{freq.frequency}</span>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           </div>

                           <div>
                               <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-3">
                                   <FileText size={16} /> Procedures (Approach)
                               </h3>
                               <div className="flex flex-wrap gap-2">
                                   {details.procedures.map((proc, i) => (
                                       <span key={i} className="text-xs bg-slate-800 text-sky-200 px-2 py-1 rounded border border-slate-700">
                                           {proc}
                                       </span>
                                   ))}
                               </div>
                           </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                             Airport details not available for {data.station}.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default MetarCard;