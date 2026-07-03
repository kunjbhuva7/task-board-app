import React from 'react';
import { Edit2, Copy, Trash2 } from 'lucide-react';
import { TYPE_META, entryTitle, entrySubtitle, to12h } from './constants';

const Timeline = ({ entries = [], loading, onEdit, onDelete, onDuplicate }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', opacity: 1 - i * 0.15 }}>
            <div className="gym-skeleton" style={{ width: 54, height: 14, borderRadius: 6 }} />
            <div className="gym-skeleton" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
            <div className="gym-skeleton" style={{ flex: 1, height: 56, borderRadius: 14 }} />
          </div>
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📔</div>
        <div style={{ fontWeight: '700', color: '#475569', fontSize: '1rem' }}>Nothing logged for this day yet</div>
        <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
          Tap the <span style={{ color: '#FF7E5F', fontWeight: 700 }}>+</span> button to add a meal, workout, or more.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* vertical connector line */}
      <div style={{ position: 'absolute', left: 80, top: 12, bottom: 12, width: 2, background: 'linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0.02))' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {entries.map((e) => {
          const meta = TYPE_META[e.type] || TYPE_META.note;
          const Icon = meta.icon;
          return (
            <div key={e.id} className="gym-timeline-row" style={{ display: 'flex', alignItems: 'stretch', gap: '0.85rem', position: 'relative' }}>
              {/* time */}
              <div style={{ width: 66, flexShrink: 0, textAlign: 'right', paddingTop: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#475569' }}>{e.entry_time ? to12h(e.entry_time).split(' ')[0] : '—'}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#94A3B8' }}>{e.entry_time ? to12h(e.entry_time).split(' ')[1] : ''}</div>
              </div>

              {/* dot / icon */}
              <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, paddingTop: '0.55rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--card-bg, #fff)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <Icon size={19} />
                </div>
              </div>

              {/* content card */}
              <div className="gym-timeline-card" style={{
                flex: 1, minWidth: 0,
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14,
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: '0.75rem 0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.18s'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.9rem' }}>{entryTitle(e)}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', color: meta.color, background: meta.bg, padding: '0.1rem 0.45rem', borderRadius: 999 }}>{meta.label}</span>
                    {e.source === 'duplicate' && (
                      <span style={{ fontSize: '0.58rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em', color: '#94A3B8', background: 'rgba(0,0,0,0.05)', padding: '0.1rem 0.4rem', borderRadius: 999, border: '1px dashed rgba(0,0,0,0.12)' }}>From Yesterday</span>
                    )}
                  </div>
                  {entrySubtitle(e) && (
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entrySubtitle(e)}
                    </div>
                  )}
                </div>

                {/* actions */}
                <div className="gym-timeline-actions" style={{ display: 'flex', gap: '0.15rem', flexShrink: 0 }}>
                  <button title="Edit" onClick={() => onEdit(e)} style={actBtn('#64748B')}
                    onMouseEnter={ev => { ev.currentTarget.style.background = 'rgba(255,126,95,0.1)'; ev.currentTarget.style.color = '#FF7E5F'; }}
                    onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent'; ev.currentTarget.style.color = '#64748B'; }}>
                    <Edit2 size={15} />
                  </button>
                  <button title="Duplicate" onClick={() => onDuplicate(e)} style={actBtn('#64748B')}
                    onMouseEnter={ev => { ev.currentTarget.style.background = 'rgba(139,92,246,0.1)'; ev.currentTarget.style.color = '#8B5CF6'; }}
                    onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent'; ev.currentTarget.style.color = '#64748B'; }}>
                    <Copy size={15} />
                  </button>
                  <button title="Delete" onClick={() => onDelete(e)} style={actBtn('#64748B')}
                    onMouseEnter={ev => { ev.currentTarget.style.background = 'rgba(239,68,68,0.1)'; ev.currentTarget.style.color = '#EF4444'; }}
                    onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent'; ev.currentTarget.style.color = '#64748B'; }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const actBtn = (color) => ({
  background: 'transparent', border: 'none', cursor: 'pointer', color,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '6px', borderRadius: 8, transition: 'all 0.15s'
});

export default Timeline;
