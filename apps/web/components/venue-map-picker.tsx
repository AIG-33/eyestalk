'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface VenueMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  geofenceRadius: number;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  searchPlaceholder?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function VenueMapPicker({
  latitude,
  longitude,
  geofenceRadius,
  onLocationSelect,
  searchPlaceholder = 'Search address or venue name...',
}: VenueMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateMarker = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        className: 'venue-marker',
        html: `<div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #7C6FF7, #A29BFE);
          border: 3px solid #fff;
          box-shadow: 0 0 16px rgba(124,111,247,0.5);
          display: flex; align-items: center; justify-content: center;
        "><div style="width:8px;height:8px;border-radius:50%;background:#fff;"></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    }

    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(geofenceRadius);
    } else {
      circleRef.current = L.circle([lat, lng], {
        radius: geofenceRadius,
        color: '#7C6FF7',
        fillColor: '#7C6FF7',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6 4',
      }).addTo(map);
    }

    map.flyTo([lat, lng], 16, { duration: 0.8 });
  }, [geofenceRadius]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = latitude && longitude
      ? [latitude, longitude]
      : [55.7558, 37.6173];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: latitude ? 16 : 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    const BrandControl = L.Control.extend({
      onAdd() {
        const div = L.DomUtil.create('div');
        div.innerHTML = '<span style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:600;letter-spacing:0.5px;">EyesTalk</span>';
        return div;
      },
    });
    new BrandControl({ position: 'bottomleft' }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
      reverseGeocode(lat, lng);
    });

    mapRef.current = map;

    if (latitude && longitude) {
      updateMarker(latitude, longitude);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(geofenceRadius);
    }
  }, [geofenceRadius]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'ru,en' } }
      );
      const data = await res.json();
      if (data.display_name) {
        onLocationSelect(lat, lng, data.display_name);
      } else {
        onLocationSelect(lat, lng);
      }
    } catch {
      onLocationSelect(lat, lng);
    }
  };

  const searchAddress = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'ru,en' } }
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(value), 400);
  };

  const handleResultSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setQuery(result.display_name);
    setResults([]);
    updateMarker(lat, lng);
    onLocationSelect(lat, lng, result.display_name);
  };

  return (
    <div>
      {/* Search — above map with higher stacking context */}
      <div style={{ position: 'relative', zIndex: 1000, marginBottom: 12 }}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-tertiary)' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            className="input-field pl-10"
            style={{ width: '100%' }}
          />
          {searching && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--text-tertiary)', borderTopColor: 'var(--accent-primary)' }}
            />
          )}
        </div>

        {results.length > 0 && (
          <div
            className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto"
            style={{
              zIndex: 1100,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleResultSelect(r)}
                className="w-full text-left px-4 py-3 text-sm transition-colors"
                style={{
                  color: 'var(--text-primary)',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(124,111,247,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span className="mr-2">📍</span>
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map — lower stacking context */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          ref={mapContainerRef}
          className="rounded-2xl overflow-hidden"
          style={{
            height: 400,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </div>

      {/* Hint */}
      <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
        Click on the map to set the exact venue location, or use search above
      </p>
    </div>
  );
}
