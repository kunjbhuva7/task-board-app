import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { TYPE_META, todayYMD } from './constants';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const GymCalendar = ({ selectedDate, onSelect, marked = {}, onMonthChange }) => {
  const init = selectedDate ? selectedDate.split('-').map(Number) : todayYMD().split('-').map(Number);
  const [year, setYear] = useState(init[0]);
  const [month, setMonth] = useState(init[1] - 1);

  useEffect(() => { onMonthChange && onMonthChange(year, month); }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = todayYMD();

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: '1.25rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <button onClick={prev} style={navBtn} aria-label="Previous month"><ChevronLeft size={16} /></button>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#1E293B' }}>{MONTHS[month]} {year}</h4>
        <button onClick={next} style={navBtn} aria-label="Next month"><ChevronRight size={16} /></button>
      </div>

      {/* Weekdays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 5 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.66rem', fontWeight: '800', color: '#94A3B8', padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = ymd === today;
          const isSel = ymd === selectedDate;
          const info = marked[ymd] || {};
          const types = [...new Set(info.types || [])].slice(0, 3);
          const done = !!info.done;

          return (
            <button key={day} onClick={() => onSelect(ymd)}
              style={{
                position: 'relative', height: 44, borderRadius: 11, cursor: 'pointer', fontSize: '0.85rem',
                fontWeight: isSel || isToday ? '800' : '600',
                border: isToday && !isSel ? '1.5px solid rgba(255,126,95,0.5)' : '1.5px solid transparent',
                background: isSel ? 'linear-gradient(135deg, #FF7E5F, #FEB47B)' : (done ? 'rgba(16,185,129,0.08)' : 'transparent'),
                color: isSel ? 'white' : isToday ? '#E8613C' : '#334155',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                boxShadow: isSel ? '0 4px 14px rgba(255,126,95,0.35)' : 'none'
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,126,95,0.1)'; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = done ? 'rgba(16,185,129,0.08)' : 'transparent'; }}>
              {day}

              {/* completed tick */}
              {done && (
                <span style={{
                  position: 'absolute', top: 3, right: 3, width: 15, height: 15, borderRadius: '50%',
                  background: isSel ? 'rgba(255,255,255,0.95)' : '#10B981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}>
                  <Check size={10} strokeWidth={3.5} color={isSel ? '#E8613C' : '#fff'} />
                </span>
              )}

              {/* data dots */}
              {types.length > 0 && (
                <div style={{ display: 'flex', gap: 2, position: 'absolute', bottom: 4 }}>
                  {types.map(t => (
                    <span key={t} style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.9)' : (TYPE_META[t]?.color || '#94A3B8') }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.9rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Check size={8} strokeWidth={4} color="#fff" /></span>
          Completed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF7E5F' }} /> Has entries
        </span>
      </div>
    </div>
  );
};

const navBtn = { background: 'rgba(0,0,0,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', color: '#475569' };

export default GymCalendar;
