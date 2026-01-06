import React, { useState, useEffect } from 'react';
import { 
  Calculator, Wind, Thermometer, RotateCw, ArrowUp, AlertCircle, Info, 
  Gauge, Plane, Scale, Users, Fuel, Briefcase, ArrowRightLeft, Repeat, ArrowDownRight
} from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, ReferenceArea, ReferenceDot, Label
} from 'recharts';

const Tools = () => {
  const [activeTab, setActiveTab] = useState<'performance' | 'wb' | 'converters' | 'holding' | 'descent'>('performance');

  // --- Crosswind Calculator State ---
  const [windDir, setWindDir] = useState<string>('270');
  const [windSpeed, setWindSpeed] = useState<string>('15');
  const [rwyHeading, setRwyHeading] = useState<string>('240');
  
  const [headwind, setHeadwind] = useState(0);
  const [crosswind, setCrosswind] = useState(0);
  const [crosswindDir, setCrosswindDir] = useState<'Left' | 'Right' | 'None'>('None');

  // --- Density Altitude State ---
  const [elevation, setElevation] = useState<string>('1000'); // ft
  const [temperature, setTemperature] = useState<string>('25'); // Celsius
  const [altimeter, setAltimeter] = useState<string>('29.92'); // inHg
  
  const [pressureAlt, setPressureAlt] = useState(0);
  const [densityAlt, setDensityAlt] = useState(0);

  // --- Weight & Balance State (C172S) ---
  const [wbInputs, setWbInputs] = useState({
    pilot: 170,
    frontPax: 0,
    rearPax: 0,
    baggage1: 0,
    baggage2: 0,
    fuelGallons: 53
  });
  const [wbResults, setWbResults] = useState({
      totalWeight: 0,
      totalMoment: 0,
      cg: 0,
      status: 'Within Limits'
  });

  // --- Converter State ---
  const [convertType, setConvertType] = useState('dist');
  const [convertVal, setConvertVal] = useState('');
  const [convertResult, setConvertResult] = useState('');

  // --- Holding Pattern State ---
  const [holdInbound, setHoldInbound] = useState('360');
  const [acHeading, setAcHeading] = useState('180');
  const [turnDir, setTurnDir] = useState<'Right' | 'Left'>('Right');
  const [entryType, setEntryType] = useState('Direct');
  const [entryColor, setEntryColor] = useState('text-emerald-500');

  // --- Descent Calculator State ---
  const [descentCurrentAlt, setDescentCurrentAlt] = useState('35000');
  const [descentTargetAlt, setDescentTargetAlt] = useState('3000');
  const [descentSpeed, setDescentSpeed] = useState('450'); // Ground speed
  const [todResults, setTodResults] = useState({ distance: 0, rod: 0, time: 0 });

  // Calculate Crosswind
  useEffect(() => {
    const wd = parseFloat(windDir) || 0;
    const ws = parseFloat(windSpeed) || 0;
    const rh = parseFloat(rwyHeading) || 0;

    let angleDiff = wd - rh;
    while (angleDiff <= -180) angleDiff += 360;
    while (angleDiff > 180) angleDiff -= 360;
    const rads = (angleDiff * Math.PI) / 180;
    const hw = Math.cos(rads) * ws;
    const cw = Math.sin(rads) * ws;

    setHeadwind(Math.round(hw));
    setCrosswind(Math.abs(Math.round(cw)));
    if (Math.abs(cw) < 1) setCrosswindDir('None');
    else if (cw > 0) setCrosswindDir('Right');
    else setCrosswindDir('Left');
  }, [windDir, windSpeed, rwyHeading]);

  // Calculate Density Altitude
  useEffect(() => {
    const elev = parseFloat(elevation) || 0;
    const temp = parseFloat(temperature) || 15;
    const alt = parseFloat(altimeter) || 29.92;
    const pa = elev + (29.92 - alt) * 1000;
    const standardTemp = 15 - (2 * (elev / 1000));
    const da = pa + (120 * (temp - standardTemp));
    setPressureAlt(Math.round(pa));
    setDensityAlt(Math.round(da));
  }, [elevation, temperature, altimeter]);

  // Calculate Weight & Balance
  useEffect(() => {
      // C172S Data
      const BEW = 1663;
      const BEW_MOMENT = 66089; // approx
      
      const ARM_FRONT = 37;
      const ARM_REAR = 73;
      const ARM_BAG1 = 95;
      const ARM_BAG2 = 123;
      const ARM_FUEL = 48;
      const FUEL_WEIGHT = 6; // lbs/gal

      const pilotM = wbInputs.pilot * ARM_FRONT;
      const frontM = wbInputs.frontPax * ARM_FRONT;
      const rearM = wbInputs.rearPax * ARM_REAR;
      const bag1M = wbInputs.baggage1 * ARM_BAG1;
      const bag2M = wbInputs.baggage2 * ARM_BAG2;
      const fuelW = wbInputs.fuelGallons * FUEL_WEIGHT;
      const fuelM = fuelW * ARM_FUEL;

      const totW = BEW + wbInputs.pilot + wbInputs.frontPax + wbInputs.rearPax + wbInputs.baggage1 + wbInputs.baggage2 + fuelW;
      const totM = BEW_MOMENT + pilotM + frontM + rearM + bag1M + bag2M + fuelM;
      const cg = totW > 0 ? totM / totW : 0;

      let status = 'Within Limits';
      let fwdLimit = 35.0;
      if (totW > 1950) {
          fwdLimit = 35.0 + 0.01 * (totW - 1950);
      }

      if (totW > 2550) status = 'Over Max Gross Weight';
      else if (cg > 47.3) status = 'Aft CG Limit Exceeded';
      else if (cg < fwdLimit) status = 'Forward CG Limit Exceeded';

      setWbResults({
          totalWeight: Math.round(totW),
          totalMoment: Math.round(totM),
          cg: parseFloat(cg.toFixed(1)),
          status
      });

  }, [wbInputs]);

  // Converter Logic
  useEffect(() => {
      const v = parseFloat(convertVal);
      if (isNaN(v)) {
          setConvertResult('');
          return;
      }
      let res = '';
      if (convertType === 'dist') res = `${(v * 1.852).toFixed(2)} km / ${(v * 1.15078).toFixed(2)} sm`;
      if (convertType === 'speed') res = `${(v * 1.15078).toFixed(1)} mph / ${(v * 1.852).toFixed(1)} km/h`;
      if (convertType === 'temp_c') res = `${((v * 9/5) + 32).toFixed(1)} °F`;
      if (convertType === 'temp_f') res = `${((v - 32) * 5/9).toFixed(1)} °C`;
      if (convertType === 'press') res = `${(v * 33.8639).toFixed(1)} hPa`;
      if (convertType === 'weight') res = `${(v * 0.453592).toFixed(1)} kg`;

      setConvertResult(res);
  }, [convertVal, convertType]);

  // Holding Pattern Logic
  useEffect(() => {
    let inbound = parseFloat(holdInbound) || 0;
    let hdg = parseFloat(acHeading) || 0;
    
    // Normalize to 0-360
    inbound = inbound % 360;
    hdg = hdg % 360;
    
    // Simplified Logic for Display
    let relativeToRecip = (hdg - ((inbound + 180) % 360) + 360) % 360;
    if (relativeToRecip > 180) relativeToRecip -= 360; 

    if (turnDir === 'Right') {
        if (relativeToRecip > 0 && relativeToRecip < 70) {
            setEntryType('Teardrop');
            setEntryColor('text-amber-500');
        } else if (relativeToRecip <= 0 && relativeToRecip > -110) {
            setEntryType('Parallel');
            setEntryColor('text-sky-500');
        } else {
            setEntryType('Direct');
            setEntryColor('text-emerald-500');
        }
    } else {
        if (relativeToRecip < 0 && relativeToRecip > -70) {
             setEntryType('Teardrop');
             setEntryColor('text-amber-500');
        } else if (relativeToRecip >= 0 && relativeToRecip < 110) {
             setEntryType('Parallel');
             setEntryColor('text-sky-500');
        } else {
             setEntryType('Direct');
             setEntryColor('text-emerald-500');
        }
    }

  }, [holdInbound, acHeading, turnDir]);

  // Descent Calculator
  useEffect(() => {
      const current = parseFloat(descentCurrentAlt) || 0;
      const target = parseFloat(descentTargetAlt) || 0;
      const gs = parseFloat(descentSpeed) || 0;

      if (current <= target) {
          setTodResults({ distance: 0, rod: 0, time: 0 });
          return;
      }

      // 3:1 Rule
      const altDiff = current - target;
      const distance = (altDiff / 1000) * 3;
      const rod = gs * 5; // fpm
      const time = distance / (gs / 60);

      setTodResults({
          distance: Math.round(distance),
          rod: Math.round(rod),
          time: Math.round(time)
      });

  }, [descentCurrentAlt, descentTargetAlt, descentSpeed]);

  const windArrowRotation = (parseFloat(windDir) - parseFloat(rwyHeading));
  const envelopeData = [
      { cg: 35.0, weight: 1950 }, { cg: 35.0, weight: 1600 }, { cg: 47.3, weight: 1600 },
      { cg: 47.3, weight: 2550 }, { cg: 41.0, weight: 2550 }, { cg: 35.0, weight: 1950 }
  ];
  const currentPoint = [{ cg: wbResults.cg, weight: wbResults.totalWeight }];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
             <h1 className="text-2xl font-bold text-white flex items-center gap-2">
               <Calculator className="text-sky-500" /> Flight Tools
             </h1>
             <p className="text-slate-400 text-sm mt-1">Performance calculators and conversion utilities.</p>
         </div>
         
         {/* Scrollable container for tabs on mobile */}
         <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-max">
                 {[
                     { id: 'performance', label: 'Performance' },
                     { id: 'wb', label: 'W & B' },
                     { id: 'holding', label: 'Holding' },
                     { id: 'descent', label: 'Descent' },
                     { id: 'converters', label: 'Converters' }
                 ].map(tab => (
                     <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                     >
                         {tab.label}
                     </button>
                 ))}
             </div>
         </div>
      </div>

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Crosswind */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6 text-sky-400">
                <RotateCw size={24} />
                <h2 className="text-xl font-bold text-white">Crosswind Calculator</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Runway Heading (°)</label>
                        <input type="number" value={rwyHeading} onChange={(e) => setRwyHeading(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Wind Direction (°)</label>
                        <input type="number" value={windDir} onChange={(e) => setWindDir(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Wind Speed (kts)</label>
                        <input type="number" value={windSpeed} onChange={(e) => setWindSpeed(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none" />
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-950 rounded-xl border border-slate-800 p-6 relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-10 space-y-1">
                        <div className={`text-sm font-bold ${headwind < 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{headwind < 0 ? 'Tailwind' : 'Headwind'}: {Math.abs(headwind)} kts</div>
                        <div className="text-sm font-bold text-sky-400">Crosswind: {crosswind} kts {crosswindDir !== 'None' ? `(${crosswindDir})` : ''}</div>
                    </div>
                    <div className="relative w-40 h-40 flex items-center justify-center mt-6">
                        <div className="absolute w-12 h-40 bg-slate-700 rounded-sm flex items-end justify-center pb-2"><span className="text-slate-400 font-bold text-xs font-mono">{rwyHeading.padStart(3, '0')}</span><div className="absolute h-full w-0.5 border-l-2 border-dashed border-slate-500"></div></div>
                        <div className="absolute w-1 h-32 origin-center flex flex-col items-center justify-start transition-transform duration-500" style={{ transform: `rotate(${windArrowRotation}deg)` }}><ArrowUp size={32} className="text-sky-500 fill-current -mt-4" /><div className="w-0.5 h-full bg-sky-500/50"></div></div>
                        <Plane size={24} className="text-white z-10" />
                    </div>
                </div>
            </div>
            </div>

            {/* Density Altitude */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6 text-amber-500">
                <Thermometer size={24} />
                <h2 className="text-xl font-bold text-white">Density Altitude</h2>
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Elevation (ft)</label><input type="number" value={elevation} onChange={(e) => setElevation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Temp (°C)</label><input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none" /></div>
                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Altimeter (inHg)</label><input type="number" step="0.01" value={altimeter} onChange={(e) => setAltimeter(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none" /></div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="grid grid-cols-2 gap-8 w-full">
                            <div><div className="text-slate-500 text-xs uppercase mb-1">Pressure Altitude</div><div className="text-2xl font-mono font-bold text-slate-300">{pressureAlt.toLocaleString()} <span className="text-sm text-slate-500">ft</span></div></div>
                            <div><div className="text-slate-500 text-xs uppercase mb-1">Density Altitude</div><div className={`text-3xl font-mono font-bold ${densityAlt > parseFloat(elevation) + 1000 ? 'text-amber-500' : 'text-emerald-500'}`}>{densityAlt.toLocaleString()} <span className="text-sm text-slate-500">ft</span></div></div>
                        </div>
                        {densityAlt > parseFloat(elevation) + 2000 && (<div className="mt-4 flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-2 rounded text-sm"><AlertCircle size={16} /><span>High Density Altitude! Engine performance reduced.</span></div>)}
                </div>
                <div className="text-xs text-slate-500 flex items-start gap-2"><Info size={14} className="mt-0.5 shrink-0" /><p>Calculations use standard ISA lapse rates.</p></div>
            </div>
            </div>
        </div>
      )}

      {activeTab === 'wb' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* W&B Inputs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6 text-emerald-500">
                    <Scale size={24} />
                    <h2 className="text-xl font-bold text-white">Weight & Balance <span className="text-sm font-normal text-slate-500 ml-2">(Cessna 172S)</span></h2>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Users size={12}/> Pilot & Front Pax</label>
                            <input type="number" value={wbInputs.pilot + wbInputs.frontPax} onChange={(e) => { const val = parseInt(e.target.value) || 0; setWbInputs({...wbInputs, pilot: val, frontPax: 0}) }} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Users size={12}/> Rear Pax</label>
                            <input type="number" value={wbInputs.rearPax} onChange={(e) => setWbInputs({...wbInputs, rearPax: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Briefcase size={12}/> Baggage 1</label>
                            <input type="number" value={wbInputs.baggage1} onChange={(e) => setWbInputs({...wbInputs, baggage1: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Fuel size={12}/> Fuel (Gallons)</label>
                            <input type="number" value={wbInputs.fuelGallons} onChange={(e) => setWbInputs({...wbInputs, fuelGallons: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none" />
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <div className={`p-4 rounded-lg text-center border mb-4 ${wbResults.status === 'Within Limits' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            <span className="font-bold text-lg">{wbResults.status}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase">Gross Wt</div>
                                <div className="font-mono text-xl text-white">{wbResults.totalWeight}</div>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase">Total Moment</div>
                                <div className="font-mono text-xl text-white">{wbResults.totalMoment}</div>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase">C.G.</div>
                                <div className="font-mono text-xl text-sky-400">{wbResults.cg}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* W&B Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
                <h3 className="text-lg font-bold text-slate-300 mb-4">C.G. Envelope</h3>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis 
                                type="number" 
                                dataKey="cg" 
                                name="CG" 
                                unit=" in" 
                                domain={[32, 50]} 
                                stroke="#94a3b8"
                                label={{ value: 'Center of Gravity (inches)', position: 'bottom', fill: '#94a3b8', fontSize: 12 }}
                            />
                            <YAxis 
                                type="number" 
                                dataKey="weight" 
                                name="Weight" 
                                unit=" lbs" 
                                domain={[1500, 2700]} 
                                stroke="#94a3b8"
                                label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                            
                            {/* Envelope Boundary using Scatter line */}
                            <Scatter name="Envelope" data={envelopeData} fill="none" line={{ stroke: '#3b82f6', strokeWidth: 2 }} shape={() => null} />
                            
                            {/* Current Point */}
                            <Scatter name="Current" data={currentPoint} fill={wbResults.status === 'Within Limits' ? '#10b981' : '#ef4444'}>
                                <Label value="YOU" position="top" offset={10} fill="#fff" fontSize={10} />
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'holding' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6 text-emerald-500">
                    <Repeat size={24} />
                    <h2 className="text-xl font-bold text-white">Holding Entry Calculator</h2>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Inbound Course (°)</label>
                        <input type="number" value={holdInbound} onChange={(e) => setHoldInbound(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none" />
                        <p className="text-xs text-slate-500 mt-1">The radial/course flying TOWARDS the fix</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Aircraft Heading (°)</label>
                        <input type="number" value={acHeading} onChange={(e) => setAcHeading(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Turn Direction</label>
                        <div className="flex gap-2">
                             <button onClick={() => setTurnDir('Right')} className={`flex-1 py-2 rounded border ${turnDir === 'Right' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Right (Std)</button>
                             <button onClick={() => setTurnDir('Left')} className={`flex-1 py-2 rounded border ${turnDir === 'Left' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Left</button>
                        </div>
                    </div>
                    
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
                        <div className="text-sm text-slate-400 uppercase tracking-widest mb-2">Recommended Entry</div>
                        <div className={`text-4xl font-bold ${entryColor}`}>{entryType}</div>
                    </div>
                </div>
             </div>
             
             {/* Visualizer */}
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                 {/* This is a simplified static visualization conceptualization */}
                 <div className="relative w-64 h-64">
                      {/* Fix */}
                      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 z-20 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                      
                      {/* Holding Pattern Track (Schematic) */}
                      <div className={`absolute top-1/2 left-1/2 w-32 h-64 border-2 border-dashed border-slate-600 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30 ${turnDir === 'Left' ? '-scale-x-100' : ''}`}></div>
                      
                      {/* Aircraft Heading Vector */}
                      <div 
                        className="absolute top-1/2 left-1/2 w-1 h-32 bg-gradient-to-t from-emerald-500 to-transparent origin-bottom z-10 -translate-x-1/2 -translate-y-full"
                        style={{ transform: `translate(-50%, 0) rotate(${parseFloat(acHeading) - parseFloat(holdInbound)}deg)` }}
                      >
                           <Plane size={24} className="absolute -top-3 left-1/2 -translate-x-1/2 text-emerald-400 fill-emerald-950" />
                      </div>
                      
                      {/* Labels */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-mono">FIX</div>
                 </div>
                 <p className="text-center text-xs text-slate-500 mt-4 max-w-xs">
                     Visualization shows aircraft relative to inbound course (North Up relative to Hold).
                 </p>
             </div>
          </div>
      )}

      {activeTab === 'descent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6 text-sky-400">
                    <ArrowDownRight size={24} />
                    <h2 className="text-xl font-bold text-white">Descent Calculator (3:1)</h2>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Current Altitude (ft)</label>
                        <input type="number" value={descentCurrentAlt} onChange={(e) => setDescentCurrentAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Altitude (ft)</label>
                        <input type="number" value={descentTargetAlt} onChange={(e) => setDescentTargetAlt(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ground Speed (kts)</label>
                        <input type="number" value={descentSpeed} onChange={(e) => setDescentSpeed(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none" />
                    </div>
                </div>
             </div>

             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-center">
                 <div className="space-y-6">
                     <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                         <div className="text-xs text-slate-500 uppercase mb-1">Distance to Begin Descent (TOD)</div>
                         <div className="text-3xl font-bold text-white font-mono">{todResults.distance} <span className="text-lg text-slate-500">NM</span></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                             <div className="text-xs text-slate-500 uppercase mb-1">Required Rate</div>
                             <div className="text-2xl font-bold text-sky-400 font-mono">{todResults.rod} <span className="text-sm text-slate-500">fpm</span></div>
                         </div>
                         <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                             <div className="text-xs text-slate-500 uppercase mb-1">Time to Target</div>
                             <div className="text-2xl font-bold text-sky-400 font-mono">{todResults.time} <span className="text-sm text-slate-500">min</span></div>
                         </div>
                     </div>
                     <div className="text-xs text-slate-500 text-center">
                         Based on standard 3° glideslope (3nm per 1000ft).
                     </div>
                 </div>
             </div>
          </div>
      )}

      {activeTab === 'converters' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-2 mb-6 text-indigo-400">
                 <ArrowRightLeft size={24} />
                 <h2 className="text-xl font-bold text-white">Unit Converters</h2>
             </div>

             <div className="space-y-6">
                 <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Conversion Type</label>
                     <div className="flex flex-wrap gap-2">
                         {['dist', 'speed', 'temp_c', 'temp_f', 'press', 'weight'].map(type => (
                             <button
                                key={type}
                                onClick={() => { setConvertType(type); setConvertResult(''); setConvertVal(''); }}
                                className={`px-3 py-1.5 rounded text-sm transition-colors ${convertType === type ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                             >
                                 {type === 'dist' ? 'NM → KM/SM' : 
                                  type === 'speed' ? 'KTS → MPH/KPH' : 
                                  type === 'temp_c' ? '°C → °F' : 
                                  type === 'temp_f' ? '°F → °C' : 
                                  type === 'press' ? 'inHg → hPa' : 'LBS → KG'}
                             </button>
                         ))}
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                     <div>
                         <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Input Value</label>
                         <input 
                            type="number" 
                            value={convertVal} 
                            onChange={(e) => setConvertVal(e.target.value)}
                            placeholder="Enter value..."
                            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-white font-mono text-lg focus:border-indigo-500 focus:outline-none"
                         />
                     </div>
                     
                     <div className="bg-slate-950 border border-slate-800 rounded p-4 flex flex-col justify-center h-full">
                         <div className="text-xs text-slate-500 uppercase mb-1">Result</div>
                         <div className="text-xl font-mono text-indigo-400 font-bold min-h-[1.75rem]">
                             {convertResult || '---'}
                         </div>
                     </div>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Tools;