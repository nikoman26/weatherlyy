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
  allUsers: User[]; // For Admin
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
  fetchAirportsInBounds: (bounds: { south: number, west: number, north: number, east: number }) => Promise<void>;
  generateFlightPlan: (dep: string, dest: string) => Promise<void>;
  
  // Admin Actions
  updateUserRole: (userId: number, role: string) => void;
  deleteUser: (userId: number) => void;
  updateApiKeys: (keys: Partial<ApiKeys>) => Promise<void>;
  loadAirportData: () => Promise<void>;
}

// Mock Initial Users
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
    // Simulate API call
    setTimeout(() => {
      // Check if admin email for demo purposes
      const isAdmin = email.toLowerCase().includes('admin');
      
      set({
        isAuthenticated: true,
        user: {
          id: isAdmin ? 3 : 1,
          username: email.split('@')[0],
          email,
          role: isAdmin ? 'admin' : 'user', // RBAC Logic
          favoriteAirports: ['KJFK', 'EGLL', 'KSFO'],
          preferences: {
            temperatureUnit: 'celsius',
            windUnit: 'kts',
            darkMode: true,
            emailAlerts: true,
            smsAlerts: false
          },
          licenseNumber: isAdmin ? 'ADMIN-001' : 'ATP-12345',
          totalFlightHours: 1500,
          pilotCertification: 'ATP Multi-Engine Land'
        },
        isLoading: false
      });
    }, 800);
  },

  logout: () => set({ isAuthenticated: false, user: null }),

  setActiveAirport: (icao: string) => set({ activeAirport: icao }),

  fetchWeather: async (icao: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Fetch real METAR and TAF data
      const [metarResult, tafResult] = await Promise.allSettled([
        weatherAPI.getMETAR(icao),
        weatherAPI.getTAF(icao)
      ]);

      let metarData = null;
      let tafData = null;

      if (metarResult.status === 'fulfilled') {
        metarData = metarResult.value;
      } else {
        console.error('METAR fetch failed:', metarResult.reason);
        // Fallback to mock data if real API fails
        metarData = MOCK_METARS[icao] || null;
      }

      if (tafResult.status === 'fulfilled') {
        tafData = tafResult.value;
      } else {
        console.error('TAF fetch failed:', tafResult.reason);
        // Fallback to mock data if real API fails
        tafData = MOCK_TAFS[icao] || null;
      }

      if (!metarData && !tafData) {
        set({ error: 'Weather data not available for this station', isLoading: false });
      }

      set(state => ({
        weatherData: {
          ...state.weatherData,
          [icao]: { metar: metarData, taf: tafData }
        },
        isLoading: false
      }));

    } catch (error) {
      console.error('Weather fetch error:', error);
      // Fallback to mock data on any error
      const metar = MOCK_METARS[icao] || null;
      const taf = MOCK_TAFS[icao] || null;
      
      set(state => ({
        weatherData: {
          ...state.weatherData,
          [icao]: { metar, taf }
        },
        error: error instanceof Error ? error.message : 'Failed to fetch weather data',
        isLoading: false
      }));
    }
  },

  fetchNotams: async (icao: string) => {
    set({ error: null });
    try {
      const notams = await weatherAPI.getNOTAMs(icao);
      set(state => ({
        notams: {
          ...state.notams,
          [icao]: notams
        }
      }));
    } catch (error) {
      console.error('NOTAMs fetch failed:', error);
      // Fallback to mock data
      const data = MOCK_NOTAMS[icao] || [];
      set(state => ({
        notams: {
          ...state.notams,
          [icao]: data
        }
      }));
    }
  },

  fetchPireps: async () => {
    try {
      const pireps = await weatherAPI.getPIREPs();
      set({ pireps });
    } catch (error) {
      console.error('PIREP fetch failed:', error);
      // Fallback to mock data
      set({ pireps: MOCK_PIREPS });
    }
  },

  submitPirep: async (pirepData) => {
      set({ isLoading: true });
      try {
        const newPirep = await weatherAPI.submitPIREP(pirepData);
        set(state => ({
          pireps: [newPirep, ...state.pireps],
          isLoading: false
        }));
      } catch (error) {
        console.error('PIREP submission failed:', error);
        // Fallback to local submission
        const newPirep: Pirep = {
          ...pirepData,
          id: Math.floor(Math.random() * 10000),
          submitted_at: new Date().toISOString()
        };
        set(state => ({
          pireps: [newPirep, ...state.pireps],
          isLoading: false
        }));
      }
  },

  updatePreferences: (prefs) => {
      set(state => {
          if (!state.user) return state;
          return {
              user: {
                  ...state.user,
                  preferences: { ...state.user.preferences, ...prefs }
              }
          };
      });
  },

  updateUserProfile: async (profile) => {
      set({ isLoading: true });
      await new Promise(resolve => setTimeout(resolve, 800));
      set(state => {
          if (!state.user) return { isLoading: false };
          return {
              user: { ...state.user, ...profile },
              isLoading: false
          };
      });
  },

  fetchAirportDetails: async (icao: string) => {
      try {
        const details = await weatherAPI.getAirportDetails(icao);
        if (details) {
          set(state => ({
            airportDetails: {
              ...state.airportDetails,
              [icao]: details
            }
          }));
        }
      } catch (error) {
        console.error('Airport details fetch failed:', error);
        // Note: Backend now handles mock fallback if Supabase fails.
      }
  },
  
  fetchAirportsInBounds: async (bounds: { south: number, west: number, north: number, east: number }) => {
      // This is a simulation. In a real app, the backend would query Supabase 
      // using the bounds (e.g., PostGIS ST_Within).
      
      // For now, we simulate by filtering mock data based on bounds.
      const allMockAirports = Object.values(MOCK_AIRPORT_DETAILS);
      
      const airportsInBounds = allMockAirports.filter(airport => 
          airport.latitude >= bounds.south &&
          airport.latitude <= bounds.north &&
          airport.longitude >= bounds.west &&
          airport.longitude <= bounds.east
      ).map(a => a.icao);

      // Simulate fetching details for these airports
      await Promise.all(airportsInBounds.map(icao => get().fetchAirportDetails(icao)));
  },

  generateFlightPlan: async (dep: string, dest: string) => {
    set({ isLoading: true, error: null, activeFlightPlan: null });
    
    try {
      // Fetch real data for departure and destination
      const [depWeatherResult, destWeatherResult, depNotamsResult, destNotamsResult] = await Promise.allSettled([
        weatherAPI.getMETAR(dep),
        weatherAPI.getMETAR(dest),
        weatherAPI.getNOTAMs(dep),
        weatherAPI.getNOTAMs(dest)
      ]);

      const depMetar = depWeatherResult.status === 'fulfilled' ? depWeatherResult.value : MOCK_METARS[dep] || null;
      const depTaf = depWeatherResult.status === 'fulfilled' ? await weatherAPI.getTAF(dep).catch(() => MOCK_TAFS[dep] || null) : MOCK_TAFS[dep] || null;
      const depNotams = depNotamsResult.status === 'fulfilled' ? depNotamsResult.value : MOCK_NOTAMS[dep] || [];
      
      const destMetar = destWeatherResult.status === 'fulfilled' ? destWeatherResult.value : MOCK_METARS[dest] || null;
      const destTaf = destWeatherResult.status === 'fulfilled' ? await weatherAPI.getTAF(dest).catch(() => MOCK_TAFS[dest] || null) : MOCK_TAFS[dest] || null;
      const destNotams = destNotamsResult.status === 'fulfilled' ? destNotamsResult.value : MOCK_NOTAMS[dest] || [];

      // Fetch airport details (relying on backend for Supabase/Mock fallback)
      const [depDetailsResult, destDetailsResult] = await Promise.allSettled([
        weatherAPI.getAirportDetails(dep),
        weatherAPI.getAirportDetails(dest)
      ]);

      if (depDetailsResult.status === 'fulfilled' && depDetailsResult.value) {
        set(state => ({
          airportDetails: {
            ...state.airportDetails,
            [dep]: depDetailsResult.value!
          }
        }));
      }

      if (destDetailsResult.status === 'fulfilled' && destDetailsResult.value) {
        set(state => ({
          airportDetails: {
            ...state.airportDetails,
            [dest]: destDetailsResult.value!
          }
        }));
      }

      const flightPlan: FlightPlanData = {
        departure: { icao: dep, metar: depMetar, taf: depTaf, notams: depNotams },
        destination: { icao: dest, metar: destMetar, taf: destTaf, notams: destNotams }
      };

      set({ activeFlightPlan: flightPlan, isLoading: false });

    } catch (error) {
      console.error('Flight plan generation failed:', error);
      // Fallback to mock data for weather/notams if API calls failed entirely
      const depMetar = MOCK_METARS[dep] || null;
      const depTaf = MOCK_TAFS[dep] || null;
      const depNotams = MOCK_NOTAMS[dep] || [];
      const destMetar = MOCK_METARS[dest] || null;
      const destTaf = MOCK_TAFS[dest] || null;
      const destNotams = MOCK_NOTAMS[dest] || [];

      // Ensure mock airport details are loaded if API failed
      const depDetails = MOCK_AIRPORT_DETAILS[dep];
      const destDetails = MOCK_AIRPORT_DETAILS[dest];

      if (depDetails || destDetails) {
        set(state => ({
          airportDetails: {
            ...state.airportDetails,
            ...(depDetails ? {[dep]: depDetails} : {}),
            ...(destDetails ? {[dest]: destDetails} : {})
          }
        }));
      }

      const flightPlan: FlightPlanData = {
        departure: { icao: dep, metar: depMetar, taf: depTaf, notams: depNotams },
        destination: { icao: dest, metar: destMetar, taf: destTaf, notams: destNotams }
      };

      set({ activeFlightPlan: flightPlan, isLoading: false });
    }
  },

  updateUserRole: (userId, role) => {
    set(state => ({
      allUsers: state.allUsers.map(u => u.id === userId ? { ...u, role } : u)
    }));
  },

  deleteUser: (userId) => {
    set(state => ({
      allUsers: state.allUsers.filter(u => u.id !== userId)
    }));
  },

  updateApiKeys: async (keys) => {
      set({ isLoading: true });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      set(state => ({
          apiKeys: { ...state.apiKeys, ...keys },
          isLoading: false
      }));
  },
  
  loadAirportData: async () => {
      set({ isLoading: true, error: null });
      try {
          await weatherAPI.loadAirportData();
          set({ isLoading: false });
      } catch (error) {
          set({ isLoading: false, error: 'Failed to load airport data.' });
          console.error('Bulk load failed:', error);
          throw error;
      }
  }
}));