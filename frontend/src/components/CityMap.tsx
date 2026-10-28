import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Issue, Zone } from '../types';

interface CityMapProps {
  issues?: Issue[];
  zones?: Zone[];
  selectedLocation?: { lat: number; lon: number } | null;
  onLocationSelect?: (lat: number, lon: number) => void;
  interactiveSelect?: boolean;
  height?: string;
}

export const CityMap: React.FC<CityMapProps> = ({
  issues = [],
  zones = [],
  selectedLocation,
  onLocationSelect,
  interactiveSelect = false,
  height = '480px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Koramangala, Bengaluru
    const map = L.map(mapContainerRef.current, {
      center: [12.9352, 77.6245],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    zonesLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    if (interactiveSelect && onLocationSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Zones
  useEffect(() => {
    if (!mapInstanceRef.current || !zonesLayerRef.current) return;
    zonesLayerRef.current.clearLayers();

    zones.forEach((zone) => {
      if (zone.geom_geojson && zone.geom_geojson.type === 'Polygon') {
        const coords = zone.geom_geojson.coordinates[0].map(
          (pt: [number, number]) => [pt[1], pt[0]] as [number, number]
        );
        const poly = L.polygon(coords, {
          color: '#38bdf8',
          weight: 2,
          fillColor: '#0284c7',
          fillOpacity: 0.12,
          dashArray: '4, 6'
        });
        poly.bindTooltip(`<b>${zone.name}</b><br/><span style="color:#94a3b8">${zone.corporation}</span>`, {
          sticky: true,
          className: 'glass-panel'
        });
        zonesLayerRef.current?.addLayer(poly);
      }
    });
  }, [zones]);

  // Update Issues Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    issues.forEach((issue) => {
      // Determine color by priority
      let color = '#10b981';
      if (issue.priority_score >= 70) color = '#f43f5e';
      else if (issue.priority_score >= 45) color = '#f59e0b';

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background: ${color};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 11px;
            box-shadow: 0 0 12px ${color};
            border: 2px solid #ffffff;
            cursor: pointer;
          ">
            ${Math.round(issue.priority_score)}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon });

      const statusBadge = `
        <span style="
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(255,255,255,0.1);
          color: #f8fafc;
          border: 1px solid rgba(255,255,255,0.2);
        ">
          ${issue.status.replace(/_/g, ' ').toUpperCase()}
        </span>
      `;

      const popupContent = `
        <div style="min-width: 220px; font-family: Inter, sans-serif;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:12px; font-weight:700; color:#38bdf8;">${issue.category_id.replace('cat-', '').toUpperCase()}</span>
            ${statusBadge}
          </div>
          <div style="font-size:14px; font-weight:600; color:#f8fafc; margin-bottom:6px;">
            Priority Score: <span style="color:${color}; font-weight:700;">${issue.priority_score}/100</span>
          </div>
          <div style="font-size:12px; color:#94a3b8; margin-bottom:4px;">
            Corroborated by: <b>${issue.report_count}</b> reports
          </div>
          <div style="font-size:11px; color:#64748b;">
            Tracked ID: ${issue.id.slice(0, 8)}...
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayerRef.current?.addLayer(marker);
    });
  }, [issues]);

  // Update Reporting Selected Pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedLocation) {
      if (!pinMarkerRef.current) {
        const pinIcon = L.divIcon({
          className: 'selected-pin',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background: #38bdf8;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 15px #38bdf8;
              animation: pulse 1.5s infinite;
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        pinMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lon], {
          icon: pinIcon,
          draggable: interactiveSelect
        }).addTo(mapInstanceRef.current);

        if (interactiveSelect && onLocationSelect) {
          pinMarkerRef.current.on('dragend', (e: any) => {
            const pos = e.target.getLatLng();
            onLocationSelect(pos.lat, pos.lng);
          });
        }
      } else {
        pinMarkerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lon]);
      }
      mapInstanceRef.current.panTo([selectedLocation.lat, selectedLocation.lon]);
    } else if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }
  }, [selectedLocation, interactiveSelect]);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '16px', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
