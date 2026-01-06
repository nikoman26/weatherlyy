import React, { useState, useEffect } from 'react';
import { useWeatherStore } from '../store/weatherStore.ts';
import { Plane, Plus, MapPin, Send, AlertTriangle, Wind, X, CloudRain } from 'lucide-react';
import InteractiveMap from '../components/InteractiveMap.tsx';
import { Pirep } from '../types.ts';

const Pireps = () => {
  const { pireps, fetchPireps, submitPirep, isLoading } = useWeatherStore();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
      icao_code: '',
      aircraft_type: '',
      flight_level: '',
      weather_conditions: 'Clear',
      turbulence: 'None',
      icing: 'None',
      remarks: ''
  });

  useEffect(() => {
    fetchPireps();
  }, [fetchPireps]);

  const handleMapClick = (lat: number, lng: number) => {
      setSelectedLocation({ lat, lng });
      setShowSubmitModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedLocation) return;

      await submitPirep({
          ...formData,
          aircraft_position: {
              latitude: selectedLocation.lat,
              longitude: selectedLocation.lng
          }
      });
      setShowSubmitModal(false);
      setFormData({
          icao_code: '',
          aircraft_type: '',
          flight_level: '',
          weather_conditions: 'Clear',
          turbulence: 'None',
          icing: 'None',
          remarks: ''
      });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-white flex items-center gap-2">
             <Plane className="text-sky-500" /> Pilot Reports (PIREPs)
           </h1>
           <p className="text-slate-400 text-sm mt-1">Real-time observed conditions from aircraft.</p>
        </div>
        <button 
            onClick={() => { setSelectedLocation({ lat: 40.7, lng: -74.0 }); setShowSubmitModal(true); }} // Default to NYC area if button clicked
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
            <Plus size={16} /> Submit Report
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
         {/* List View */}
         <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-800 font-bold text-white">Recent Reports</div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {pireps.length === 0 && <div className="text-slate-500 text-center py-4">No recent reports found.</div>}
                 {pireps.map((pirep) => (
                     <div key={pirep.id} className="bg-slate-950 border border-slate-800 p-4 rounded-lg hover:border-sky-500/50 transition-colors">
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <span className="font-bold text-sky-400">{pirep.aircraft_type}</span>
                                 <span className="text-slate-500 text-sm ml-2">FL{pirep.flight_level}</span>
                             </div>
                             <span className="text-xs text-slate-500">{new Date(pirep.submitted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 mb-2">
                             <div className="flex items-center gap-2"><Wind size={14} className="text-indigo-400" /> {pirep.turbulence}</div>
                             <div className="flex items-center gap-2"><CloudRain size={14} className="text-sky-400" /> {pirep.icing}</div>
                         </div>
                         <div className="text-xs text-slate-500 bg-slate-900 p-2 rounded border border-slate-800 mt-2">
                             {pirep.remarks || pirep.weather_conditions}
                         </div>
                     </div>
                 ))}
             </div>
         </div>

         {/* Map View */}
         <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative">
             <InteractiveMap 
                 enablePirepMarkers={true} 
                 onClick={handleMapClick}
                 className="h-full"
             />
             <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg z-[400] text-xs text-slate-300 shadow-xl pointer-events-none">
                 <p className="flex items-center gap-2"><MapPin size={14} className="text-sky-400" /> Click anywhere on map to submit a report.</p>
             </div>
         </div>
      </div>

      {/* Submission Modal */}
      {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Send size={18} className="text-sky-500" /> File Pilot Report
                      </h3>
                      <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Aircraft Type</label>
                              <input required type="text" placeholder="B737" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-sky-500 focus:outline-none" value={formData.aircraft_type} onChange={e => setFormData({...formData, aircraft_type: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Flight Level</label>
                              <input required type="text" placeholder="350" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-sky-500 focus:outline-none" value={formData.flight_level} onChange={e => setFormData({...formData, flight_level: e.target.value})} />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Turbulence</label>
                              <select className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-sky-500 focus:outline-none" value={formData.turbulence} onChange={e => setFormData({...formData, turbulence: e.target.value})}>
                                  <option>None</option>
                                  <option>Light</option>
                                  <option>Light-Moderate</option>
                                  <option>Moderate</option>
                                  <option>Severe</option>
                                  <option>Extreme</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Icing</label>
                              <select className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-sky-500 focus:outline-none" value={formData.icing} onChange={e => setFormData({...formData, icing: e.target.value})}>
                                  <option>None</option>
                                  <option>Trace</option>
                                  <option>Light</option>
                                  <option>Moderate</option>
                                  <option>Severe</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Remarks / Conditions</label>
                          <textarea rows={3} placeholder="Describe weather conditions..." className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-sky-500 focus:outline-none" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})}></textarea>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                          <button type="button" onClick={() => setShowSubmitModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                          <button type="submit" disabled={isLoading} className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                              {isLoading ? 'Sending...' : 'Transmit Report'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Pireps;