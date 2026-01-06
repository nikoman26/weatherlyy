import React, { useState } from 'react';
import { useWeatherStore } from '../store/weatherStore.ts';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

const AirportDataLoader: React.FC = () => {
    const { loadAirportData, isLoading } = useWeatherStore();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleLoad = async () => {
        setStatus('loading');
        setMessage('');
        try {
            await loadAirportData();
            setStatus('success');
            setMessage('Airport data successfully loaded/updated in Supabase!');
        } catch (e) {
            setStatus('error');
            setMessage('Failed to load airport data. Check server logs.');
        } finally {
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
                <UploadCloud size={24} />
                <h3 className="text-lg font-bold text-white">Airport Data Loader</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
                This action bulk-loads airport details (runways, frequencies, procedures) from <code>data/airports.json</code> into the Supabase database.
            </p>
            
            <button
                onClick={handleLoad}
                disabled={isLoading || status === 'loading'}
                className={`w-full px-6 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    status === 'success'
                        ? 'bg-emerald-600 text-white'
                        : status === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-700 disabled:cursor-not-allowed'
                }`}
            >
                {status === 'loading' && <><UploadCloud size={16} className="animate-spin" /> Loading Data...</>}
                {status === 'success' && <><CheckCircle size={16} /> Load Complete</>}
                {status === 'error' && <><AlertTriangle size={16} /> Load Failed</>}
                {status === 'idle' && <><UploadCloud size={16} /> Bulk Load Airports</>}
            </button>

            {message && (
                <div className={`mt-4 p-3 rounded text-sm ${status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default AirportDataLoader;