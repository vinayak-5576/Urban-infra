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
  height = '500px'
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
      center: [12.9380, 77.6280],
      zoom: 13,
      zoomControl: true
    });

    // Sleek Dark Map Tiles (CartoDB Dark Matter with OpenStreetMap attribution)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
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

    const zoneColors: Record<string, string> = {
      'zone-koramangala': '#00f0ff',
      'zone-indiranagar': '#a855f7',
      'zone-hsr': '#10b981'
    };

    zones.forEach((zone) => {
      if (zone.geom_geojson && zone.geom_geojson.type === 'Polygon') {
        const coords = zone.geom_geojson.coordinates[0].map(
          (pt: [number, number]) => [pt[1], pt[0]] as [number, number]
        );
        const strokeColor = zoneColors[zone.id] || '#38bdf8';
        const poly = L.polygon(coords, {
          color: strokeColor,
          weight: 2.5,
          fillColor: strokeColor,
          fillOpacity: 0.12,
          dashArray: '5, 8'
        });

        poly.bindTooltip(`
          <div style="font-family:Inter,sans-serif; padding:4px;">
            <div style="font-weight:700; color:${strokeColor}; font-size:12px;">${zone.name}</div>
            <div style="font-size:11px; color:#94a3b8;">${zone.corporation} &bull; Ward ${zone.ward_number || 'Pilot'}</div>
          </div>
        `, {
          sticky: true,
          className: 'glass-panel'
        });
        zonesLayerRef.current?.addLayer(poly);
      }
    });
  }, [zones]);

  // Update Issues Markers with Neon Radar Pulses
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    issues.forEach((issue) => {
      let color = '#10b981';
      let glow = 'rgba(16, 185, 129, 0.4)';
      let pulseAnim = '';

      if (issue.priority_score >= 70) {
        color = '#f43f5e';
        glow = 'rgba(244, 63, 94, 0.5)';
        pulseAnim = 'animation: pulse 1.8s infinite;';
      } else if (issue.priority_score >= 45) {
        color = '#f59e0b';
        glow = 'rgba(245, 158, 11, 0.5)';
      }

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: ${glow};
              ${pulseAnim}
            "></div>
            <div style="
              position: relative;
              background: #0f172a;
              color: #f8fafc;
              border: 2px solid ${color};
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 11px;
              font-family: Outfit, sans-serif;
              box-shadow: 0 0 16px ${color};
              cursor: pointer;
            ">
              ${Math.round(issue.priority_score)}
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon });

      const popupContent = `
        <div style="min-width: 240px; font-family: Inter, sans-serif; padding: 6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em;">
              ${issue.category_id.replace('cat-', '')}
            </span>
            <span style="
              font-size: 10px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 9999px;
              background: rgba(255,255,255,0.08);
              color: #f8fafc;
              border: 1px solid rgba(255,255,255,0.15);
              text-transform: uppercase;
            ">
              ${issue.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <div style="
              font-size: 1.4rem;
              font-weight: 800;
              color: ${color};
              font-family: Outfit, sans-serif;
            ">
              ${issue.priority_score}
            </div>
            <div style="font-size:11px; color:#94a3b8; line-height:1.3;">
              <b>Explainable Priority</b><br/>
              Ranked #${issues.indexOf(issue) + 1} in civic queue
            </div>
          </div>

          <div style="font-size:12px; color:#cbd5e1; margin-bottom:6px; background:rgba(255,255,255,0.04); padding:6px 8px; borderRadius:6px;">
            Corroborated by <b>${issue.report_count}</b> linked citizen reports
          </div>

          <div style="display:flex; justify-content:space-between; font-size:10px; color:#64748b;">
            <span>ID: ${issue.id.slice(0, 8)}...</span>
            ${issue.reopen_count > 0 ? `<span style="color:#fb7185; font-weight:700;">Reopened ${issue.reopen_count}x</span>` : ''}
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
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                position: absolute;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: rgba(0, 240, 255, 0.4);
                animation: pulse 1.5s infinite;
              "></div>
              <div style="
                width: 16px;
                height: 16px;
                background: #00f0ff;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 16px #00f0ff;
              "></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
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
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
