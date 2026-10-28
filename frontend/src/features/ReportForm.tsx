import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Category, Zone } from '../types';
import { CityMap } from '../components/CityMap';
import { Camera, MapPin, Sparkles, AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

interface ReportFormProps {
  categories: Category[];
  zones: Zone[];
  onReportSubmitted: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({ categories, zones, onReportSubmitted }) => {
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState<{ lat: number; lon: number }>({ lat: 12.9352, lon: 77.6245 }); // Default Koramangala
  const [detectedZone, setDetectedZone] = useState<Zone | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // AI Suggestion state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ categoryId: string; confidence: number } | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check Zone on location change
  useEffect(() => {
    checkZone(location.lat, location.lon);
  }, [location]);

  const checkZone = async (lat: number, lon: number) => {
    try {
      setZoneError(null);
      const zone = await api.lookupZone(lat, lon);
      setDetectedZone(zone);
    } catch (err: any) {
      setDetectedZone(null);
      setZoneError(err.message || 'Location is outside supported pilot zones');
    }
  };

  // Trigger AI Text Suggestion on description blur / length
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);
  };

  const handleDescriptionBlur = async () => {
    if (description.trim().length >= 10) {
      setIsAiLoading(true);
      try {
        const res = await api.suggestCategory(description);
        if (res && res.suggested_category_id && res.confidence >= 0.4) {
          setAiSuggestion({
            categoryId: res.suggested_category_id,
            confidence: res.confidence
          });
        } else {
          setAiSuggestion(null);
        }
      } catch {
        setAiSuggestion(null);
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Create an artificial sample photo if user wants a quick demo test
  const handleSamplePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(200, 160, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '16px sans-serif';
      ctx.fillText('Bengaluru Road Defect Observation', 60, 50);
      canvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], 'demo_pothole.jpg', { type: 'image/jpeg' });
          setPhotoFile(sampleFile);
          setPhotoPreview(canvas.toDataURL('image/jpeg'));
        }
      }, 'image/jpeg');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedCategory) {
      setErrorMessage('Please select a category for the civic defect.');
      return;
    }
    if (!photoFile) {
      setErrorMessage('Please attach a defect photo for verification.');
      return;
    }
    if (!detectedZone) {
      setErrorMessage('The pin is outside the supported pilot area. Please place it in Koramangala, Indiranagar, or HSR.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('category_id', selectedCategory);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lon.toString());
      formData.append('image', photoFile);

      const res = await api.submitReport(formData);
      setSuccessMessage(`Report filed successfully! Reference ID: ${res.id.slice(0, 8)}`);
      setDescription('');
      setSelectedCategory('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setAiSuggestion(null);
      onReportSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please ensure you are logged in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedCatObj = categories.find((c) => c.id === aiSuggestion?.categoryId);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }} className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '6px' }}>Report Urban Infrastructure Defect</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Observations are automatically geolocated, linked to municipal tracking issues, and routed with explainable SLA priorities.
        </p>
      </div>

      {successMessage && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: '#fda4af',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Form Details */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Description & AI Suggestion */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label">Issue Description</label>
              {isAiLoading && (
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Loader2 size={12} className="spin" /> Analyzing text...
                </span>
              )}
            </div>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="e.g. Dangerous 2-foot crater in front of Sony World junction causing scooter skidding..."
              value={description}
              onChange={handleDescriptionChange}
              onBlur={handleDescriptionBlur}
              required
            />
          </div>

          {/* AI Suggestion Chip */}
          {aiSuggestion && suggestedCatObj && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.15))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#38bdf8" />
                <span style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                  AI Suggestion: <b>{suggestedCatObj.name}</b> ({Math.round(aiSuggestion.confidence * 100)}% match)
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedCategory(suggestedCatObj.id)}
                style={{ borderColor: '#38bdf8', color: '#38bdf8' }}
              >
                Apply
              </button>
            </div>
          )}

          {/* Category Dropdown */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
            >
              <option value="">Select Defect Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (SLA: {c.sla_resolve_hours}h)
                </option>
              ))}
            </select>
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label className="form-label">Defect Evidence Photo</label>
            <div style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.4)',
              cursor: 'pointer'
            }}>
              {photoPreview ? (
                <div>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ maxHeight: '160px', borderRadius: '8px', objectFit: 'cover', margin: '0 auto 10px auto', display: 'block' }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>
                    Change Photo
                  </button>
                </div>
              ) : (
                <div>
                  <Camera size={32} color="#64748b" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Upload JPEG, PNG or WebP (max 10MB)
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      Browse File
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                    </label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleSamplePhoto}>
                      Use Sample Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={isSubmitting || !detectedZone}
          >
            {isSubmitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            {isSubmitting ? 'Verifying & Submitting...' : 'Submit Observation'}
          </button>
        </div>

        {/* Right Column: Location Picker & Zone Verification */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} color="#38bdf8" /> Pinpoint Location on Pilot Map
            </label>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Click or drag the marker within one of the pilot polygons (Koramangala, Indiranagar, HSR).
            </p>

            {/* Quick pilot zone centers */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setLocation({ lat: 12.9352, lon: 77.6245 })}
              >
                Koramangala
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setLocation({ lat: 12.9715, lon: 77.6412 })}
              >
                Indiranagar
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setLocation({ lat: 12.9125, lon: 77.6480 })}
              >
                HSR Layout
              </button>
            </div>
          </div>

          {/* Interactive Leaflet Map for Pin Drop */}
          <div style={{ flex: 1, minHeight: '260px' }}>
            <CityMap
              zones={zones}
              selectedLocation={location}
              onLocationSelect={(lat, lon) => setLocation({ lat, lon })}
              interactiveSelect={true}
              height="280px"
            />
          </div>

          {/* Zone Point-in-Polygon Status */}
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: detectedZone ? 'rgba(56, 189, 248, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: detectedZone ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {detectedZone ? (
              <>
                <CheckCircle2 size={18} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                    {detectedZone.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {detectedZone.corporation} (Ward {detectedZone.ward_number || 'Pilot'})
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={18} color="#f43f5e" />
                <div style={{ fontSize: '0.8rem', color: '#fda4af' }}>
                  {zoneError || 'Point falls outside pilot area boundary'}
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
