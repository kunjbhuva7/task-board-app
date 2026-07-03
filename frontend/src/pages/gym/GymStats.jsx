import React from 'react';
import { TrendingUp, Activity, CalendarCheck, Target, Dumbbell } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { shortDate } from './constants';

const CARD = {
  background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)',
  border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: '1.25rem'
};
const tooltipStyle = { borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.97)', color: '#1E293B', fontSize: '0.8rem' };

// Small adherence ring
const AdherenceRing = ({ pct = 0, size = 76, stroke = 9 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="adhGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7E5F" /><stop offset="100%" stopColor="#FEB47B" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#adhGrad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', fontWeight: 800, color: '#1E293B' }}>{pct}%</div>
    </div>
  );
};

const heatColor = (cell) => {
  if (cell.done) return '#10B981';
  if (cell.count >= 5) return '#FF7E5F';
  if (cell.count >= 3) return '#FEA07B';
  if (cell.count >= 1) return '#FFD7C6';
  return 'rgba(0,0,0,0.05)';
};

const GymStats = ({ stats }) => {
  if (!stats) return null;

  const proteinData = (stats.proteinSeries || []).slice(-14).map(d => ({ label: shortDate(d.date), protein: d.protein }));
  const weightData = (stats.weightSeries || []).slice(-20).map(d => ({ label: shortDate(d.date), weight: d.weight }));
  const weekly = stats.weekly || { workouts: 0, proteinAvg: 0, loggedDays: 0, weightChange: null };
  const heatmap = stats.heatmap || [];
  const firstWeekday = heatmap.length ? (() => { const [y, m, d] = heatmap[0].date.split('-').map(Number); return new Date(y, m - 1, d).getDay(); })() : 0;

  const weeklyStats = [
    { label: 'Workouts', value: weekly.workouts, icon: Dumbbell, color: '#8B5CF6' },
    { label: 'Avg Protein', value: `${weekly.proteinAvg}g`, icon: TrendingUp, color: '#FF7E5F' },
    { label: 'Days Logged', value: `${weekly.loggedDays}/7`, icon: CalendarCheck, color: '#10B981' },
    { label: 'Weight Δ', value: weekly.weightChange == null ? '—' : `${weekly.weightChange > 0 ? '+' : ''}${weekly.weightChange}kg`, icon: Activity, color: weekly.weightChange == null ? '#94A3B8' : (weekly.weightChange <= 0 ? '#10B981' : '#F59E0B') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Weekly report + Consistency heatmap */}
      <div className="gym-two">
        {/* This Week */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
            <Target size={16} color="#FF7E5F" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1E293B' }}>This Week</h3>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <AdherenceRing pct={stats.adherence || 0} />
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#94A3B8', marginTop: '0.4rem', maxWidth: 96, lineHeight: 1.3 }}>
                Protein goal hit<br />({stats.adherenceLoggedDays || 0} logged days · 30d)
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 180, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {weeklyStats.map(s => (
                <div key={s.label} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.6rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <s.icon size={12} color={s.color} /> {s.label}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: s.color, lineHeight: 1.1, marginTop: '0.15rem' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consistency heatmap */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
            <CalendarCheck size={16} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1E293B' }}>Consistency (16 weeks)</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 13px)', gridAutoFlow: 'column', gap: 3, width: 'fit-content' }}>
              {Array.from({ length: firstWeekday }).map((_, i) => <div key={`pad${i}`} style={{ width: 13, height: 13 }} />)}
              {heatmap.map(cell => (
                <div key={cell.date} title={`${cell.date}: ${cell.count} ${cell.count === 1 ? 'entry' : 'entries'}${cell.done ? ' · completed' : ''}`}
                  style={{ width: 13, height: 13, borderRadius: 3, background: heatColor(cell), transition: 'background 0.2s' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.9rem', fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
            <span>Less</span>
            {['rgba(0,0,0,0.05)', '#FFD7C6', '#FEA07B', '#FF7E5F'].map(c => <span key={c} style={{ width: 12, height: 12, borderRadius: 3, background: c }} />)}
            <span>More</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#10B981' }} /> Completed</span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="gym-two">
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={16} color="#FF7E5F" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1E293B' }}>Protein Trend (14 days)</h3>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={proteinData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF7E5F" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FF7E5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="protein" stroke="#FF7E5F" strokeWidth={2.5} fill="url(#pGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={16} color="#10B981" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1E293B' }}>Weight Progress</h3>
          </div>
          {weightData.length < 2 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center' }}>
              Log your weight on 2+ days to see progress 📈
            </div>
          ) : (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} width={38} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Lists row */}
      <div className="gym-two">
        <div style={CARD}>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.9rem', fontWeight: '700', color: '#1E293B' }}>🏋 Recent Workouts</h3>
          {(stats.recentWorkouts || []).length === 0 ? (
            <div style={{ color: '#94A3B8', fontSize: '0.82rem', padding: '0.5rem 0' }}>No workouts logged yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.recentWorkouts.map(w => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.7rem', background: 'var(--input-bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{w.type || 'Workout'}</div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600', flexShrink: 0, marginLeft: 8 }}>{shortDate(w.date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={CARD}>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.9rem', fontWeight: '700', color: '#1E293B' }}>⭐ Favorite Meals</h3>
          {(stats.favoriteMeals || []).length === 0 ? (
            <div style={{ color: '#94A3B8', fontSize: '0.82rem', padding: '0.5rem 0' }}>Your most-logged meals will appear here.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.favoriteMeals.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.7rem', background: 'var(--input-bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                  <span style={{ fontSize: '0.7rem', color: '#FF7E5F', fontWeight: '800', flexShrink: 0, marginLeft: 8, background: 'rgba(255,126,95,0.1)', padding: '2px 8px', borderRadius: 999 }}>×{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GymStats;
