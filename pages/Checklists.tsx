import React, { useState } from 'react';
import { MOCK_CHECKLISTS } from '../services/mockData.ts';
import { Checklist, ChecklistItem } from '../types.ts';
import { ClipboardList, CheckSquare, RotateCcw, AlertTriangle, ChevronRight, Plane } from 'lucide-react';

const Checklists = () => {
  const [selectedAircraftId, setSelectedAircraftId] = useState(MOCK_CHECKLISTS[0].aircraftId);
  const [selectedChecklistId, setSelectedChecklistId] = useState(MOCK_CHECKLISTS[0].checklists[0].id);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const selectedAircraft = MOCK_CHECKLISTS.find(a => a.aircraftId === selectedAircraftId);
  const activeChecklist = selectedAircraft?.checklists.find(c => c.id === selectedChecklistId);

  // Filter checklists by category
  const normalChecklists = selectedAircraft?.checklists.filter(c => c.category === 'Normal') || [];
  const emergencyChecklists = selectedAircraft?.checklists.filter(c => c.category === 'Emergency') || [];

  const toggleItem = (itemId: string) => {
    setChecklistState(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const resetChecklist = () => {
    if (!activeChecklist) return;
    const newState = { ...checklistState };
    activeChecklist.items.forEach(item => {
      delete newState[item.id];
    });
    setChecklistState(newState);
  };

  const calculateProgress = () => {
    if (!activeChecklist) return 0;
    const checkedCount = activeChecklist.items.filter(item => checklistState[item.id]).length;
    return Math.round((checkedCount / activeChecklist.items.length) * 100);
  };

  const isComplete = calculateProgress() === 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-end gap-4">
           <div>
               <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                 <ClipboardList className="text-sky-500" /> Digital Checklists
               </h1>
               <p className="text-slate-400 text-sm mt-1">Interactive procedures for flight phases and emergencies.</p>
           </div>
           
           <div className="w-full md:w-auto">
               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Aircraft</label>
               <div className="relative">
                   <select 
                      value={selectedAircraftId}
                      onChange={(e) => {
                          setSelectedAircraftId(e.target.value);
                          const newAircraft = MOCK_CHECKLISTS.find(a => a.aircraftId === e.target.value);
                          if (newAircraft) setSelectedChecklistId(newAircraft.checklists[0].id);
                          setChecklistState({});
                      }}
                      className="w-full md:w-64 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white appearance-none focus:outline-none focus:border-sky-500"
                   >
                       {MOCK_CHECKLISTS.map(ac => (
                           <option key={ac.aircraftId} value={ac.aircraftId}>{ac.name}</option>
                       ))}
                   </select>
                   <Plane className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" size={16} />
               </div>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-14rem)]">
           {/* Sidebar: Checklist Menu */}
           <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
               <div className="p-4 bg-slate-950 border-b border-slate-800">
                   <h3 className="font-bold text-slate-300">Procedures</h3>
               </div>
               <div className="flex-1 overflow-y-auto p-2 space-y-6 custom-scrollbar">
                   {/* Normal Procedures */}
                   <div>
                       <div className="px-3 mb-2 text-xs font-bold text-sky-500 uppercase tracking-wider flex items-center gap-2">
                           <CheckSquare size={12} /> Normal
                       </div>
                       <div className="space-y-1">
                           {normalChecklists.map(cl => (
                               <button
                                   key={cl.id}
                                   onClick={() => setSelectedChecklistId(cl.id)}
                                   className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${selectedChecklistId === cl.id ? 'bg-sky-600/20 text-sky-400 border border-sky-600/30' : 'text-slate-400 hover:bg-slate-800'}`}
                               >
                                   <span className="text-sm font-medium">{cl.title}</span>
                                   {selectedChecklistId === cl.id && <ChevronRight size={14} />}
                               </button>
                           ))}
                       </div>
                   </div>

                   {/* Emergency Procedures */}
                   <div>
                       <div className="px-3 mb-2 text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                           <AlertTriangle size={12} /> Emergency
                       </div>
                       <div className="space-y-1">
                           {emergencyChecklists.map(cl => (
                               <button
                                   key={cl.id}
                                   onClick={() => setSelectedChecklistId(cl.id)}
                                   className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${selectedChecklistId === cl.id ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' : 'text-slate-400 hover:bg-slate-800'}`}
                               >
                                   <span className="text-sm font-medium">{cl.title}</span>
                                   {selectedChecklistId === cl.id && <ChevronRight size={14} />}
                               </button>
                           ))}
                       </div>
                   </div>
               </div>
           </div>

           {/* Main Content: Active Checklist */}
           <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col relative overflow-hidden">
               {activeChecklist ? (
                   <>
                       {/* Checklist Header */}
                       <div className={`p-6 border-b border-slate-800 ${activeChecklist.category === 'Emergency' ? 'bg-amber-950/20' : 'bg-slate-950'}`}>
                           <div className="flex justify-between items-start mb-4">
                               <div>
                                   <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${activeChecklist.category === 'Emergency' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}>
                                       {activeChecklist.category} Checklist
                                   </span>
                                   <h2 className="text-2xl font-bold text-white mt-2">{activeChecklist.title}</h2>
                               </div>
                               <button 
                                   onClick={resetChecklist}
                                   className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded transition-colors"
                                   title="Reset Checklist"
                               >
                                   <RotateCcw size={20} />
                               </button>
                           </div>

                           {/* Progress Bar */}
                           <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                               <div 
                                   className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-sky-500'}`} 
                                   style={{ width: `${calculateProgress()}%` }}
                               ></div>
                           </div>
                       </div>

                       {/* Checklist Items */}
                       <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                           {activeChecklist.items.map((item) => {
                               const isChecked = checklistState[item.id] || false;
                               return (
                                   <div 
                                      key={item.id}
                                      onClick={() => toggleItem(item.id)}
                                      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer border transition-all ${isChecked ? 'bg-slate-950/50 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700 hover:border-sky-500/50'}`}
                                   >
                                       <div className="flex items-center gap-4">
                                           <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-slate-500 bg-transparent'}`}>
                                               {isChecked && <CheckSquare size={16} className="fill-current" />}
                                           </div>
                                           <span className={`font-medium ${isChecked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                               {item.challenge}
                                           </span>
                                       </div>
                                       <span className={`font-mono font-bold ${isChecked ? 'text-slate-600' : 'text-sky-400'}`}>
                                           {item.response}
                                       </span>
                                   </div>
                               );
                           })}
                           
                           {isComplete && (
                               <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center animate-in fade-in slide-in-from-bottom-4">
                                   <h4 className="text-emerald-400 font-bold text-lg flex items-center justify-center gap-2">
                                       <CheckSquare /> Checklist Complete
                                   </h4>
                               </div>
                           )}
                       </div>
                   </>
               ) : (
                   <div className="flex items-center justify-center h-full text-slate-500">
                       Select a checklist to begin.
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default Checklists;