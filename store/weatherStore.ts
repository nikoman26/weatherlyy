import { create } from 'zustand';
import { User, MetarData, TafData, Notam, Pirep, AirportDetails, UserPreferences } from '../types.ts';
import { MOCK_METARS, MOCK_TAFS, MOCK_NOTAMS, MOCK_PIREPS, MOCK_AIRPORT_DETAILS } from '../services/mockData.ts';
import { weatherAPI } from '../services/weatherApi.ts';

interface FlightPlanData {
  departure: {
    icao: string;
    metar: MetarData | null;
    taf: TafData | null;
    notams: Notam[];
  };
  destination: {
    icao: string;
    metar: MetarData | null;
    taf: TafData | null;
    notams: Notam[];
  };
}

interface ApiKeys {
  checkwx: string;
  icao: string;
  openweather: string;
  windy: string;
  avwx: string;
  openaip: string;
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
  apiKeys: ApiKeys;

  // Actions
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
  fetchAllAirports: () => Promise<void>; // NEW
  fetchAirportsInBounds: (bounds: { south: number, west: number, north: number, east: number }) => Promise<void>;
  generateFlightPlan: (dep: string, dest: string) => Promise<void>;
  
  // Admin Actions
  updateUserRole: (userId: number, role: string) => void;
  deleteUser: (userId: number) => void;
  updateApiKeys: (keys: Partial<ApiKeys>) => Promise<void>;
  loadAirportData: () => Promise<void>;
}

const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'CaptainDave',
    email: 'dave@weatherly.co.ke',
    role: 'user',
    favoriteAirports: ['KJFK'],
    preferences: { temperatureUnit: 'celsius', windUnit: 'kts', darkMode: true, emailAlerts: true, smsAlerts: false }
  },
  {
    id: 2,
    username: 'StudentPilot_Sarah',
    email: 'sarah@weatherly.co.ke',
    role: 'user',
    favoriteAirports: ['KLAX'],
    preferences: { temperatureUnit: 'fahrenheit', windUnit: 'kts', darkMode: true, emailAlerts: false, smsAlerts: true }
  },
  {
    id: 3,
    username: 'OpsAdmin',
    email: 'admin@weatherly.co.ke',
    role: 'admin',
    favoriteAirports: ['EGLL'],
    preferences: { temperatureUnit: 'celsius', windUnit: 'kts', darkMode: true, emailAlerts: true, smsAlerts: true }
  }
];

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  user: null,
  allUsers: INITIAL_USERS,
  isAuthenticated: false,
  activeAirport: null,
  weatherData: {},
  notams: {},
  pireps: [],
  airportDetails: {},
  activeFlightPlan: null,
  isLoading: false,
  error: null,
  apiKeys: {
    checkwx: '59c854f751b34b28a45f45bcc72b7e8b',
    icao: 'afce681b-5649-4135-918b-e5209508ebc5',
    openweather: '36057d8a851020194fee5caaa108c0c0',
    windy: 'mea0DswcSSnycBQkXTGU26QrUPUv0zQS',
    avwx: 'D7dEFR6DWQ5Al5jDsoPSvzsN9_cYZzG7lDE1pIgtSzw',
    openaip: '58ecb709bc7ce1fdf7123ae2db0a6bca',
  },

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
          preferences: { temperatureUnit: 'celsius', windUnit: 'kts', darkMode: true, emailAlerts: true, smsAlerts: false },
          licenseNumber: isAdmin ? 'ADMIN-001' : 'ATP-12345',
          totalFlightHours: 1500,
          pilotCertification: 'ATP Multi-Engine Land'
        },
        isLoading: false
      });
    }, 800);
  },

  logout: () => set({ isAuthenticated: false, user: null }),
  setActiveAirport: (icao) => set({ activeAirport: icao }),

  fetchWeather: async (icao) => {
    set({ isLoading: true, error: null });
    try {
      const [metarResult, tafResult] = await Promise.allSettled([
        weatherAPI.getMETAR(icao),
        weatherAPI.getTAF(icao)
      ]);
      const metarData = metarResult.status === 'fulfilled' ? metarResult.value : MOCK_METARS[icao] || null;
      const tafData = tafResult.status === 'fulfilled' ? tafResult.value : MOCK_TAFS[icao] || null;
      set(state => ({
        weatherData: { ...state.weatherData, [icao]: { metar: metarData, taf: tafData } },
        isLoading: false
      }));
    } catch (error) {
      set(state => ({
        weatherData: { ...state.weatherData, [icao]: { metar: MOCK_METARS[icao] || null, taf: MOCK_TAFS[icao] || null } },
        isLoading: false
      }));
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
    await new Promise(r => setTimeout(r, 800));
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
      set({ isLoading: false, error: 'Failed to load all airport data.' });
    }
  },

  fetchAirportsInBounds: async () => {
    await get().fetchAllAirports();
  },

  generateFlightPlan: async (dep, dest) => {
    set({ isLoading: true, error: null, activeFlightPlan: null });
    try {
      const [dm, ds, dn, dsn] = await Promise.allSettled([
        weatherAPI.getMETAR(dep), weatherAPI.getMETAR(dest),
        weatherAPI.getNOTAMs(dep), weatherAPI.getNOTAMs(dest)
      ]);
      const depMetar = dm.status === 'fulfilled' ? dm.value : MOCK_METARS[dep] || null;
      const destMetar = ds.status === 'fulfilled' ? ds.value : MOCK_METARS[dest] || null;
      const depNotams = dn.status === 'fulfilled' ? dn.value : MOCK_NOTAMS[dep] || [];
      const destNotams = dsn.status === 'fulfilled' ? dsn.value : MOCK_NOTAMS[dest] || [];
      
      const flightPlan = {
        departure: { icao: dep, metar: depMetar, taf: null, notams: depNotams },
        destination: { icao: dest, metar: destMetar, taf: null, notams: destNotams }
      };
      set({ activeFlightPlan: flightPlan, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  updateUserRole: (userId, role) => set(state => ({ allUsers: state.allUsers.map(u => u.id === userId ? { ...u, role } : u) })),
  deleteUser: (userId) => set(state => ({ allUsers: state.allUsers.filter(u => u.id !== userId) })),
  updateApiKeys: async (keys) => {
    set({ isLoading: true });
    await new Promise(r => setTimeout(r, 1000));
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