import { create } from 'zustand';
import { User, MetarData, TafData, Notam, Pirep, AirportDetails, UserPreferences } from '../types.ts';
import { MOCK_METARS, MOCK_TAFS, MOCK_NOTAMS, MOCK_PIREPS } from '../services/mockData.ts';
import { weatherAPI } from '../services/weatherApi.ts';

interface FlightPlanData {
  departure: { icao: string; metar: MetarData | null; taf: TafData | null; notams: Notam[]; };
  destination: { icao: string; metar: MetarData | null; taf: TafData | null; notams: Notam[]; };
}

interface WeatherStore {
  user: User | null;
  allUsers: User[];
  isAuthenticated: boolean;
  activeAirport: string | null;
  weatherData: Record<string, { metar: MetarData | null; taf: TafData | null }>;
  notams: Record<string, Notam[]>;
  pireps: Pirep[];
  airportDetails: Record<string, AirportDetails>;
  activeFlightPlan: FlightPlanData | null;
  isLoading: boolean;
  error: string | null;
  apiKeys: Record<string, string>;

  login: (email: string) => Promise<void>;
  logout: () => void;
  setActiveAirport: (icao: string) => void;
  fetchWeather: (icao: string) => Promise<void>;
  fetchNotams: (icao: string) => Promise<void>;
  fetchPireps: () => Promise<void>;
  submitPirep: (pirep: Omit<Pirep, 'id' | 'submitted_at'>) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  updateUserProfile: (profile: Partial<User>) => Promise<void>;
  fetchAirportDetails: (icao: string) => Promise<void>;
  fetchAllAirports: () => Promise<void>;
  fetchAirportsInBounds: (bounds: any) => Promise<void>;
  generateFlightPlan: (dep: string, dest: string) => Promise<void>;
  updateUserRole: (userId: number, role: string) => void;
  deleteUser: (userId: number) => void;
  updateApiKeys: (keys: any) => Promise<void>;
  loadAirportData: () => Promise<void>;
}

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  user: null,
  allUsers: [],
  isAuthenticated: false,
  activeAirport: null,
  weatherData: {},
  notams: {},
  pireps: [],
  airportDetails: {},
  activeFlightPlan: null,
  isLoading: false,
  error: null,
  apiKeys: {},

  login: async (email: string) => {
    set({ isLoading: true });
    setTimeout(() => {
      const isAdmin = email.toLowerCase().includes('admin');
      set({
        isAuthenticated: true,
        user: {
          id: isAdmin ? 3 : 1,
          username: email.split('@')[0],
          email,
          role: isAdmin ? 'admin' : 'user',
          favoriteAirports: ['KJFK', 'EGLL', 'KSFO'],
          preferences: { temperatureUnit: 'celsius', windUnit: 'kts', darkMode: true, emailAlerts: true, smsAlerts: false }
        },
        isLoading: false
      });
    }, 500);
  },

  logout: () => set({ isAuthenticated: false, user: null }),
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
      const pireps = await weatherAPI.getPIREPs();
      set({ pireps });
    } catch (error) {
      set({ pireps: MOCK_PIREPS });
    }
  },

  submitPirep: async (pirepData) => {
    set({ isLoading: true });
    try {
      const newPirep = await weatherAPI.submitPIREP(pirepData);
      set(state => ({ pireps: [newPirep, ...state.pireps], isLoading: false }));
    } catch (error) {
      const newPirep = { ...pirepData, id: Math.floor(Math.random() * 10000), submitted_at: new Date().toISOString() };
      set(state => ({ pireps: [newPirep, ...state.pireps], isLoading: false }));
    }
  },

  updatePreferences: (prefs) => set(state => state.user ? ({ user: { ...state.user, preferences: { ...state.user.preferences, ...prefs } } }) : state),
  updateUserProfile: async (profile) => {
    set({ isLoading: true });
    set(state => state.user ? ({ user: { ...state.user, ...profile }, isLoading: false }) : { isLoading: false });
  },

  fetchAirportDetails: async (icao) => {
    try {
      const details = await weatherAPI.getAirportDetails(icao);
      if (details) set(state => ({ airportDetails: { ...state.airportDetails, [icao]: details } }));
    } catch (error) {}
  },

  fetchAllAirports: async () => {
    set({ isLoading: true, error: null });
    try {
      const airports = await weatherAPI.getAllAirports();
      const airportMap = airports.reduce((acc, airport) => {
        acc[airport.icao] = airport;
        return acc;
      }, {} as Record<string, AirportDetails>);
      set(state => ({ airportDetails: { ...state.airportDetails, ...airportMap }, isLoading: false }));
    } catch (error) {
      set({ isLoading: false, error: 'Failed to load airport data.' });
    }
  },

  fetchAirportsInBounds: async () => {
    await get().fetchAllAirports();
  },

  generateFlightPlan: async (dep, dest) => {
    set({ isLoading: true, activeFlightPlan: null });
    try {
      const [dm, ds, dn, dsn] = await Promise.all([weatherAPI.getMETAR(dep), weatherAPI.getMETAR(dest), weatherAPI.getNOTAMs(dep), weatherAPI.getNOTAMs(dest)]);
      set({ activeFlightPlan: { departure: { icao: dep, metar: dm, taf: null, notams: dn }, destination: { icao: dest, metar: ds, taf: null, notams: dsn } }, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  updateUserRole: (userId, role) => set(state => ({ allUsers: state.allUsers.map(u => u.id === userId ? { ...u, role } : u) })),
  deleteUser: (userId) => set(state => ({ allUsers: state.allUsers.filter(u => u.id !== userId) })),
  updateApiKeys: async (keys) => {
    set({ isLoading: true });
    set(state => ({ apiKeys: { ...state.apiKeys, ...keys }, isLoading: false }));
  },
  loadAirportData: async () => {
    set({ isLoading: true });
    try {
      await weatherAPI.loadAirportData();
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  }
}));