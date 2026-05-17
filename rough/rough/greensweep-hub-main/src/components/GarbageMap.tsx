import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle } from 'lucide-react';

interface GarbageReport {
  id: number;
  lat: number;
  lng: number;
  location: string;
  status: 'pending' | 'verified' | 'resolved';
  date: string;
  reporter: string;
}

const mockReports: GarbageReport[] = [
  { id: 1, lat: 28.6139, lng: 77.2090, location: "Connaught Place, Delhi", status: "verified", date: "2024-01-15", reporter: "Amit S." },
  { id: 2, lat: 28.6280, lng: 77.2197, location: "Kashmere Gate, Delhi", status: "pending", date: "2024-01-14", reporter: "Priya M." },
  { id: 3, lat: 28.5921, lng: 77.2295, location: "India Gate, Delhi", status: "resolved", date: "2024-01-12", reporter: "Raj K." },
  { id: 4, lat: 28.6562, lng: 77.2410, location: "Civil Lines, Delhi", status: "verified", date: "2024-01-10", reporter: "Sneha P." },
  { id: 5, lat: 28.5494, lng: 77.2001, location: "Hauz Khas, Delhi", status: "pending", date: "2024-01-13", reporter: "Vikram T." },
  { id: 6, lat: 28.6304, lng: 77.2177, location: "Old Delhi Railway Station", status: "verified", date: "2024-01-11", reporter: "Neha G." },
  { id: 7, lat: 28.5733, lng: 77.2588, location: "Nizamuddin, Delhi", status: "resolved", date: "2024-01-09", reporter: "Arjun B." },
  { id: 8, lat: 28.6448, lng: 77.2167, location: "Chandni Chowk, Delhi", status: "pending", date: "2024-01-16", reporter: "Maya R." },
];

const GarbageMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState(localStorage.getItem('mapbox_token') || '');
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GarbageReport | null>(null);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    localStorage.setItem('mapbox_token', mapboxToken);
    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [77.2090, 28.6139],
        zoom: 11,
        pitch: 30,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsMapReady(true);
        addMarkers();
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const addMarkers = () => {
    if (!map.current) return;

    mockReports.forEach((report) => {
      const markerColor = 
        report.status === 'resolved' ? '#22c55e' :
        report.status === 'verified' ? '#eab308' :
        '#ef4444';

      const el = document.createElement('div');
      el.className = 'garbage-marker';
      el.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: ${markerColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });
      el.addEventListener('click', () => {
        setSelectedReport(report);
        map.current?.flyTo({
          center: [report.lng, report.lat],
          zoom: 14,
        });
      });

      new mapboxgl.Marker({ element: el })
        .setLngLat([report.lng, report.lat])
        .addTo(map.current!);
    });
  };

  useEffect(() => {
    if (mapboxToken && localStorage.getItem('mapbox_token')) {
      initializeMap();
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  if (!localStorage.getItem('mapbox_token') && !isMapReady) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/50 rounded-2xl p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Configure Map Access</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Enter your Mapbox public token to view the garbage report map. 
            Get your free token at{' '}
            <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              mapbox.com
            </a>
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="pk.eyJ1Ij..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="flex-1"
            />
            <Button variant="hero" onClick={initializeMap} disabled={!mapboxToken}>
              Load Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-2xl overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-card border border-border">
        <h4 className="font-semibold text-foreground mb-3 text-sm">Report Status</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Pending Review</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Verified</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Resolved</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-16 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-card border border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-red-500">
              {mockReports.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-500">
              {mockReports.filter(r => r.status === 'verified').length}
            </div>
            <div className="text-xs text-muted-foreground">Verified</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-500">
              {mockReports.filter(r => r.status === 'resolved').length}
            </div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>
      </div>

      {/* Selected Report Card */}
      {selectedReport && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-card border border-border animate-fade-in-up">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusStyles(selectedReport.status)}`}>
                {selectedReport.status}
              </span>
            </div>
            <button 
              onClick={() => setSelectedReport(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
          <h4 className="font-semibold text-foreground mb-1">{selectedReport.location}</h4>
          <p className="text-sm text-muted-foreground mb-2">Reported by {selectedReport.reporter}</p>
          <p className="text-xs text-muted-foreground">{selectedReport.date}</p>
          {selectedReport.status !== 'resolved' && (
            <Button variant="hero" size="sm" className="w-full mt-3">
              Assign Worker
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default GarbageMap;
