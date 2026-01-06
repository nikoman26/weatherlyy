import { MetarData, TafData, Notam, Pirep, AirportDetails, AircraftChecklist } from '../types.ts';

export const MOCK_METARS: Record<string, MetarData> = {
  'KJFK': {
    station: 'KJFK',
    raw_text: 'KJFK 041800Z 27015G25KT 10SM FEW025 22/15 A2992 RMK AO2 SLP132 T02220150',
    observed: new Date().toISOString(),
    wind: { direction_degrees: 270, speed_kts: 15, gust_kts: 25 },
    visibility: { miles: '10', meters: '16093' },
    clouds: [{ cover: 'FEW', base: 2500, text: 'Few at 2500ft' }],
    temperature: { celsius: 22, fahrenheit: 72 },
    dewpoint: { celsius: 15, fahrenheit: 59 },
    altimeter: { hg: 29.92, hpa: 1013 },
    flight_category: 'VFR',
    temp_trend: 'rising',
    wind_trend: 'steady'
  },
  'EGLL': {
    station: 'EGLL',
    raw_text: 'EGLL 041820Z 20008KT 9999 BKN035 15/11 Q1018 NOSIG',
    observed: new Date().toISOString(),
    wind: { direction_degrees: 200, speed_kts: 8 },
    visibility: { miles: '>6', meters: '9999' },
    clouds: [{ cover: 'BKN', base: 3500, text: 'Broken at 3500ft' }],
    temperature: { celsius: 15, fahrenheit: 59 },
    dewpoint: { celsius: 11, fahrenheit: 52 },
    altimeter: { hg: 30.06, hpa: 1018 },
    flight_category: 'MVFR',
    temp_trend: 'falling',
    wind_trend: 'rising'
  },
  'KSFO': {
    station: 'KSFO',
    raw_text: 'KSFO 041856Z 28018KT 10SM OVC012 14/10 A2998 RMK AO2',
    observed: new Date().toISOString(),
    wind: { direction_degrees: 280, speed_kts: 18 },
    visibility: { miles: '10', meters: '16093' },
    clouds: [{ cover: 'OVC', base: 1200, text: 'Overcast at 1200ft' }],
    temperature: { celsius: 14, fahrenheit: 57 },
    dewpoint: { celsius: 10, fahrenheit: 50 },
    altimeter: { hg: 29.98, hpa: 1015 },
    flight_category: 'MVFR',
    temp_trend: 'steady',
    wind_trend: 'falling'
  }
};

export const MOCK_TAFS: Record<string, TafData> = {
  'KJFK': {
    station: 'KJFK',
    raw_text: 'TAF KJFK 041730Z 0418/0524 26015G24KT P6SM FEW040 FM050000 29010KT P6SM SKC',
    issue_time: new Date().toISOString(),
    valid_time_from: new Date().toISOString(),
    valid_time_to: new Date(Date.now() + 86400000).toISOString(),
    forecast: [
      {
        timestamp: { from: new Date().toISOString(), to: new Date(Date.now() + 21600000).toISOString() },
        wind: { direction_degrees: 260, speed_kts: 15, gust_kts: 24 },
        visibility: { miles: 'P6', meters: '>9999' },
        clouds: [{ cover: 'FEW', base: 4000 }]
      },
      {
        timestamp: { from: new Date(Date.now() + 21600000).toISOString(), to: new Date(Date.now() + 86400000).toISOString() },
        wind: { direction_degrees: 290, speed_kts: 10 },
        visibility: { miles: 'P6', meters: '>9999' },
        clouds: [{ cover: 'CLR' }]
      }
    ]
  },
  'EGLL': {
    station: 'EGLL',
    raw_text: 'TAF EGLL 041700Z 0418/0524 21010KT 9999 BKN030 TEMPO 0418/0421 7000 -RA BKN014',
    issue_time: new Date().toISOString(),
    valid_time_from: new Date().toISOString(),
    valid_time_to: new Date(Date.now() + 86400000).toISOString(),
    forecast: [
      {
         timestamp: { from: new Date().toISOString(), to: new Date(Date.now() + 43200000).toISOString() },
         wind: { direction_degrees: 210, speed_kts: 10 },
         visibility: { miles: '>6', meters: '9999' },
         clouds: [{ cover: 'BKN', base: 3000 }]
      },
      {
         type: 'TEMPO',
         timestamp: { from: new Date().toISOString(), to: new Date(Date.now() + 10800000).toISOString() },
         visibility: { miles: '4', meters: '7000' },
         clouds: [{ cover: 'BKN', base: 1400 }]
      }
    ]
  }
};

