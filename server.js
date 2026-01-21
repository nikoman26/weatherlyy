import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://weatherlyy-ten.vercel.app',
  'https://weatherlyy-eedzqe80t-nikoman26s-projects.vercel.app',
  'https://weatherly.co.ke'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
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

// Fetch METAR data (Real API only)
app.get('/api/weather/metar', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    if (!icao) {
      return res.status(400).json({ 
        success: false, 
        message: 'ICAO code is required' 
      });
    }

    const checkwxUrl = `https://api.checkwx.com/v1/metar/${icao}/decoded`;
    
    const data = await makeApiRequest(checkwxUrl, {
      headers: {
        'X-API-Key': API_KEYS.checkwx
      }
    });

    if (data && data.data && data.data.length > 0) {
      return res.json({
        success: true,
        code: 'SUCCESS',
        message: 'METAR data retrieved successfully',
        data: data.data[0] // CheckWX returns an array
      });
    }
    
    // If API returns success but no data (e.g., invalid ICAO)
    res.status(404).json({
      success: false,
      message: `No METAR data found for ${icao}`,
      code: 'NOT_FOUND'
    });

  } catch (error) {
    console.error('METAR fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch METAR data from external API',
      error: error.message
    });
  }
});

// Fetch TAF data (Real API only)
app.get('/api/weather/taf', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    if (!icao) {
      return res.status(400).json({ 
        success: false, 
        message: 'ICAO code is required' 
      });
    }

    const checkwxUrl = `https://api.checkwx.com/v1/taf/${icao}/decoded`;
    
    const data = await makeApiRequest(checkwxUrl, {
      headers: {
        'X-API-Key': API_KEYS.checkwx
      }
    });

    if (data && data.data && data.data.length > 0) {
      return res.json({
        success: true,
        code: 'SUCCESS',
        message: 'TAF data retrieved successfully',
        data: data.data[0] // CheckWX returns an array
      });
    }
    
    // If API returns success but no data
    res.status(404).json({
      success: false,
      message: `No TAF data found for ${icao}`,
      code: 'NOT_FOUND'
    });

  } catch (error) {
    console.error('TAF fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch TAF data from external API',
      error: error.message
    });
  }
});

// Fetch NOTAMs (Minimal Mock until real API is implemented)
app.get('/api/notams', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    if (!icao) {
      return res.status(400).json({ 
        success: false, 
        message: 'ICAO code is required' 
      });
    }

    // TEMPORARY MOCK: Replace with real ICAO/AVWX API call when implemented
    const mockData = [{
      id: `A1234/25`,
      number: `A1234/25`,
      type: 'N',
      location: icao,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 86400000).toISOString(),
      text: `RWY 04L/22R CLSD DUE WIP. MAINT VEHICLES ON TWY A. (MOCK)`,
      source: 'AVWX'
    }];

    res.json({
      success: true,
      code: 'MOCK_PLACEHOLDER',
      message: 'NOTAMs retrieved (MOCK PLACEHOLDER)',
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

// Fetch PIREPs (Minimal Mock until database logic is implemented)
app.get('/api/pireps', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    // TEMPORARY MOCK: Replace with real Supabase query when implemented
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
      code: 'MOCK_PLACEHOLDER',
      message: 'PIREP data retrieved (MOCK PLACEHOLDER)',
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

// Submit PIREP (Minimal Mock until database logic is implemented)
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

    // TEMPORARY MOCK: Replace with real Supabase insert when implemented
    const newPirep = {
      ...pirepData,
      id: Math.floor(Math.random() * 10000),
      submitted_at: new Date().toISOString()
    };

    res.json({
      success: true,
      code: 'MOCK_PLACEHOLDER',
      message: 'PIREP submitted successfully (MOCK PLACEHOLDER)',
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

// Fetch Airport Details (Supabase only - single ICAO)
app.get('/api/airports', authenticateUser, async (req, res) => {
  try {
    const { icao } = req.query;
    
    if (!icao) {
      return res.status(400).json({ 
        success: false, 
        message: 'ICAO code is required' 
      });
    }

    // Query Supabase for airport details
    const { data: airportData, error } = await supabase
      .from('airports')
      .select('*')
      .eq('icao', icao.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Supabase airport fetch error:', error);
      return res.status(500).json({ success: false, message: 'Database error fetching airport details', error: error.message });
    }

    if (airportData) {
      return res.json({
        success: true,
        code: 'SUPABASE',
        message: 'Airport details retrieved from Supabase',
        data: airportData
      });
    }

    // If not found in Supabase
    res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: `Airport details not found for ${icao} in database.`
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

// NEW: Fetch All Airport Details (Supabase only - bulk fetch)
app.get('/api/airports/all', authenticateUser, async (req, res) => {
  try {
    // Query Supabase for all airport details
    const { data: airportData, error } = await supabase
      .from('airports')
      .select('*');

    if (error) {
      console.error('Supabase bulk airport fetch error:', error);
      return res.status(500).json({ success: false, message: 'Database error fetching all airport details', error: error.message });
    }

    res.json({
      success: true,
      code: 'SUPABASE_ALL',
      message: 'All airport details retrieved from Supabase',
      data: airportData
    });

  } catch (error) {
    console.error('All airport details fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all airport details',
      error: error.message
    });
  }
});


// Admin route to load airport data
app.post('/api/admin/load-airports', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }

  try {
    // Read the JSON file (assuming it's placed in the 'data' directory relative to the server start location)
    const filePath = path.join(__dirname, 'data/airports.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const airports = JSON.parse(fileContent);

    // Prepare data for insertion (Supabase expects an array of objects)
    const formattedAirports = airports.map(a => ({
      icao: a.icao,
      name: a.name,
      elevation: a.elevation,
      latitude: a.latitude,
      longitude: a.longitude,
      runways: a.runways,
      frequencies: a.frequencies,
      procedures: a.procedures,
    }));

    // Perform bulk upsert (insert or update if ICAO exists)
    const { error } = await supabase
      .from('airports')
      .upsert(formattedAirports, { onConflict: 'icao' });

    if (error) {
      console.error('Supabase bulk insert error:', error);
      return res.status(500).json({ success: false, message: 'Failed to insert data into Supabase', error: error.message });
    }

    res.json({
      success: true,
      message: `Successfully loaded ${formattedAirports.length} airports into Supabase.`,
      data: { count: formattedAirports.length }
    });

  } catch (error) {
    console.error('Airport data load error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process or load airport data',
      error: error.message
    });
  }
});


// Save Flight Plan (Minimal Mock until database logic is implemented)
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

    // TEMPORARY MOCK: Replace with real Supabase insert when implemented
    const newFlightPlan = {
      ...flightPlanData,
      id: Math.floor(Math.random() * 10000),
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      code: 'MOCK_PLACEHOLDER',
      message: 'Flight plan saved successfully (MOCK PLACEHOLDER)',
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

// Get User's Flight Plans (Minimal Mock until database logic is implemented)
app.get('/api/flight-plans', authenticateUser, async (req, res) => {
  try {
    // TEMPORARY MOCK: Replace with real Supabase query when implemented
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
      code: 'MOCK_PLACEHOLDER',
      message: 'Flight plans retrieved (MOCK PLACEHOLDER)',
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
  console.log(`✅ Core Weather Endpoints now use REAL API data.`);
  console.log(`⚠️  NOTAMs, PIREPs, and Flight Plans still use MOCK PLACEHOLDERS.`);
});

export default app;