import React, { useState, useEffect } from 'react';
import { useWeatherStore } from '../store/weatherStore.ts';
import { KeyRound, Save, CheckCircle } from 'lucide-react';

const ApiKeyManager = () => {
    const { apiKeys: storeApiKeys, updateApiKeys, isLoading } = useWeatherStore();
    // Provide a safe default value for keys if storeApiKeys is undefined/null
    const apiKeys = storeApiKeys || {}; 
    const [keys, setKeys] = useState(apiKeys);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        setKeys(apiKeys);
    }, [apiKeys]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeys({ ...keys, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveState('saving');
        await updateApiKeys(keys);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
    };

    const keyFields = [
        { name: 'checkwx', label: 'CheckWX API Key' },
        { name: 'icao', label: 'ICAO API Key' },
        { name: 'openweather', label: 'OpenWeather API Key' },
        { name: 'windy', label: 'Windy API Key' },
        { name: 'avwx', label: 'AVWX API Key' },
        { name: 'openaip', label: 'OpenAIP API Key' },
    ];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
            <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <KeyRound className="text-amber-400" /> API Key Management
                </h3>
                <p className="text-xs text-slate-500 mt-1">Manage third-party API keys for weather data services.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {keyFields.map(field => (
                    <div key={field.name}>
                        <label htmlFor={field.name} className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                            {field.label}
                        </label>
                        <input
                            type="text"
                            id={field.name}
                            name={field.name}
                            // Safely access the key value
                            value={keys[field.name as keyof typeof keys] || ''}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono text-sm focus:border-sky-500 focus:outline-none"
                        />
                    </div>
                ))}
                <div className="pt-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading || saveState !== 'idle'}
                        className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                            saveState === 'saved'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-sky-600 hover:bg-sky-500 text-white disabled:bg-slate-700 disabled:cursor-not-allowed'
                        }`}
                    >
                        {saveState === 'saving' && <><Save size={16} className="animate-spin" /> Saving...</>}
                        {saveState === 'saved' && <><CheckCircle size={16} /> Saved!</>}
                        {saveState === 'idle' && <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ApiKeyManager;