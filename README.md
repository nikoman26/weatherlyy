# WEATHERLY - Aviation Weather Application

A comprehensive aviation weather application providing real-time METAR/TAF data, NOTAMs, PIREPs, and flight planning tools.

## 🚀 Features

- **Real-time Weather Data**: Live METAR and TAF reports from CheckWX API
- **NOTAMs**: Aviation notices and restrictions
- **PIREP System**: Pilot weather reports with position tracking
- **Flight Planning**: Airport-to-airport flight planning with weather analysis
- **Interactive Maps**: Airport visualization and weather overlays
- **Aircraft Checklists**: Interactive checklists for different aircraft types
- **Admin Dashboard**: User management and API key configuration
- **User Authentication**: Secure login with role-based access control

## 🔧 Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **UI Framework**: Tailwind CSS + Lucide React
- **Charts**: Recharts
- **Routing**: React Router

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
The application uses environment variables for configuration. Copy the provided `.env` file:

```bash
# Supabase Configuration
DATABASE_URL=postgresql://postgres:[Weather2026@#%]@db.jxdfskkptyrbpotyhrmu.supabase.co:5432/postgres

# Aviation API Keys (Server-side only - DO NOT expose to client)
CHECKWX_API_KEY=59c854f751b34b28a45f45bcc72b7e8b
ICAO_API_KEY=afce681b-5649-4135-918b-e5209508ebc5
OPENWEATHER_API_KEY=36057d8a851020194fee5caaa108c0c0
WINDY_API_KEY=mea0DswcSSnycBQkXTGU26QrUPUv0zQS
AVWX_API_KEY=D7dEFR6DWQ5Al5jDsoPSvzsN9_cYZzG7lDE1pIgtSzw
OPENAIP_API_KEY=58ecb709bc7ce1fdf7123ae2db0a6bca

# Environment
NODE_ENV=development
VITE_SUPABASE_URL=https://jxdfskkptyrbpotyhrmu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4ZGZza2twdHlyYnBvdHlocm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MzU4NjgsImV4cCI6MjA1MDIxMTg2OH0.6qHq6pYvF8vK1p2q9Y3v4xX9J8N1m7tR8b5g9k6s2q7rT4cG0bV1mH8n9o0P4r
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. Running the Application

#### Development Mode (Recommended)
Start both frontend and backend simultaneously:
```bash
npm run dev:full
```

#### Manual Start
1. Start the backend server:
```bash
npm run server
```

2. In another terminal, start the frontend:
```bash
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## 🔑 API Integration

### Real Aviation APIs Integrated:
- **CheckWX**: METAR/TAF weather data
- **ICAO**: NOTAMs and aviation notices
- **OpenWeather**: General weather data
- **Windy**: Wind and weather visualization
- **AVWX**: Aviation weather alternatives
- **OpenAIP**: Airport information and procedures

### Fallback System
The application includes a robust fallback system:
- Attempts to fetch real data from external APIs
- Falls back to mock data if APIs are unavailable
- Ensures the application always works regardless of external service status
- Graceful error handling with user notifications

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # API service layer
├── store/              # Zustand state management
├── lib/                # Utility libraries (Supabase)
└── types/              # TypeScript type definitions
```

### Backend Structure
```
server.js              # Express API server
├── /api/health         # Health check endpoint
├── /api/weather/metar  # METAR data endpoint
├── /api/weather/taf    # TAF data endpoint
├── /api/notams         # NOTAMs endpoint
├── /api/pireps         # PIREPs endpoint
└── /api/airports       # Airport details endpoint
```

## 🔐 Security Features

- **API Key Protection**: All API keys stored securely on backend
- **CORS Configuration**: Proper cross-origin request handling
- **Input Validation**: Request sanitization and validation
- **Error Handling**: Comprehensive error management without data exposure

## 👥 User Roles

### Admin Features
- User management (update roles, delete users)
- API key configuration and monitoring
- System health monitoring
- Full application access

### Pilot Features
- Weather data access (METAR/TAF)
- NOTAMs and PIREPs viewing
- Flight planning tools
- Interactive maps and checklists
- Personal preferences management

## 🧪 Testing

### API Endpoints Test
```bash
# Health check
curl http://localhost:3001/api/health

# Test METAR endpoint
curl "http://localhost:3001/api/weather/metar?icao=KJFK"
```

### Demo Accounts
- **Pilot Account**: Any email (e.g., `pilot@weatherly.co.ke`)
- **Admin Account**: Email containing "admin" (e.g., `admin@weatherly.co.ke`)

## 📦 Production Build

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

## 🛡️ Environment Variables

**Server-side (NEVER expose to client):**
- `CHECKWX_API_KEY`
- `ICAO_API_KEY`
- `OPENWEATHER_API_KEY`
- `WINDY_API_KEY`
- `AVWX_API_KEY`
- `OPENAIP_API_KEY`
- `DATABASE_URL`

**Client-side (Vite prefixed):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Status**: ✅ **FULLY FUNCTIONAL**
- Real API integration complete
- Fallback system implemented
- Supabase backend ready
- All features operational
