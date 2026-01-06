CREATE TABLE IF NOT EXISTS airports (
    icao TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    elevation INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    runways JSONB,
    frequencies JSONB,
    procedures JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example index for searching by ICAO
CREATE INDEX IF NOT EXISTS idx_airports_icao ON airports (icao);