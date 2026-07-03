import React from 'react';

// Large animated protein progress ring (auto-updates as meals are added)
const ProteinRing = ({ protein = 0, goal = 150, size = 168, stroke = 14 }) => {
  const safeGoal = goal > 0 ? goal : 150;
  const pct = Math.max(0, Math.min(100, (protein / safeGoal) * 100));
  const remaining = Math.max(0, Math.round(safeGoal - protein));
  const over = protein > safeGoal;

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="proteinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7E5F" />
            <stop offset="100%" stopColor="#FEB47B" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={over ? '#10B981' : 'url(#proteinGrad)'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Protein</div>
        <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#1E293B', lineHeight: 1.1, marginTop: '2px' }}>
          {Math.round(protein)}<span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: '700' }}>/{safeGoal}g</span>
        </div>
        <div style={{
          fontSize: '0.72rem', fontWeight: '700', marginTop: '4px',
          color: over ? '#10B981' : '#FF7E5F'
        }}>
          {over ? `+${Math.round(protein - safeGoal)}g over 🎉` : `${remaining}g left`}
        </div>
      </div>
    </div>
  );
};

export default ProteinRing;
