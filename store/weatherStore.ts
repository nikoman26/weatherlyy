import { create } from 'zustand';
import { MetarData, TafData, Notam, Pirep, AirportDetails, UserPreferences } from '../types.ts';
import { MOCK_METARS, MOCK_TAFS, MOCK_NOTAMS, MOCK_PIREPS } from '../services/mockData.ts';
import { weatherAPI } from '../services/weatherApi.ts';
import { supabase } from '../src/integrations/supabase/client';

interface FlightPlanData {
  departure: { icao: string; metar: MetarData | null; taf: TafData | null; notams: Notam[]; };
  destination: { icao: string; metar: MetarData | null; taf: TafData | null; notams: Notam[]; };
}

interface UserProfileUpdate {
  username?: string;
  licenseNumber?: string;
  pilotCertification?: string;
}

interface Bounds {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
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
  allUsers: any[]; // For Admin Dashboard

  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  setActiveAirport: (icao: string) => void;
  fetchWeather: (icao: string) => Promise<void>;
  fetchNotams: (icao: string) => Promise<void>;
  fetchPireps: () => Promise<void>;
  submitPirep: (pirep: any) => Promise<void>;
  fetchAirportDetails: (icao: string) => Promise<void>;
  fetchAirportsInBounds: (bounds?: Bounds) => Promise<void>; // Renamed and updated signature
  generateFlightPlan: (dep: string, dest: string, aircraftType: string) => Promise<void>;
  
  // Settings & Admin Actions
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  updateUserProfile: (profile: UserProfileUpdate) => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const mapProfileToUser = (sessionUser: any, profile: any) => {
    if (!profile) return sessionUser;
    
    return {
        ...sessionUser,
        ...profile,
        id: profile.id, // Ensure ID is correctly mapped
        username: profile.username || sessionUser.email?.split('@')[0] || 'Pilot',
        email: sessionUser.email || profile.email,
        favoriteAirports: profile.favorite_airports || [],
        licenseNumber: profile.license_number,
        pilotCertification: profile.pilot_certification,
        preferences: {
            temperatureUnit: profile.temperature_unit || 'celsius',
            windUnit: profile.wind_unit || 'kts',
            darkMode: profile.dark_mode || false,
            emailAlerts: profile.email_alerts || false,
            smsAlerts: profile.sms_alerts || false,
        }
    };
};

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
  allUsers: [],

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      const formattedUser = mapProfileToUser(session.user, profile);

      set({ user: formattedUser });
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
      // Fallback to mock data
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
      await weatherAPI.submitPIREP(pirepData);
      
      // Refresh the list after submission
      await get().fetchPireps(); 
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  fetchAirportDetails: async (icao) => {
    try {
      const details = await weatherAPI.getAirportDetails(icao);
      if (details) {
        set(state => ({ airportDetails: { ...state.airportDetails, [icao]: details } }));
      }
    } catch (error) {
      // Fallback
    }
  },

  fetchAirportsInBounds: async (bounds) => {
    try {
      const data = await weatherAPI.fetchAirportsInBounds(bounds);
      const airportMap = data.reduce((acc, airport) => {
        acc[airport.icao] = airport;
        return acc;
      }, {} as any);
      
      // Only update the airports that are currently in view, preserving others
      set(state => ({ airportDetails: { ...state.airportDetails, ...airportMap } }));
    } catch (error) {
        console.error("Failed to fetch airports in bounds:", error);
    }
  },

