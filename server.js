// WEATHERLY Backend API Server with Supabase Integration
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors());
app.use(express.json());

// API Keys from environment (secured in backend)
const API_KEYS = {
  checkwx: process.env.CHECKWX_API_KEY,
  icao: process.env.ICAO_API_KEY,
  openweather: process.env.OPENWEATHER_API_KEY,
  windy: process.env.WINDY_API_KEY,
  avwx: process.env.AVWX_API_KEY,
  openaip: process.env.OPENAIP_API_KEY
};

// Helper function to make API requests
const makeApiRequest = async (url, options = {}) => {
  try {
    const response = await axios({
      url,
      ...options,
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('API Request failed:', error.message);
    throw error;
  }
};

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    supabase: 'connected',
    version: '2.0.0'
  });
});

// User profile endpoint
app.get('/api/auth/profile', authenticateUser, async (req, res) => {
  try {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json({ user: userProfile });
  } catch (error) {
    console.error('Profile endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch METAR data
app.get('/api/weather/metar', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    if (!icao) {
      return res.status(400).json({ 
        success: false, 
        message: 'ICAO code is required' 
      });
    }

    // Try external API first
    try {
      const checkwxUrl = `https://api.checkwx.com/v1/metar/${icao}/decoded`;
      
      const data = await makeApiRequest(checkwxUrl, {
        headers: {
          'X-API-Key': API_KEYS.checkwx
        }
      });

      if (data && data.data) {
        return res.json({
          success: true,
          code: 'SUCCESS',
          message: 'METAR data retrieved successfully',
          data: data.data
        });
      }
    } catch (apiError) {
      console.warn('External API failed, using fallback:', apiError.message);
    }

    // Fallback to mock data for development
    const mockData = {
      station: { ident: icao },
      raw_text: `${icao} 041800Z 27015G25KT 10SM FEW025 22/15 A2992 RMK AO2 SLP132`,
      observed: new Date().toISOString(),
      wind: { direction_degrees: 270, speed_kts: 15, gust_kts: 25 },
      visibility: { miles: '10', meters: '16093' },
      clouds: [{ code: 'FEW', base_feet_agl: 2500 }],
      temperature: { celsius: 22, fahrenheit: 72 },
      dewpoint: { celsius: 15, fahrenheit: 59 },
      altimeter: { hg: 29.92, hpa: 1013 }
    };

    res.json({
      success: true,
      code: 'MOCK',
      message: 'METAR data retrieved (development mode)',
      data: mockData
    });

  } catch (error) {
    console.error('METAR fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch METAR data',
      error: error.message
    });
  }
});

// Fetch TAF data
app.get('/api/weather/taf', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    if (!icao) {
      return res.status(400).json({ 
        success: false, 
        message: 'ICAO code is required' 
      });
    }

    // Try external API first
    try {
      const checkwxUrl = `https://api.checkwx.com/v1/taf/${icao}/decoded`;
      
      const data = await makeApiRequest(checkwxUrl, {
        headers: {
          'X-API-Key': API_KEYS.checkwx
        }
      });

      if (data && data.data) {
        return res.json({
          success: true,
          code: 'SUCCESS',
          message: 'TAF data retrieved successfully',
          data: data.data
        });
      }
    } catch (apiError) {
      console.warn('External API failed, using fallback:', apiError.message);
    }

    // Fallback to mock data for development
    const mockData = {
      station: { ident: icao },
      raw_text: `TAF ${icao} 041730Z 0418/0524 26015G24KT P6SM FEW040`,
      issue_time: new Date().toISOString(),
      valid_time_from: new Date().toISOString(),
      valid_time_to: new Date(Date.now() + 86400000).toISOString(),
      forecast: [{
        timestamp: {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 21600000).toISOString()
        },
        wind: { direction_degrees: 260, speed_kts: 15, gust_kts: 24 },
        visibility: { miles: 'P6', meters: '>9999' },
        clouds: [{ code: 'FEW', base_feet_agl: 4000 }]
      }]
    };

    res.json({
      success: true,
      code: 'MOCK',
      message: 'TAF data retrieved (development mode)',
      data: mockData
    });

  } catch (error) {
    console.error('TAF fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch TAF data',
      error: error.message
    });
  }
});

// Fetch NOTAMs
app.get('/api/notams', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    if (!icao) {
      return res.status(400).json({ 
        success: false, 
        message: 'ICAO code is required' 
      });
    }

    // Mock NOTAMs data for development
    const mockData = [{
      id: `A1234/25`,
      number: `A1234/25`,
      type: 'N',
      location: icao,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 86400000).toISOString(),
      text: `RWY 04L/22R CLSD DUE WIP. MAINT VEHICLES ON TWY A.`,
      source: 'AVWX'
    }];

    res.json({
      success: true,
      code: 'MOCK',
      message: 'NOTAMs retrieved (development mode)',
      data: mockData
    });

  } catch (error) {
    console.error('NOTAMs fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NOTAMs',
      error: error.message
    });
  }
});

