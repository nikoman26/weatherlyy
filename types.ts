export interface User {
  id: string; // Changed to string/UUID for Supabase
  username: string;
  email: string;
  role: string;
  favoriteAirports: string[];
  preferences: UserPreferences;
  licenseNumber?: string;
  totalFlightHours?: number;
  pilotCertification?: string;
}

export interface UserPreferences {
  temperatureUnit: 'celsius' | 'fahrenheit';
  windUnit: 'kts' | 'mph';
  darkMode: boolean;
  emailAlerts: boolean;
  smsAlerts: boolean;
}

export interface WindData {
  direction_degrees: number;
  speed_kts: number;
  gust_kts?: number;
}

export interface CloudLayer {
  cover: 'CLR' | 'FEW' | 'SCT' | 'BKN' | 'OVC' | 'VV';
  base?: number;
  text?: string;
}

export interface MetarData {
  station: string;
  raw_text: string;
  observed: string;
  wind: WindData;
  visibility: {
    miles: string;
    meters: string;
  };
  clouds: CloudLayer[];
  temperature: {
    celsius: number;
    fahrenheit: number;
  };
  dewpoint: {
    celsius: number;
    fahrenheit: number;
  };
  altimeter: {
    hg: number;
    hpa: number;
  };
  flight_category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  temp_trend?: 'rising' | 'falling' | 'steady';
  wind_trend?: 'rising' | 'falling' | 'steady';
}

export interface TafForecast {
  timestamp: {
    from: string;
    to: string;
  };
  wind?: WindData;
  visibility?: {
    miles: string;
    meters: string;
  };
  clouds?: CloudLayer[];
  probability?: number;
  type?: 'TEMPO' | 'BECMG' | 'FM';
}

export interface TafData {
  station: string;
  raw_text: string;
  issue_time: string;
  valid_time_from: string;
  valid_time_to: string;
  forecast: TafForecast[];
}

export interface Notam {
  id: string;
  number: string;
  type: string;
  location: string;
  start: string;
  end: string;
  text: string;
  source: string;
  coordinates?: { lat: number; lng: number }; // For map view
}

export interface Pirep {
  id: number;
  icao_code: string;
  aircraft_type: string;
  flight_level: string;
  aircraft_position: {
    latitude: number;
    longitude: number;
  };
  weather_conditions: string;
  turbulence: string;
  icing: string;
  submitted_at: string;
  remarks?: string;
  // Added for display in Pireps.tsx
  profiles?: {
    username: string;
  }
}

export interface AirportDetails {
  icao: string;
  name: string;
  elevation: number;
  latitude: number;
  longitude: number;
  runways: { ident: string; length_ft: number; width_ft: number; surface: string }[];
  frequencies: { type: string; frequency: string }[];
  procedures: string[];
}

export interface WeatherApiResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    metar?: MetarData;
    taf?: TafData;
    notams?: Notam[];
    pireps?: Pirep[];
  };
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

// Checklist Types
export interface ChecklistItem {
  id: string;
  challenge: string;
  response: string;
  checked?: boolean; // UI state
}

export interface Checklist {
  id: string;
  title: string;
  category: 'Normal' | 'Emergency' | 'Reference';
  items: ChecklistItem[];
}

export interface AircraftChecklist {
  aircraftId: string;
  name: string;
  checklists: Checklist[];
}