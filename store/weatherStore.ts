import { create } from 'zustand';
import { MetarData, TafData, Notam, Pirep, AirportDetails } from '../types.ts';
import { MOCK_METARS, MOCK_TAFS, MOCK_NOTAMS, MOCK_PIREPS } from '../services/mockData.ts';
import { weatherAPI } from '../services/weatherApi.ts';
import { supabase } from '../src/integrations/supabase/client';

interface FlightPlanData {
  departure: { icao: string; metar: MetarData | null; taf: TafData | null; notams: Notam[]; };
  destination: { icao: string; metar: MetarData | null; taf: TafData | null; notams: Notam[]; };
}

interface WeatherStore {
  user: any | null;
  activeAirport: string | null;
  weatherData: Record<string, { metar: MetarData | null; taf: TafData | null }>;
  notams: Record<string, Notam[]>;
  pireps: Pirep[];
  airportDetails: Record<string, AirportDetails>;
  activeFlightPlan: FlightPlanData | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  setActiveAirport: (icao: string) => void;
  fetchWeather: (icao: string) => Promise<void>;
  fetchNotams: (icao: string) => Promise<void>;
  fetchPireps: () => Promise<void>;
  submitPirep: (pirep: any) => Promise<void>;
  fetchAirportDetails: (icao: string) => Promise<void>;
  fetchAllAirports: () => Promise<void>;
  generateFlightPlan: (dep: string, dest: string) => Promise<void>;
}

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  user: null,
  activeAirport: null,
  weatherData: {},
  notams: {},
  pireps: [],
  airportDetails: {},
  activeFlightPlan: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      set({ user: { ...session.user, ...profile } });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  setActiveAirport: (icao) => set({ activeAirport: icao }),

  fetchWeather: async (icao) => {
    set({ isLoading: true });
    try {
      const [metar, taf] = await Promise.all([weatherAPI.getMETAR(icao), weatherAPI.getTAF(icao)]);
      set(state => ({ weatherData: { ...state.weatherData, [icao]: { metar, taf } }, isLoading: false }));
    } catch (error) {
      set(state => ({ weatherData: { ...state.weatherData, [icao]: { metar: MOCK_METARS[icao] || null, taf: MOCK_TAFS[icao] || null } }, isLoading: false }));
    }
  },

  fetchNotams: async (icao) => {
    try {
      const notams = await weatherAPI.getNOTAMs(icao);
      set(state => ({ notams: { ...state.notams, [icao]: notams } }));
    } catch (error) {
      set(state => ({ notams: { ...state.notams, [icao]: MOCK_NOTAMS[icao] || [] } }));
    }
  },

  fetchPireps: async () => {
    try {
      const { data, error } = await supabase.from('pireps').select('*, profiles(username)').order('created_at', { ascending: false });
      if (error) throw error;
      set({ pireps: data });
    } catch (error) {
      set({ pireps: MOCK_PIREPS });
    }
  },

  submitPirep: async (pirepData) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from('pireps').insert([{
        ...pirepData,
        submitted_by: user.id
      }]).select().single();

      if (error) throw error;
      set(state => ({ pireps: [data, ...state.pireps], isLoading: false }));
    } catch (error) {
      set({ isLoading: false });
    }
  },

  fetchAirportDetails: async (icao) => {
    try {
      const { data, error } = await supabase.from('airports').select('*').eq('icao', icao.toUpperCase()).single();
      if (error) throw error;
      set(state => ({ airportDetails: { ...state.airportDetails, [icao]: data } }));
    } catch (error) {
      // Fallback
    }
  },

  fetchAllAirports: async () => {
    try {
      const { data, error } = await supabase.from('airports').select('*');
      if (error) throw error;
      const airportMap = data.reduce((acc, airport) => {
        acc[airport.icao] = airport;
        return acc;
      }, {} as any);
      set(state => ({ airportDetails: { ...state.airportDetails, ...airportMap } }));
    } catch (error) {}
  },

  generateFlightPlan: async (dep, dest) => {
    set({ isLoading: true, activeFlightPlan: null });
    try {
      const [dm, ds, dn, dsn] = await Promise.all([
        weatherAPI.getMETAR(dep),
        weatherAPI.getMETAR(dest),
        weatherAPI.getNOTAMs(dep),
        weatherAPI.getNOTAMs(dest)
      ]);
      set({ 
        activeFlightPlan: { 
          departure: { icao: dep, metar: dm, taf: null, notams: dn }, 
          destination: { icao: dest, metar: ds, taf: null, notams: dsn } 
        }, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
    }
  }
}));