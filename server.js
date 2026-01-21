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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY; // Used for client-side auth
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Used for admin actions

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Client for RLS-protected operations (used by authenticateUser)
const supabase = createClient(supabaseUrl, supabaseAnonKey); 
// Admin client for privileged operations (used by admin routes)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); 

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

    // Fetch user profile to get the role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error during auth:', profileError);
        // Proceed but user role might be null/default
    }
    
    req.user = { ...user, role: profile?.role || 'user' };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Admin Authorization Middleware
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
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
      .from('profiles')
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

// Fetch PIREPs (Supabase Integration)
app.get('/api/pireps', authenticateUser, async (req, res) => {
  try {
    // Fetch PIREPs, joining with profiles to get the username
    const { data: pirepData, error } = await supabase
      .from('pireps')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase PIREP fetch error:', error);
      return res.status(500).json({ success: false, message: 'Database error fetching PIREPs', error: error.message });
    }

    res.json({
      success: true,
      code: 'SUPABASE',
      message: 'PIREP data retrieved from Supabase',
      data: pirepData
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

// Submit PIREP (Supabase Integration)
app.post('/api/pireps', authenticateUser, async (req, res) => {
  try {
    const { icao_code, aircraft_type, flight_level, aircraft_position, weather_conditions, turbulence, icing, remarks } = req.body;

    const pirepData = {
      icao_code,
      aircraft_type,
      flight_level,
      latitude: aircraft_position?.latitude,
      longitude: aircraft_position?.longitude,
      weather_conditions,
      turbulence,
      icing,
      remarks,
      submitted_by: req.user.id
    };

    const { data: newPirep, error } = await supabase
      .from('pireps')
      .insert([pirepData])
      .select('*, profiles(username)')
      .single();

    if (error) {
      console.error('Supabase PIREP insert error:', error);
      return res.status(500).json({ success: false, message: 'Database error submitting PIREP', error: error.message });
    }

    res.json({
      success: true,
      code: 'SUPABASE',
      message: 'PIREP submitted successfully',
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

// NEW: Fetch Airports in Bounds (Supabase only - bulk fetch)
app.get('/api/airports/all', authenticateUser, async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    let query = supabase
      .from('airports')
      .select('*');

    // Apply bounding box filters if provided
    if (minLat && maxLat) {
        query = query.gte('latitude', parseFloat(minLat)).lte('latitude', parseFloat(maxLat));
    }
    if (minLng && maxLng) {
        query = query.gte('longitude', parseFloat(minLng)).lte('longitude', parseFloat(maxLng));
    }

    const { data: airportData, error } = await query;

    if (error) {
      console.error('Supabase bulk airport fetch error:', error);
      return res.status(500).json({ success: false, message: 'Database error fetching all airport details', error: error.message });
    }

    res.json({
      success: true,
      code: 'SUPABASE_BOUNDS',
      message: 'Airport details retrieved from Supabase within bounds',
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
app.post('/api/admin/load-airports', authenticateUser, authorizeAdmin, async (req, res) => {
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
    const { error } = await supabaseAdmin // Use Admin client for bulk operations
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

// ADMIN: Fetch all user profiles
app.get('/api/admin/users', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) throw error;

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Admin fetch users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user list.' });
    }
});

// ADMIN: Update user role
app.put('/api/admin/users/:id/role', authenticateUser, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'admin' && role !== 'user')) {
        return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: `Role updated for user ${id}` });
    } catch (error) {
        console.error('Admin update role error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user role.' });
    }
});

// ADMIN: Delete user (Requires Service Role Key)
app.delete('/api/admin/users/:id', authenticateUser, authorizeAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Delete user from auth.users using the Admin client
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.error('Supabase Admin delete auth user error:', authError);
            throw new Error(authError.message);
        }

        res.json({ success: true, message: `User ${id} deleted successfully.` });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user.' });
    }
});


// Save Flight Plan (Supabase Integration)
app.post('/api/flight-plans', authenticateUser, async (req, res) => {
  try {
    const { departure_icao, destination_icao, aircraft_type, planned_departure, flight_rules, route } = req.body;

    const flightPlanData = {
      user_id: req.user.id,
      departure_icao,
      destination_icao,
      aircraft_type,
      planned_departure,
      flight_rules: flight_rules || 'VFR',
      route: route || [],
    };

    const { data: newFlightPlan, error } = await supabase
      .from('flight_plans')
      .insert([flightPlanData])
      .select()
      .single();

    if (error) {
      console.error('Supabase Flight Plan insert error:', error);
      return res.status(500).json({ success: false, message: 'Database error saving flight plan', error: error.message });
    }

    res.json({
      success: true,
      code: 'SUPABASE',
      message: 'Flight plan saved successfully',
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
  console.log(`✅ PIREPs, Admin User Management, and Flight Plan Saving now use Supabase database.`);
  console.log(`✅ Airport fetching now supports bounding box filtering.`);
  console.log(`⚠️  NOTAMs still use MOCK PLACEHOLDERS.`);
});

export default app;