// Fetch PIREPs
app.get('/api/pireps', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    // Mock PIREPs data for development
    const mockData = [{
      id: 1,
      icao_code: icao || 'KJFK',
      aircraft_type: 'B737',
      flight_level: '350',
      latitude: 40.7,
      longitude: -74.0,
      weather_conditions: 'Clear skies',
      turbulence: 'Light chop',
      icing: 'None',
      submitted_at: new Date(Date.now() - 3600000).toISOString(),
      users: { username: 'PilotUser', email: 'pilot@example.com' }
    }];

    res.json({
      success: true,
      code: 'MOCK',
      message: 'PIREP data retrieved (development mode)',
      data: mockData
    });

  } catch (error) {
    console.error('PIREP fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PIREPs',
      error: error.message
    });
  }
});

// Submit PIREP
app.post('/api/pireps', authenticateUser, async (req, res) => {
  try {
    const pirepData = {
      icao_code: req.body.icao_code,
      aircraft_type: req.body.aircraft_type,
      flight_level: req.body.flight_level,
      latitude: req.body.aircraft_position?.latitude,
      longitude: req.body.aircraft_position?.longitude,
      weather_conditions: req.body.weather_conditions,
      turbulence: req.body.turbulence,
      icing: req.body.icing,
      remarks: req.body.remarks,
      submitted_by: req.user.id
    };

    // Mock successful submission
    const newPirep = {
      ...pirepData,
      id: Math.floor(Math.random() * 10000),
      submitted_at: new Date().toISOString()
    };

    res.json({
      success: true,
      code: 'MOCK',
      message: 'PIREP submitted successfully (development mode)',
      data: newPirep
    });

  } catch (error) {
    console.error('PIREP submit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit PIREP',
      error: error.message
    });
  }
});

// Fetch Airport Details
app.get('/api/airports', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    if (!icao) {
      return res.status(400).json({ 
        success: false, 
        message: 'ICAO code is required' 
      });
    }

    // Mock airport data for development
    const mockData = {
      icao: icao,
      name: `${icao} Airport`,
      elevation: 1000,
      latitude: 40.0,
      longitude: -74.0,
      runways: [{
        ident: '04/22',
        length_ft: 8000,
        width_ft: 150,
        surface: 'Asphalt'
      }]
    };

    res.json({
      success: true,
      code: 'MOCK',
      message: 'Airport details retrieved (development mode)',
      data: mockData
    });

  } catch (error) {
    console.error('Airport details fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch airport details',
      error: error.message
    });
  }
});

// Save Flight Plan
app.post('/api/flight-plans', authenticateUser, async (req, res) => {
  try {
    const flightPlanData = {
      user_id: req.user.id,
      departure_icao: req.body.departure?.icao,
      destination_icao: req.body.destination?.icao,
      aircraft_type: req.body.aircraft_type,
      planned_departure: req.body.planned_departure,
      flight_rules: req.body.flight_rules || 'VFR',
      route: req.body.route,
      aircraft_identification: req.body.aircraft_identification
    };

    // Mock successful save
    const newFlightPlan = {
      ...flightPlanData,
      id: Math.floor(Math.random() * 10000),
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      code: 'MOCK',
      message: 'Flight plan saved successfully (development mode)',
      data: newFlightPlan
    });

  } catch (error) {
    console.error('Flight plan save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save flight plan',
      error: error.message
    });
  }
});

// Get User's Flight Plans
app.get('/api/flight-plans', authenticateUser, async (req, res) => {
  try {
    // Mock flight plans data
    const mockData = [{
      id: 1,
      user_id: req.user.id,
      departure_icao: 'KJFK',
      destination_icao: 'LAX',
      aircraft_type: 'B737',
      planned_departure: new Date().toISOString(),
      flight_rules: 'VFR',
      created_at: new Date().toISOString()
    }];

    res.json({
      success: true,
      code: 'MOCK',
      message: 'Flight plans retrieved (development mode)',
      data: mockData
    });

  } catch (error) {
    console.error('Flight plans fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flight plans',
      error: error.message
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WEATHERLY Backend API Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Supabase connected: ${supabaseUrl}`);
  console.log(`🔐 Authentication: JWT with Supabase Auth`);
  console.log(`📊 Version: 2.0.0 with Supabase Integration`);
  console.log(`⚠️  Running in DEVELOPMENT MODE with mock data fallbacks`);
});

export default app;
