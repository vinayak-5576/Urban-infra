import React, { useState } from 'react';
import { Issue, Zone, Category } from '../types';
import { CityMap } from '../components/CityMap';
import {
  MapPin, Filter, AlertTriangle, Layers, ArrowRight, Search, Activity,
  Shield, CheckCircle, Clock
} from 'lucide-react';

interface CityMapViewProps {
  issues: Issue[];
  zones: Zone[];
  categories: Category[];
  onNavigateToReport: () => void;
}

export const CityMapView: React.FC<CityMapViewProps> = ({
  issues,
  zones,
  categories,
  onNavigateToReport
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssuePin, setSelectedIssuePin] = useState<{ lat: number; lon: number } | null>(null);

  const filteredIssues = issues.filter((i) => {
    if (selectedZone && i.zone_id !== selectedZone) return false;
    if (selectedCategory && i.category_id !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCat = i.category_id.toLowerCase().includes(q);
      const matchZone = i.zone_id.toLowerCase().includes(q);
      if (!matchCat && !matchZone) return false;
    }
    return true;
  });

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : catId;
  };

  const getZoneName = (zoneId: string) => {
    const z = zones.find((zone) => zone.id === zoneId);
    return z ? z.name : zoneId;
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 20px' }} className="animate-fade-in">
      {/* Header with Stats & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Real-Time Civic Radar
            </span>
            <span style={{ color: '#475569' }}>&bull;</span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {issues.length} Issues Tracked ({issues.reduce((acc, curr) => acc + curr.report_count, 0)} Linked Reports)
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Bengaluru Pilot Infrastructure Grid
          </h1>
        </div>

        <button className="btn btn-primary" onClick={onNavigateToReport} style={{ padding: '12px 20px' }}>
          <AlertTriangle size={18} /> File Ground Observation
        </button>
      </div>

      {/* Main Grid: Map + Side Interactive Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', minHeight: '620px' }}>
        {/* Left: Map with Filter Overlays */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Quick Filter Bar */}
          <div className="glass-panel" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700 }}>
              <Filter size={15} /> PILOT ZONE:
            </div>

            <button
              className={`btn btn-sm ${selectedZone === '' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setSelectedZone(''); setSelectedIssuePin(null); }}
            >
              All Zones ({issues.length})
            </button>

            {zones.map((z) => {
              const count = issues.filter((i) => i.zone_id === z.id).length;
              return (
                <button
                  key={z.id}
                  className={`btn btn-sm ${selectedZone === z.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setSelectedZone(z.id);
                    if (z.geom_geojson?.coordinates?.[0]?.[0]) {
                      const coord = z.geom_geojson.coordinates[0][0];
                      setSelectedIssuePin({ lat: coord[1], lon: coord[0] });
                    }
                  }}
                >
                  {z.name.replace(' Pilot Zone', '')} ({count})
                </button>
              );
            })}
          </div>

          {/* Leaflet Map Canvas */}
          <div className="glass-panel" style={{ padding: '8px', flex: 1, minHeight: '540px', display: 'flex', flexDirection: 'column' }}>
            <CityMap
              issues={filteredIssues}
              zones={zones}
              selectedLocation={selectedIssuePin}
              height="540px"
            />
          </div>
        </div>

        {/* Right: Live Issue Feed & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search Box */}
          <div className="glass-panel" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Search category, zone or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.88rem',
                width: '100%'
              }}
            />
          </div>

          {/* Incidents Feed Panel */}
          <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '530px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="#00f0ff" /> Tracked Incidents Queue
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {filteredIssues.length} active
              </span>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {filteredIssues.map((issue) => {
                let dialClass = 'priority-dial-low';
                if (issue.priority_score >= 70) dialClass = 'priority-dial-high';
                else if (issue.priority_score >= 45) dialClass = 'priority-dial-mid';

                return (
                  <div
                    key={issue.id}
                    className="glass-card-interactive"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setSelectedIssuePin({ lat: issue.latitude, lon: issue.longitude })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {getCategoryName(issue.category_id)}
                      </span>
                      <div className={`priority-dial ${dialClass}`} style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                        {Math.round(issue.priority_score)}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                      {getZoneName(issue.zone_id)}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Corroboration: <b>{issue.report_count}</b> reports</span>
                      <span className={`badge badge-${issue.status.includes('closed') ? 'verified' : issue.status === 'reopened' ? 'reopened' : 'new'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        {issue.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