export const MOCK_NOTAMS: Record<string, Notam[]> = {
  'KJFK': [
    {
      id: 'A1234/25',
      number: 'A1234/25',
      type: 'N',
      location: 'KJFK',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 86400000 * 5).toISOString(),
      text: 'RWY 04L/22R CLSD DUE WIP. MAINT VEHICLES ON TWY A.',
      source: 'AVWX',
      coordinates: { lat: 40.6413, lng: -73.7781 }
    },
    {
      id: 'A1235/25',
      number: 'A1235/25',
      type: 'N',
      location: 'KJFK',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 43200000).toISOString(),
      text: 'OBST TOWER LGT (ASR 10245) 3NM NE OTS.',
      source: 'AVWX',
      coordinates: { lat: 40.6613, lng: -73.7581 }
    }
  ],
  'EGLL': [
    {
        id: 'A5678/25',
        number: 'A5678/25',
        type: 'N',
        location: 'EGLL',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 86400000 * 2).toISOString(),
        text: 'TWY B CLSD BTN TWY A AND TWY C DUE WORK IN PROGRESS',
        source: 'ICAO',
        coordinates: { lat: 51.4700, lng: -0.4543 }
    }
  ]
};

export const MOCK_PIREPS: Pirep[] = [
  {
    id: 1,
    icao_code: 'KJFK',
    aircraft_type: 'B737',
    flight_level: '350',
    aircraft_position: { latitude: 40.7, longitude: -74.0 },
    weather_conditions: 'Clear skies',
    turbulence: 'Light chop',
    icing: 'None',
    submitted_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    icao_code: 'EGLL',
    aircraft_type: 'A320',
    flight_level: '080',
    aircraft_position: { latitude: 51.47, longitude: -0.45 },
    weather_conditions: 'BKN035',
    turbulence: 'Moderate on approach',
    icing: 'Light rime',
    submitted_at: new Date(Date.now() - 1800000).toISOString()
  }
];

