// Real Aviation Weather API Service
import { MetarData, TafData, Notam, Pirep, AirportDetails } from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// CheckWX API for METAR/TAF data
class WeatherAPI {
  private async fetchFromAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Fetch METAR data from CheckWX
  async getMETAR(icao: string): Promise<MetarData> {
    try {
      const data = await this.fetchFromAPI(`/weather/metar?icao=${icao}`);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch METAR');
      }

      const metarData = data.data;
      
      // Transform CheckWX data to our format
      return {
        station: metarData.station?.ident || icao,
        raw_text: metarData.raw_text || '',
        observed: metarData.observed || new Date().toISOString(),
        wind: {
          direction_degrees: metarData.wind?.direction_degrees || 0,
          speed_kts: metarData.wind?.speed_kts || 0,
          gust_kts: metarData.wind?.gust_kts
        },
        visibility: {
          miles: metarData.visibility?.miles || '0',
          meters: metarData.visibility?.meters || '0'
        },
        clouds: metarData.clouds?.map((cloud: any) => ({
          cover: cloud.code || 'CLR',
          base: cloud.base_feet_agl,
          text: cloud.text || ''
        })) || [],
        temperature: {
          celsius: metarData.temperature?.celsius || 0,
          fahrenheit: metarData.temperature?.fahrenheit || 32
        },
        dewpoint: {
          celsius: metarData.dewpoint?.celsius || 0,
          fahrenheit: metarData.dewpoint?.fahrenheit || 32
        },
        altimeter: {
          hg: metarData.altimeter?.hg || 29.92,
          hpa: metarData.altimeter?.hpa || 1013
        },
        flight_category: metarData.flight_category || 'VFR',
        temp_trend: metarData.temp_trend,
        wind_trend: metarData.wind_trend
      };
    } catch (error) {
      console.error(`Failed to fetch METAR for ${icao}:`, error);
      throw error;
    }
  }

  // Fetch TAF data from CheckWX
  async getTAF(icao: string): Promise<TafData> {
    try {
      const data = await this.fetchFromAPI(`/weather/taf?icao=${icao}`);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch TAF');
      }

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
          wind: f.wind ? {
            direction_degrees: f.wind.direction_degrees || 0,
            speed_kts: f.wind.speed_kts || 0,
            gust_kts: f.wind.gust_kts
          } : undefined,
          visibility: f.visibility ? {
            miles: f.visibility.miles || '0',
            meters: f.visibility.meters || '0'
          } : undefined,
          clouds: f.clouds?.map((cloud: any) => ({
            cover: cloud.code || 'CLR',
            base: cloud.base_feet_agl
          })),
          probability: f.probability,
          type: f.change_indicator
        })) || []
      };
    } catch (error) {
      console.error(`Failed to fetch TAF for ${icao}:`, error);
      throw error;
    }
  }

  // Fetch NOTAMs
  async getNOTAMs(icao: string): Promise<Notam[]> {
    try {
      const data = await this.fetchFromAPI(`/notams?icao=${icao}`);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch NOTAMs');
      }

      return data.data.map((notam: any) => ({
        id: notam.id || notam.number,
        number: notam.number || '',
        type: notam.type || 'N',
        location: notam.location || icao,
        start: notam.start_time || new Date().toISOString(),
        end: notam.end_time || new Date(Date.now() + 86400000).toISOString(),
        text: notam.text || '',
        source: notam.source || 'ICAO',
        coordinates: notam.coordinates
      }));
    } catch (error) {
      console.error(`Failed to fetch NOTAMs for ${icao}:`, error);
      return [];
    }
  }

  // Fetch PIREPs
  async getPIREPs(icao?: string): Promise<Pirep[]> {
    try {
      const query = icao ? `?icao=${icao}` : '';
      const data = await this.fetchFromAPI(`/pireps${query}`);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch PIREPs');
      }

      return data.data.map((pirep: any) => ({
        id: pirep.id || Math.floor(Math.random() * 10000),
        icao_code: pirep.icao_code || '',
        aircraft_type: pirep.aircraft_type || '',
        flight_level: pirep.flight_level || '',
        aircraft_position: {
          latitude: pirep.latitude || 0,
          longitude: pirep.longitude || 0
        },
        weather_conditions: pirep.weather_conditions || '',
        turbulence: pirep.turbulence || '',
        icing: pirep.icing || '',
        submitted_at: pirep.submitted_at || new Date().toISOString(),
        remarks: pirep.remarks
      }));
    } catch (error) {
      console.error('Failed to fetch PIREPs:', error);
      return [];
    }
  }

  // Submit PIREP
  async submitPIREP(pirepData: Omit<Pirep, 'id' | 'submitted_at'>): Promise<Pirep> {
    try {
      const data = await this.fetchFromAPI('/pireps', {
        method: 'POST',
        body: JSON.stringify(pirepData)
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to submit PIREP');
      }

      return data.data;
    } catch (error) {
      console.error('Failed to submit PIREP:', error);
      throw error;
    }
  }

  // Fetch Airport Details
  async getAirportDetails(icao: string): Promise<AirportDetails | null> {
    try {
      const data = await this.fetchFromAPI(`/airports?icao=${icao}`);
      
      if (!data.success) {
        return null;
      }

      const airport = data.data;
      
      return {
        icao: airport.icao || icao,
        name: airport.name || 'Unknown Airport',
        elevation: airport.elevation || 0,
        latitude: airport.latitude || 0,
        longitude: airport.longitude || 0,
        runways: airport.runways?.map((runway: any) => ({
          ident: runway.ident || '',
          length_ft: runway.length_ft || 0,
          width_ft: runway.width_ft || 0,
          surface: runway.surface || 'Unknown'
        })) || [],
        frequencies: airport.frequencies?.map((freq: any) => ({
          type: freq.type || '',
          frequency: freq.frequency || ''
        })) || [],
        procedures: airport.procedures || []
      };
    } catch (error) {
      console.error(`Failed to fetch airport details for ${icao}:`, error);
      return null;
    }
  }
}

export const weatherAPI = new WeatherAPI();
