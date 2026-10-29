import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Category, Zone } from '../types';
import { CityMap } from '../components/CityMap';
import {
  Camera, MapPin, Sparkles, AlertCircle, CheckCircle2, Loader2, Send,
  ShieldCheck, ArrowRight, Compass, AlertOctagon, Trash2, Droplets,
  Sun, Footprints, Construction
} from 'lucide-react';

interface ReportFormProps {
  categories: Category[];
  zones: Zone[];
  onReportSubmitted: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'cat-pothole': <AlertCircle size={22} color="#f43f5e" />,
  'cat-garbage': <Trash2 size={22} color="#f59e0b" />,
  'cat-drainage': <Droplets size={22} color="#00f0ff" />,
  'cat-streetlight': <Sun size={22} color="#facc15" />,
  'cat-footpath': <Footprints size={22} color="#a855f7" />,
  'cat-excavation': <Construction size={22} color="#fb923c" />
};

export const ReportForm: React.FC<ReportFormProps> = ({ categories, zones, onReportSubmitted }) => {
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('cat-pothole');
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
      setZoneError(err.message || 'Location falls outside supported pilot zones');
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);
  };

  const handleDescriptionBlur = async () => {
    if (description.trim().length >= 8) {
      setIsAiLoading(true);
      try {
        const res = await api.suggestCategory(description);
        if (res && res.suggested_category_id && res.confidence >= 0.35) {
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

  const handleSamplePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark asphalt texture
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 480, 340);

      // Pothole void
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.ellipse(240, 180, 120, 65, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Rim cracks
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Stamp
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('BENGALURU CIVIC EVIDENCE CAPTURE', 30, 40);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(`GEO-STAMP: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`, 30, 62);

      canvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], 'bengaluru_defect_sample.jpg', { type: 'image/jpeg' });
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
      setErrorMessage('Please select a defect category.');
      return;
    }
    if (!photoFile) {
      setErrorMessage('Please attach photo evidence for verification.');
      return;
    }
    if (!detectedZone) {
      setErrorMessage('Pin is outside supported pilot zones (Koramangala, Indiranagar, HSR Layout).');
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
      setSuccessMessage(`Observation registered! Linked to Issue #${res.issue_id?.slice(0, 8)} in ${detectedZone.name}.`);
      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setAiSuggestion(null);
      onReportSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please check login session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedCatObj = categories.find((c) => c.id === aiSuggestion?.categoryId);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#00f0ff', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          <Compass size={16} /> Intelligent Citizen Observation Portal
        </div>
        <h1 style={{ fontSize: '2.1rem', color: '#f8fafc', marginBottom: '8px' }}>
          Report Urban Infrastructure Defect
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: '750px' }}>
          Every submission is validated via Point-in-Polygon spatial mapping, evaluated by an AI category baseline, and linked directly to an underlying municipal ticket.
        </p>
      </div>

      {successMessage && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle2 size={24} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Successfully Dispatched!</div>
            <div style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>{successMessage}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: '#fda4af',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <AlertCircle size={24} />
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
        {/* Left Column: Form Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Description & AI Recommender */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Issue Description</label>
              {isAiLoading && (
                <span style={{ fontSize: '0.75rem', color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Loader2 size={13} className="spin" /> NLP Classifier evaluating...
                </span>
              )}
            </div>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Describe the defect in detail (e.g. Deep crater pothole near Sony World signal breaking scooter wheels and causing traffic snarls...)"
              value={description}
              onChange={handleDescriptionChange}
              onBlur={handleDescriptionBlur}
              required
            />

            {/* Glowing AI Suggestion Chip */}
            {aiSuggestion && suggestedCatObj && (
              <div style={{
                marginTop: '14px',
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(99, 102, 241, 0.15))',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: 'var(--shadow-glow-cyan)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={20} color="#00f0ff" />
                  <div>
                    <div style={{ fontSize: '0.86rem', color: '#f8fafc', fontWeight: 700 }}>
                      AI Category Match: <span style={{ color: '#00f0ff' }}>{suggestedCatObj.name}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      In-process TF-IDF Classifier confidence: <b>{Math.round(aiSuggestion.confidence * 100)}%</b>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ background: 'rgba(0, 240, 255, 0.2)', border: '1px solid #00f0ff', color: '#00f0ff' }}
                  onClick={() => setSelectedCategory(suggestedCatObj.id)}
                >
                  Apply Match
                </button>
              </div>
            )}
          </div>

          {/* Interactive Category Selector Grid */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <label className="form-label">Select Defect Classification</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const icon = CATEGORY_ICONS[cat.id] || <AlertCircle size={22} />;

                return (
                  <div
                    key={cat.id}
                    className={`category-tile ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {icon}
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8' }}>
                        {cat.sla_resolve_hours}h SLA
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                      {cat.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Photo Evidence with Privacy Shield */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Defect Photo Evidence</label>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                <ShieldCheck size={14} /> EXIF GPS Stripped
              </span>
            </div>

            <div style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              background: 'rgba(7, 10, 18, 0.4)'
            }}>
              {photoPreview ? (
                <div>
                  <img
                    src={photoPreview}
                    alt="Defect Preview"
                    style={{ maxHeight: '180px', borderRadius: '12px', objectFit: 'cover', margin: '0 auto 12px auto', display: 'block', border: '1px solid var(--border-subtle)' }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>
                    Replace Photo
                  </button>
                </div>
              ) : (
                <div>
                  <Camera size={38} color="#64748b" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Upload photo evidence (JPEG/PNG/WebP, max 10MB)
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      Choose Local Photo
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                    </label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleSamplePhoto}>
                      Simulate Camera Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            disabled={isSubmitting || !detectedZone}
          >
            {isSubmitting ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
            {isSubmitting ? 'Evaluating & Linking Observation...' : 'Submit Observation'}
          </button>
        </div>

        {/* Right Column: Spatial Map & Live Zone Verification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Geospatial Pin Drop</label>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Drag the glowing pin or pick a pilot zone center to test point-in-polygon verification.
            </p>

            {/* Quick pilot zone centers */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ color: '#fb7185' }}
                onClick={() => setLocation({ lat: 28.6139, lon: 77.2090 })}
                title="Test out-of-bounds rejection"
              >
                Outside Area (Test)
              </button>
            </div>

            {/* Map Canvas */}
            <div style={{ flex: 1, minHeight: '320px', marginBottom: '16px' }}>
              <CityMap
                zones={zones}
                selectedLocation={location}
                onLocationSelect={(lat, lon) => setLocation({ lat, lon })}
                interactiveSelect={true}
                height="320px"
              />
            </div>

            {/* Point in Polygon Status Card */}
            <div style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: detectedZone ? 'rgba(0, 240, 255, 0.08)' : 'rgba(244, 63, 94, 0.1)',
              border: detectedZone ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {detectedZone ? (
                <>
                  <CheckCircle2 size={24} color="#00f0ff" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                      {detectedZone.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {detectedZone.corporation} &bull; Approx. Ward {detectedZone.ward_number || 'Pilot'} (Demo) &bull; Ray-Casting Verified
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertOctagon size={24} color="#f43f5e" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fda4af' }}>
                      Outside Pilot Study Area
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#fda4af' }}>
                      {zoneError || 'Please place the pin inside Koramangala, Indiranagar, or HSR Layout.'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