export const MOCK_AIRPORT_DETAILS: Record<string, AirportDetails> = {
    'KJFK': {
        icao: 'KJFK',
        name: 'John F. Kennedy International Airport',
        elevation: 13,
        latitude: 40.6413,
        longitude: -73.7781,
        runways: [
            { ident: '04L/22R', length_ft: 12079, width_ft: 200, surface: 'Asphalt/Concrete' },
            { ident: '04R/22L', length_ft: 8400, width_ft: 200, surface: 'Asphalt' },
            { ident: '13L/31R', length_ft: 10000, width_ft: 200, surface: 'Concrete' },
            { ident: '13R/31L', length_ft: 14511, width_ft: 200, surface: 'Concrete' }
        ],
        frequencies: [
            { type: 'TOWER', frequency: '119.10' },
            { type: 'GROUND', frequency: '121.90' },
            { type: 'ATIS', frequency: '128.725' },
            { type: 'APPROACH', frequency: '125.70' }
        ],
        procedures: ['ILS OR LOC RWY 04L', 'ILS OR LOC RWY 13L', 'RNAV (GPS) Y RWY 04R', 'VOR RWY 04L']
    },
    'EGLL': {
        icao: 'EGLL',
        name: 'Heathrow Airport',
        elevation: 83,
        latitude: 51.4700,
        longitude: -0.4543,
        runways: [
            { ident: '09L/27R', length_ft: 12799, width_ft: 164, surface: 'Asphalt' },
            { ident: '09R/27L', length_ft: 12008, width_ft: 164, surface: 'Asphalt' }
        ],
        frequencies: [
            { type: 'TOWER', frequency: '118.50' },
            { type: 'GROUND', frequency: '121.90' },
            { type: 'ATIS', frequency: '128.075' },
            { type: 'DIRECTOR', frequency: '119.725' }
        ],
        procedures: ['ILS RWY 27L', 'ILS RWY 27R', 'RNAV (GNSS) RWY 09L']
    },
    'KSFO': {
        icao: 'KSFO',
        name: 'San Francisco International Airport',
        elevation: 13,
        latitude: 37.6188,
        longitude: -122.3754,
        runways: [
            { ident: '10L/28R', length_ft: 11870, width_ft: 200, surface: 'Asphalt' },
            { ident: '10R/28L', length_ft: 11381, width_ft: 200, surface: 'Asphalt' }
        ],
        frequencies: [
             { type: 'TOWER', frequency: '120.50' },
             { type: 'ATIS', frequency: '113.7' }
        ],
        procedures: ['ILS RWY 28R', 'RNAV (GPS) RWY 10L']
    }
};

export const MOCK_CHECKLISTS: AircraftChecklist[] = [
  {
    aircraftId: 'C172S',
    name: 'Cessna 172S Skyhawk',
    checklists: [
      {
        id: 'c172-preflight',
        title: 'Preflight Inspection (Cabin)',
        category: 'Normal',
        items: [
          { id: '1', challenge: 'Pilot\'s Operating Handbook', response: 'ACCESSIBLE' },
          { id: '2', challenge: 'Control Wheel Lock', response: 'REMOVE' },
          { id: '3', challenge: 'Ignition Switch', response: 'OFF' },
          { id: '4', challenge: 'Avionics Switch', response: 'OFF' },
          { id: '5', challenge: 'Master Switch', response: 'ON' }
        ]
      },
      {
        id: 'c172-start',
        title: 'Engine Start',
        category: 'Normal',
        items: [
          { id: '1', challenge: 'Throttle', response: 'OPEN 1/4 INCH' },
          { id: '2', challenge: 'Mixture', response: 'IDLE CUTOFF' },
          { id: '3', challenge: 'Propeller Area', response: 'CLEAR' },
          { id: '4', challenge: 'Master Switch', response: 'ON' },
          { id: '5', challenge: 'Ignition', response: 'START' }
        ]
      },
      {
        id: 'c172-fire-start',
        title: 'Engine Fire During Start',
        category: 'Emergency',
        items: [
          { id: '1', challenge: 'Cranking', response: 'CONTINUE' },
          { id: '2', challenge: 'If Engine Starts', response: 'POWER 1700 RPM' },
          { id: '3', challenge: 'Engine', response: 'SHUTDOWN' },
          { id: '4', challenge: 'Fire Extinguisher', response: 'ACTIVATE' }
        ]
      }
    ]
  },
  {
    aircraftId: 'B737',
    name: 'Boeing 737-800',
    checklists: [
      {
        id: 'b737-preflight',
        title: 'Preflight Procedure',
        category: 'Normal',
        items: [
          { id: '1', challenge: 'Oxygen', response: 'TESTED, 100%' },
          { id: '2', challenge: 'Navigation Transfer & Display Switches', response: 'NORMAL, AUTO' },
          { id: '3', challenge: 'Window Heat', response: 'ON' },
          { id: '4', challenge: 'Pressurization Mode Selector', response: 'AUTO' },
          { id: '5', challenge: 'Flight Instruments', response: 'HEADING, ALTIMETER CHECKED' }
        ]
      }
    ]
  }
];