  generateFlightPlan: async (dep, dest, aircraftType) => {
    set({ isLoading: true, activeFlightPlan: null });
    try {
      const [dm, ds, dn, dsn] = await Promise.all([
        weatherAPI.getMETAR(dep),
        weatherAPI.getMETAR(dest),
        weatherAPI.getNOTAMs(dep),
        weatherAPI.getNOTAMs(dest)
      ]);
      
      const flightPlan = { 
          departure_icao: dep, 
          destination_icao: dest, 
          aircraft_type: aircraftType,
          planned_departure: new Date().toISOString(),
          flight_rules: 'IFR', // Defaulting to IFR for long haul mock
          route: [{ lat: dm.temperature.celsius, lng: dm.dewpoint.celsius }, { lat: ds.temperature.celsius, lng: ds.dewpoint.celsius }] // Mock route points
      };
      
      // Save the plan to the database
      await weatherAPI.saveFlightPlan(flightPlan);
      
      set({ 
        activeFlightPlan: { 
          departure: { icao: dep, metar: dm, taf: null, notams: dn }, 
          destination: { icao: dest, metar: ds, taf: null, notams: dsn } 
        }, 
        isLoading: false 
      });
      
    } catch (error) {
      console.error('Flight plan generation failed:', error);
      set({ isLoading: false, error: 'Failed to generate or save flight plan.' });
    }
  },
  
  // --- Settings & Admin Implementations ---
  
  updatePreferences: async (prefs) => {
      const user = get().user;
      if (!user) return;
      
      set({ isLoading: true });
      
      // Map camelCase preferences to snake_case database columns
      const updatePayload = {
          temperature_unit: prefs.temperatureUnit,
          wind_unit: prefs.windUnit,
          dark_mode: prefs.darkMode,
          email_alerts: prefs.emailAlerts,
          sms_alerts: prefs.smsAlerts,
      };
      
      try {
          const { data, error } = await supabase
              .from('profiles')
              .update(updatePayload)
              .eq('id', user.id)
              .select()
              .single();
              
          if (error) throw error;
          
          // Update local user state with new preferences
          set(state => ({ 
              user: mapProfileToUser(state.user, data),
              isLoading: false 
          }));
          
      } catch (error) {
          console.error('Failed to update preferences:', error);
          set({ isLoading: false, error: 'Failed to save preferences.' });
      }
  },
  
  updateUserProfile: async (profile) => {
      const user = get().user;
      if (!user) return;
      
      set({ isLoading: true });
      
      // Map camelCase profile fields to snake_case database columns
      const updatePayload = {
          username: profile.username,
          license_number: profile.licenseNumber,
          pilot_certification: profile.pilotCertification,
      };
      
      try {
          const { data, error } = await supabase
              .from('profiles')
              .update(updatePayload)
              .eq('id', user.id)
              .select()
              .single();
              
          if (error) throw error;
          
          // Update local user state
          set(state => ({ 
              user: mapProfileToUser(state.user, data),
              isLoading: false 
          }));
          
      } catch (error) {
          console.error('Failed to update profile:', error);
          set({ isLoading: false, error: 'Failed to save profile.' });
      }
  },
  
  fetchAllUsers: async () => {
      set({ isLoading: true });
      try {
          const profiles = await weatherAPI.fetchAllUsers();
          
          // Map snake_case back to camelCase for the UI
          const formattedUsers = profiles.map(p => mapProfileToUser(p, p));
          
          set({ allUsers: formattedUsers, isLoading: false });
      } catch (error) {
          console.error('Failed to fetch all users:', error);
          set({ isLoading: false, error: 'Failed to fetch user list.' });
      }
  },
  
  updateUserRole: async (userId, role) => {
      set({ isLoading: true });
      try {
          await weatherAPI.updateRole(userId, role);
          
          // Refresh user list
          await get().fetchAllUsers();
          
      } catch (error) {
          console.error('Failed to update user role:', error);
          set({ isLoading: false, error: 'Failed to update user role.' });
      }
  },
  
  deleteUser: async (userId) => {
      set({ isLoading: true });
      try {
          await weatherAPI.deleteUser(userId); 
          
          // Remove from local list
          set(state => ({ 
              allUsers: state.allUsers.filter(u => u.id !== userId),
              isLoading: false 
          }));
          
      } catch (error) {
          console.error('Failed to delete user:', error);
          set({ isLoading: false, error: 'Failed to delete user.' });
      }
  }
}));