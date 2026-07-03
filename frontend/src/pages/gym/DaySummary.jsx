import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { MOODS } from './constants';

const Metric = ({ label, value, unit, color }) => (
  <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.85rem 1rem' }}>
    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: color || '#1E293B', lineHeight: 1.1, marginTop: '0.2rem' }}>
      {value}{unit && <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '700', marginLeft: 2 }}>{unit}</span>}
    </div>
  </div>
);

const DaySummary = ({ summary, day, onSaveDay, onCompleteDay }) => {
  const [mood, setMood] = useState(day?.mood || '');
  const [notes, setNotes] = useState(day?.day_notes || '');
  const [dirty, setDirty] = useState(false);
  const completed = !!(day && day.completed);

  useEffect(() => { setMood(day?.mood || ''); setNotes(day?.day_notes || ''); setDirty(false); }, [day?.entry_date, day?.mood, day?.day_notes]);

  const save = () => { onSaveDay({ mood, day_notes: notes }); setDirty(false); };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1E293B' }}>Daily Summary</h3>
        {onCompleteDay && (
          <button onClick={onCompleteDay}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem', border: 'none', cursor: 'pointer',
              padding: '0.6rem 1.1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit',
              color: '#fff',
              background: completed ? 'linear-gradient(135deg,#10B981,#34D399)' : 'linear-gradient(135deg,#FF7E5F,#FEB47B)',
              boxShadow: completed ? '0 4px 14px rgba(16,185,129,0.35)' : '0 4px 14px rgba(255,126,95,0.35)',
              transition: 'transform 0.18s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <Check size={16} strokeWidth={3} />
            {completed ? 'Day Completed' : 'Complete Day & Email Summary'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
        <Metric label="Protein" value={summary.protein} unit="g" color="#FF7E5F" />
        <Metric label="Workout" value={summary.workoutDuration || 0} unit="h" color="#8B5CF6" />
        <Metric label="Cardio" value={summary.cardioMinutes} unit="min" />
        <Metric label="Water" value={summary.water} unit="ml" color="#06B6D4" />
        <Metric label="Weight" value={summary.weight != null ? summary.weight : '—'} unit={summary.weight != null ? 'kg' : ''} color="#10B981" />
      </div>

      {/* Mood + Notes */}
      <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Mood</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {MOODS.map(m => (
              <button key={m} onClick={() => { setMood(m); setDirty(true); }}
                style={{ padding: '0.4rem 0.7rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                  border: `1px solid ${mood === m ? '#FF7E5F' : 'var(--border)'}`,
                  background: mood === m ? 'rgba(255,126,95,0.12)' : 'var(--card-bg)',
                  color: mood === m ? '#E8613C' : 'var(--text-secondary)' }}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Day Notes</div>
          <textarea className="gym-input" rows="2" value={notes} placeholder="Reflections on today…"
            onChange={e => { setNotes(e.target.value); setDirty(true); }} />
        </div>
        {dirty && (
          <button onClick={save} style={{ alignSelf: 'flex-start', padding: '0.55rem 1.1rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', color: 'white', background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)', boxShadow: '0 4px 14px rgba(255,126,95,0.3)' }}>
            Save mood & notes
          </button>
        )}
      </div>
    </div>
  );
};

export default DaySummary;
