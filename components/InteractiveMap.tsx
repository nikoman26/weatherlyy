import React, { useEffect, useRef } from 'react';
import { useWeatherStore } from '../store/weatherStore.ts';
import { Layers } from 'lucide-react';

// Declare Leaflet global type to avoid TS errors since we loaded via script tag
declare global {
  interface Window {
    L: any;
  }
}

interface InteractiveMapProps {
    className?: string;
    onClick?: (lat: number, lng: number) => void;
    enablePirepMarkers?: boolean;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ className, onClick, enablePirepMarkers }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null); // To hold dynamic markers/polylines

  const { activeFlightPlan, airportDetails, user, pireps } = useWeatherStore();

  // Configuration for API Keys (These are placeholders for the frontend)
  const OPENWEATHER_API_KEY = 'YOUR_OWM_API_KEY'; 
  const OPENAIP_API_KEY = 'YOUR_OPENAIP_API_KEY'; 

  // Initialize Map Base
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;

    // 1. Initialize Map
    const map = L.map(mapContainerRef.current).setView([40, -50], 3);
    mapInstanceRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    // Click handler for PIREP submission
    if (onClick) {
        map.on('click', (e: any) => {
            onClick(e.latlng.lat, e.latlng.lng);
        });
        map.getContainer().style.cursor = 'crosshair';
    }
    
    // 2. Base Layers
    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    });

    const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM'
    });

    cartoDark.addTo(map);

    // 3. Weather Layers
    const cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`, {
      maxZoom: 18,
      attribution: 'OWM'
    });
    
    const precipLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`, {
        maxZoom: 18,
        attribution: 'OWM'
    });

    // 4. Aviation Layers (OpenAIP)
    const openAipAirspace = L.tileLayer(`https://api.tiles.openaip.net/api/data/airspaces/{z}/{x}/{y}.png?apiKey=${OPENAIP_API_KEY}`, {
      maxZoom: 14,
      minZoom: 4,
      attribution: 'OpenAIP'
    });

    // 5. Layer Controls
    const baseMaps = {
      "Dark Mode": cartoDark,
      "Standard": openStreetMap
    };

    const overlayMaps = {
      "Clouds": cloudsLayer,
      "Precipitation": precipLayer,
      "Airspace": openAipAirspace,
    };

    L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Legend
    const info = L.control({ position: 'bottomleft' });
    info.onAdd = function () {
      const div = L.DomUtil.create('div', 'info');
      div.style.padding = '10px';
      div.style.background = 'rgba(15, 23, 42, 0.9)';
      div.style.color = 'white';
      div.style.borderRadius = '8px';
      div.style.border = '1px solid #334155';
      div.innerHTML = `
        <h4 style="margin:0 0 5px 0; font-weight:bold; font-size: 14px;">Flight Chart</h4>
        <div style="font-size:12px; opacity:0.8;">
           <div style="display:flex; align-items:center; gap:5px; margin-bottom:2px;"><span style="width:10px; height:10px; border-radius:50%; background:#0ea5e9;"></span> Airport</div>
           <div style="display:flex; align-items:center; gap:5px; margin-bottom:2px;"><span style="width:20px; height:2px; background:#eab308;"></span> Active Route</div>
           ${enablePirepMarkers ? '<div style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; border-radius:50%; background:#f59e0b;"></span> PIREP</div>' : ''}
        </div>
      `;
      return div;
    };
    info.addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Only run once on mount

  // Handle Dynamic Data (Markers & Routes)
  useEffect(() => {
      const map = mapInstanceRef.current;
      const layers = layerGroupRef.current;
      const L = window.L;

      if (!map || !layers) return;

      layers.clearLayers();

      const markers: any[] = [];
      const routePoints: any[] = [];

      // Helper to add marker
      const addAirportMarker = (icao: string, color = '#0ea5e9') => {
          const details = airportDetails[icao];
          if (details && details.latitude && details.longitude) {
              const marker = L.circleMarker([details.latitude, details.longitude], {
                  radius: 6,
                  fillColor: color,
                  color: '#fff',
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.8
              }).bindPopup(`
                  <div class="text-slate-900">
                      <strong style="font-size:14px;">${icao}</strong><br/>
                      ${details.name}
                  </div>
              `);
              marker.addTo(layers);
              markers.push(marker);
              return [details.latitude, details.longitude];
          }
          return null;
      };

      // 1. Plot PIREPs if enabled
      if (enablePirepMarkers) {
          pireps.forEach(p => {
              L.circleMarker([p.aircraft_position.latitude, p.aircraft_position.longitude], {
                  radius: 5,
                  fillColor: '#f59e0b', // Amber
                  color: '#fff',
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.9
              }).bindPopup(`
                  <div class="text-slate-900 text-sm">
                      <strong>${p.aircraft_type} @ FL${p.flight_level}</strong><br/>
                      Turb: ${p.turbulence}<br/>
                      Icing: ${p.icing}<br/>
                      <em>${new Date(p.submitted_at).toLocaleTimeString()}</em>
                  </div>
              `).addTo(layers);
          });
      }

      // 2. Plot Flight Plan if active
      if (activeFlightPlan && !onClick) {
          const depCoords = addAirportMarker(activeFlightPlan.departure.icao, '#22c55e'); // Green for departure
          const destCoords = addAirportMarker(activeFlightPlan.destination.icao, '#ef4444'); // Red for destination

          if (depCoords) routePoints.push(depCoords);
          if (destCoords) routePoints.push(destCoords);

          if (depCoords && destCoords) {
              // Draw line
              const polyline = L.polyline([depCoords, destCoords], {
                  color: '#eab308', // Yellow
                  weight: 3,
                  opacity: 0.8,
                  dashArray: '10, 10'
              }).addTo(layers);
              
              // Fit bounds to route
              map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          }
      } else if (!enablePirepMarkers) {
          // 3. Plot all currently loaded airport details (from bulk fetch or favorites)
          Object.keys(airportDetails).forEach(icao => {
              const isFav = user?.favoriteAirports.includes(icao);
              const isRoute = activeFlightPlan && (activeFlightPlan.departure.icao === icao || activeFlightPlan.destination.icao === icao);
              
              let color = '#8b5cf6'; // Purple for dynamically loaded
              if (isFav) color = '#0ea5e9'; // Blue for favorites
              if (isRoute) {
                  if (activeFlightPlan.departure.icao === icao) color = '#22c55e'; // Green for departure
                  if (activeFlightPlan.destination.icao === icao) color = '#ef4444'; // Red for destination
              }
              
              addAirportMarker(icao, color);
          });
      }

  }, [activeFlightPlan, airportDetails, user, pireps, enablePirepMarkers]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl ${className || 'h-full'}`}>
      <div id="map-container" ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Overlay to show if keys are missing (Helper for demo) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-full text-xs text-slate-400 flex items-center gap-2">
           <Layers size={14} /> OpenWeatherMap & OpenAIP Layers
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;