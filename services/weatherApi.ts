// Real Aviation Weather API Service
import { MetarData, TafData, Notam, Pirep, AirportDetails } from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class WeatherAPI {
  private async fetchFromAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get JWT token from local storage/session (assuming it's managed by Supabase client)
    // NOTE: We rely on the global L.supabase being available, which is set up in the App.tsx/SessionProvider flow.
    const session = await window.L.supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      if (response.status === 401) {
          // Handle unauthorized access (e.g., token expired)
          throw new Error('Unauthorized access. Please log in again.');
      }
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `API Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getMETAR(icao: string): Promise<MetarData> {
    const data = await this.fetchFromAPI(`/weather/metar?icao=${icao}`);
    if (!data.success) throw new Error(data.message || 'Failed to fetch METAR');
    const metarData = data.data;
    return {
      station: metarData.station?.ident || icao,
      raw_text: metarData.raw_text || '',
      observed: metarData.observed || new Date().toISOString(),
      wind: {
        direction_degrees: metarData.wind?.direction_degrees || 0,
        speed_kts: metarData.wind?.speed_kts || 0,
        gust_kts: metarData.wind?.gust_kts
      },
      visibility: { miles: metarData.visibility?.miles || '0', meters: metarData.visibility?.meters || '0' },
      clouds: metarData.clouds?.map((cloud: any) => ({
        cover: cloud.code || 'CLR',
        base: cloud.base_feet_agl,
        text: cloud.text || ''
      })) || [],
      temperature: { celsius: metarData.temperature?.celsius || 0, fahrenheit: metarData.temperature?.fahrenheit || 32 },
      dewpoint: { celsius: metarData.dewpoint?.celsius || 0, fahrenheit: metarData.dewpoint?.fahrenheit || 32 },
      altimeter: { hg: metarData.altimeter?.hg || 29.92, hpa: metarData.altimeter?.hpa || 1013 },
      flight_category: metarData.flight_category || 'VFR',
      temp_trend: metarData.temp_trend,
      wind_trend: metarData.wind_trend
    };
  }

  async getTAF(icao: string): Promise<TafData> {
    const data = await this.fetchFromAPI(`/weather/taf?icao=${icao}`);
    if (!data.success) throw new Error(data.message || 'Failed to fetch TAF');
    const tafData = data.data;
    return {
      station: tafData.station?.ident || icao,
      raw_text: tafData.raw_text || '',
      issue_time: tafData.issue_time || new Date().toISOString(),
      valid_time_from: tafData.valid_time_from || new Date().toISOString(),
      valid_time_to: tafData.valid_time_to || new Date(Date.now() + 86400000).toISOString(),
      forecast: tafData.forecast?.map((f: any) => ({
        timestamp: {
          from: f.timestamp?.from || new Date().toISOString(),
          to: f.timestamp?.to || new Date(Date.now() + 3600000).toISOString()
        },
        wind: f.wind ? { direction_degrees: f.wind.direction_degrees || 0, speed_kts: f.wind.speed_kts || 0, gust_kts: f.wind.gust_kts } : undefined,
        visibility: f.visibility ? { miles: f.visibility.miles || '0', meters: f.visibility.meters || '0' } : undefined,
        clouds: f.clouds?.map((cloud: any) => ({ cover: cloud.code || 'CLR', base: cloud.base_feet_agl })),
        probability: f.probability,
        type: f.change_indicator
      })) || []
    };
  }

  async getNOTAMs(icao: string): Promise<Notam[]> {
    const data = await this.fetchFromAPI(`/notams?icao=${icao}`);
    if (!data.success) throw new Error(data.message || 'Failed to fetch NOTAMs');
    return data.data.map((notam: any) => ({
      id: notam.id || notam.number,
      number: notam.number || '',
      type: notam.type || 'N',
      location: notam.location || icao,
      start: notam.start_time || new Date().toISOString(),
      end: notam.end_time || new Date(Date.now() + 86400000).toISOString(),
      text: notam.text || '',
      source: notam.source || 'ICAO'
    }));
  }

  async getPIREPs(): Promise<Pirep[]> {
    const data = await this.fetchFromAPI('/pireps');
    if (!data.success) throw new Error(data.message || 'Failed to fetch PIREPs');
    return data.data.map((pirep: any) => ({
      id: pirep.id || Math.floor(Math.random() * 10000),
      icao_code: pirep.icao_code || '',
      aircraft_type: pirep.aircraft_type || '',
      flight_level: pirep.flight_level || '',
      aircraft_position: { latitude: pirep.latitude || 0, longitude: pirep.longitude || 0 },
      weather_conditions: pirep.weather_conditions || '',
      turbulence: pirep.turbulence || '',
      icing: pirep.icing || '',
      submitted_at: pirep.created_at || new Date().toISOString(), // Use created_at from DB
      remarks: pirep.remarks,
      profiles: pirep.profiles // Include profile data for username
    }));
  }

  async submitPIREP(pirepData: Omit<Pirep, 'id' | 'submitted_at' | 'profiles'>): Promise<Pirep> {
    const data = await this.fetchFromAPI('/pireps', { method: 'POST', body: JSON.stringify(pirepData) });
    if (!data.success) throw new Error(data.message || 'Failed to submit PIREP');
    return data.data;
  }
  
  async saveFlightPlan(planData: any): Promise<any> {
      const data = await this.fetchFromAPI('/flight-plans', { method: 'POST', body: JSON.stringify(planData) });
      if (!data.success) throw new Error(data.message || 'Failed to save flight plan');
      return data.data;
  }

  async getAirportDetails(icao: string): Promise<AirportDetails | null> {
    const data = await this.fetchFromAPI(`/airports?icao=${icao}`);
    if (!data.success) return null;
    const airport = data.data;
    return {
      icao: airport.icao || icao,
      name: airport.name || 'Unknown Airport',
      elevation: airport.elevation || 0,
      latitude: airport.latitude || 0,
      longitude: airport.longitude || 0,
      runways: airport.runways || [],
      frequencies: airport.frequencies || [],
      procedures: airport.procedures || []
    };
  }
  
  async getAllAirports(): Promise<AirportDetails[]> {
    const data = await this.fetchFromAPI(`/airports/all`);
    if (!data.success || !Array.isArray(data.data)) throw new Error(data.message || 'Failed to fetch all airport data');
    return data.data.map((airport: any) => ({
      icao: airport.icao,
      name: airport.name,
      elevation: airport.elevation,
      latitude: airport.latitude,
      longitude: airport.longitude,
      runways: airport.runways || [],
      frequencies: airport.frequencies || [],
      procedures: airport.procedures || []
    }));
  }

  async loadAirportData(): Promise<any> {
    const data = await this.fetchFromAPI('/admin/load-airports', { method: 'POST' });
    if (!data.success) throw new Error(data.message || 'Failed to load airport data');
    return data;
  }
  
  // --- Admin API Methods ---
  
  async fetchAllUsers(): Promise<any[]> {
      const data = await this.fetchFromAPI('/admin/users');
      if (!data.success || !Array.isArray(data.data)) throw new Error(data.message || 'Failed to fetch user list');
      return data.data;
  }
  
  async updateRole(userId: string, role: string): Promise<void> {
      const data = await this.fetchFromAPI(`/admin/users/${userId}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role })
      });
      if (!data.success) throw new Error(data.message || 'Failed to update user role');
  }
  
  async deleteUser(userId: string): Promise<void> {
      const data = await this.fetchFromAPI(`/admin/users/${userId}`, {
          method: 'DELETE'
      });
      if (!data.success) throw new Error(data.message || 'Failed to delete user');
  }
}

export const weatherAPI = new WeatherAPI();