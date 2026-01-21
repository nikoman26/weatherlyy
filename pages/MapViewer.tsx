import React, { useEffect } from 'react';
import InteractiveMap from '../components/InteractiveMap.tsx';
import { Map as MapIcon } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore.ts';

const MapViewer = () => {
  // Removed fetchAllAirports call. The map component will now handle fetching based on bounds.

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-white flex items-center gap-2">
             <MapIcon className="text-sky-500" /> Interactive Map
           </h1>
           <p className="text-slate-400 text-sm mt-1">Real-time weather radar, clouds, and aviation charts.</p>
        </div>
        <div className="flex gap-2">
           <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-500">Source: OpenWeatherMap</span>
           <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-500">Source: OpenAIP</span>
        </div>
      </div>
      
      <div className="flex-1 bg-slate-950 rounded-xl overflow-hidden">
        <InteractiveMap />
      </div>
    </div>
  );
};

export default MapViewer;