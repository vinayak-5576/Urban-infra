import React, { useState } from 'react';
import { Issue, Zone, Category } from '../types';
import { CityMap } from '../components/CityMap';
import { MapPin, Filter, AlertTriangle, Layers, ArrowRight } from 'lucide-react';

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

  const filteredIssues = issues.filter((i) => {
    if (selectedZone && i.zone_id !== selectedZone) return false;
    if (selectedCategory && i.category_id !== selectedCategory) return false;
    return true;
  });

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : catId;
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }} className="animate-fade-in">
      {/* Hero Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: '#f8fafc', marginBottom: '6px' }}>
            Bengaluru Pilot Infrastructure Map
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Live geospatial view across Koramangala, Indiranagar, and HSR Layout pilot zones. Click markers to inspect priority scores.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNavigateToReport}>
          <AlertTriangle size={16} /> Report New Issue
        </button>
      </div>

      {/* Main Grid: Map + Side Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', minHeight: '560px' }}>
        {/* Map Container */}
        <div className="glass-panel" style={{ padding: '8px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: '520px' }}>
            <CityMap
              issues={filteredIssues}
              zones={zones}
              height="530px"
            />
          </div>
        </div>

        {/* Side Panel: Zone & Issues List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Filters */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
              <Filter size={15} color="#38bdf8" /> Pilot Study Zones
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                className={`btn btn-sm ${selectedZone === '' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'space-between' }}
                onClick={() => setSelectedZone('')}
              >
                <span>All Pilot Zones</span>
                <span>{issues.length}</span>
              </button>
              {zones.map((z) => {
                const count = issues.filter((i) => i.zone_id === z.id).length;
                return (
                  <button
                    key={z.id}
                    className={`btn btn-sm ${selectedZone === z.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'space-between' }}
                    onClick={() => setSelectedZone(z.id)}
                  >
                    <span>{z.name.replace(' Pilot Zone', '')}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Incidents List */}
          <div className="glass-panel" style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '340px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Recent Incidents</span>
              <span style={{ color: '#38bdf8' }}>{filteredIssues.length} Active</span>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {filteredIssues.slice(0, 6).map((issue) => {
                let priorityClass = 'priority-low';
                if (issue.priority_score >= 70) priorityClass = 'priority-high';
                else if (issue.priority_score >= 45) priorityClass = 'priority-mid';

                return (
                  <div
                    key={issue.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                        {getCategoryName(issue.category_id)}
                      </span>
                      <span className={`priority-pill ${priorityClass}`} style={{ fontSize: '0.7rem' }}>
                        {issue.priority_score}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Corroborated by {issue.report_count} report(s) &bull; {issue.status.replace(/_/g, ' ')}
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
