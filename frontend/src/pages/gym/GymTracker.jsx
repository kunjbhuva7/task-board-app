import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  Plus, ChevronLeft, ChevronRight, Search, X, Download, FileText, Copy, Droplets, Edit3, CalendarDays,
  Flame, TrendingUp, Dumbbell, Trash2
} from 'lucide-react';
import api from '../../api/axios';
import ProteinRing from './ProteinRing';
import Timeline from './Timeline';
import EntryModal from './EntryModal';
import GymCalendar from './GymCalendar';
import GymStats from './GymStats';
import DaySummary from './DaySummary';
import { Select } from './ui';
import {
  todayYMD, prettyDate, toYMD, shortDate, to12h,
  ENTRY_TYPES, TYPE_META, MEAL_TYPE_OPTIONS, WORKOUT_TYPE_OPTIONS, entryTitle, entrySubtitle
} from './constants';

const CARD = {
  background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)',
  border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: '1.5rem'
};
const selStyle = { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.5rem 0.8rem', fontSize: '0.82rem', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' };

const addDays = (ymd, delta) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toYMD(dt);
};

const GymTracker = () => {
  const [date, setDate] = useState(todayYMD());
  const [dayData, setDayData] = useState({ entries: [], day: {}, summary: {} });
  const [loading, setLoading] = useState(true);
  const [marked, setMarked] = useState({});
  const [stats, setStats] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [filterMeal, setFilterMeal] = useState('');
  const [filterWorkout, setFilterWorkout] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [goalEditing, setGoalEditing] = useState(false);
  const [goalDraft, setGoalDraft] = useState(150);
  const [waterGoalEditing, setWaterGoalEditing] = useState(false);
  const [waterGoalDraft, setWaterGoalDraft] = useState(3000);

  const monthRange = useRef({ from: null, to: null });

  const fetchDay = useCallback(async (d, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get(`/gym/day/${d}`);
      setDayData(res.data);
      setGoalDraft(res.data.day?.protein_goal || 150);
      setWaterGoalDraft(res.data.day?.water_goal || 3000);
    } catch (err) {
      toast.error('Failed to load day');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMarked = useCallback(async (from, to) => {
    try {
      const res = await api.get(`/gym/marked?from=${from}&to=${to}`);
      setMarked(res.data || {});
    } catch { /* ignore */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/gym/stats');
      setStats(res.data);
    } catch { /* ignore */ }
  }, []);

  const refreshAll = useCallback(() => {
    fetchDay(date, false);
    fetchStats();
    if (monthRange.current.from) fetchMarked(monthRange.current.from, monthRange.current.to);
  }, [date, fetchDay, fetchStats, fetchMarked]);

  useEffect(() => { fetchDay(date); }, [date, fetchDay]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL?.replace('/api', '') || (window.location.hostname === 'localhost' ? 'http://localhost:5005' : window.location.origin));
    s.on('tasks_updated', () => { fetchDay(date, false); fetchStats(); });
    return () => s.disconnect();
    // eslint-disable-next-line
  }, [date]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/gym/search?q=${encodeURIComponent(search.trim())}`);
        setSearchResults(res.data || []);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const onMonthChange = useCallback((year, month) => {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;
    monthRange.current = { from, to };
    fetchMarked(from, to);
  }, [fetchMarked]);

  const openAdd = () => { setEditingEntry(null); setModalOpen(true); };
  const openEdit = (entry) => { setEditingEntry(entry); setModalOpen(true); };

  const handleDelete = async (entry) => {
    try { await api.delete(`/gym/entry/${entry.id}`); toast.success('Deleted'); refreshAll(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleDuplicate = async (entry) => {
    try {
      await api.post('/gym/entry', { entry_date: date, entry_time: entry.entry_time, type: entry.type, data: entry.data });
      toast.success('Duplicated');
      refreshAll();
    } catch { toast.error('Failed to duplicate'); }
  };

  const handleSaveDay = async (patch) => {
    try {
      await api.put(`/gym/day/${date}`, patch);
      toast.success('Saved');
      fetchDay(date, false);
    } catch { toast.error('Failed to save'); }
  };

  const handleCompleteDay = async () => {
    const next = !(dayData.day && dayData.day.completed);
    try {
      const res = await api.post(`/gym/day/${date}/complete`, { completed: next });
      if (next) toast.success(res.data.emailed ? 'Day completed — summary emailed ✓' : 'Day completed ✓');
      else toast.success('Day reopened');
      refreshAll();
    } catch { toast.error('Failed to update day'); }
  };

  const handleClearDay = async () => {
    const dupes = dayData.entries.filter(e => e.source === 'duplicate').length;
    if (!dupes) { toast('No duplicated entries to clear — your manual entries are safe', { icon: 'ℹ️' }); return; }
    if (!window.confirm(`Remove ${dupes} duplicated entries? Your manually added entries will NOT be deleted.`)) return;
    try {
      const res = await api.delete(`/gym/day/${date}/entries`);
      toast.success(res.data.message || 'Duplicates cleared');
      refreshAll();
    } catch { toast.error('Failed to clear'); }
  };

  const saveGoal = async () => {
    const g = Math.max(1, Number(goalDraft) || 150);
    setGoalEditing(false);
    try { await api.put(`/gym/day/${date}`, { protein_goal: g }); fetchDay(date, false); }
    catch { toast.error('Failed to update goal'); }
  };

  const saveWaterGoal = async () => {
    const g = Math.max(100, Number(waterGoalDraft) || 3000);
    setWaterGoalEditing(false);
    try { await api.put(`/gym/day/${date}`, { water_goal: g }); fetchDay(date, false); }
    catch { toast.error('Failed to update goal'); }
  };

  const quickWater = async (amount) => {
    const d = new Date();
    const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    try { await api.post('/gym/entry', { entry_date: date, entry_time: t, type: 'water', data: { amount } }); refreshAll(); }
    catch { toast.error('Failed'); }
  };

  const duplicateYesterday = async () => {
    const y = addDays(date, -1);
    try {
      const res = await api.get(`/gym/day/${y}`);
      const entries = res.data.entries || [];
      if (!entries.length) { toast('Nothing logged yesterday', { icon: 'ℹ️' }); return; }
      for (const e of entries) {
        await api.post('/gym/entry', { entry_date: date, entry_time: e.entry_time, type: e.type, data: e.data, source: 'duplicate' });
      }
      toast.success(`Copied ${entries.length} entries from yesterday`);
      refreshAll();
    } catch { toast.error('Failed to duplicate yesterday'); }
  };

  const exportCSV = () => {
    const rows = [['Time', 'Type', 'Title', 'Details']];
    dayData.entries.forEach(e => rows.push([e.entry_time || '', TYPE_META[e.type]?.label || e.type, entryTitle(e), entrySubtitle(e)]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gym-${date}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const s = dayData.summary || {};
    const rows = dayData.entries.map(e => `<tr><td>${e.entry_time ? to12h(e.entry_time) : '-'}</td><td>${TYPE_META[e.type]?.label || e.type}</td><td>${entryTitle(e)}</td><td>${entrySubtitle(e) || ''}</td></tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) { toast.error('Allow pop-ups to export PDF'); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Gym Journal ${date}</title>
      <style>body{font-family:Inter,Arial,sans-serif;color:#1E293B;padding:32px;} h1{color:#FF7E5F;margin:0 0 4px;} .sub{color:#64748B;margin:0 0 20px;}
      .sum{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:22px;} .chip{background:#FFF3EE;border:1px solid #FFE0D3;border-radius:10px;padding:8px 14px;}
      .chip b{display:block;font-size:18px;} .chip span{font-size:11px;color:#94A3B8;text-transform:uppercase;}
      table{width:100%;border-collapse:collapse;font-size:13px;} th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #EEE;} th{color:#94A3B8;text-transform:uppercase;font-size:11px;}</style>
      </head><body>
      <h1>Gym & Nutrition Journal</h1><p class="sub">${prettyDate(date)}</p>
      <div class="sum">
        <div class="chip"><b>${s.protein || 0}g</b><span>Protein</span></div>
        <div class="chip"><b>${s.workoutDuration || 0}m</b><span>Workout</span></div>
        <div class="chip"><b>${s.cardioMinutes || 0}m</b><span>Cardio</span></div>
        <div class="chip"><b>${s.water || 0}ml</b><span>Water</span></div>
        <div class="chip"><b>${s.weight != null ? s.weight + 'kg' : '-'}</b><span>Weight</span></div>
      </div>
      <table><thead><tr><th>Time</th><th>Type</th><th>Title</th><th>Details</th></tr></thead><tbody>${rows || '<tr><td colspan=4>No entries</td></tr>'}</tbody></table>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 350);
  };

  const filteredEntries = dayData.entries.filter(e => {
    if (filterType && e.type !== filterType) return false;
    if (filterMeal && !(e.type === 'meal' && e.data.mealType === filterMeal)) return false;
    if (filterWorkout && !(e.type === 'workout' && e.data.workoutType === filterWorkout)) return false;
    return true;
  });

  const summary = dayData.summary || {};
  const day = dayData.day || {};
  const waterGoal = day.water_goal || 3000;
  const waterPct = Math.min(100, Math.round(((summary.water || 0) / waterGoal) * 100));
  const proteinGoal = day.protein_goal || 150;
  const searching = search.trim().length > 0;
  const anyFilter = filterType || filterMeal || filterWorkout;
  const visibleResults = searchResults.filter(e => (!dateFrom || e.entry_date >= dateFrom) && (!dateTo || e.entry_date <= dateTo));

  const typeOptions = [{ value: '', label: 'All types' }, ...ENTRY_TYPES.map(t => ({ value: t.key, label: t.label, icon: t.icon }))];
  const mealFilterOptions = [{ value: '', label: 'All meals' }, ...MEAL_TYPE_OPTIONS];
  const workoutFilterOptions = [{ value: '', label: 'All workouts' }, ...WORKOUT_TYPE_OPTIONS];

  const insightChips = [
    { label: 'Workout Streak', value: `${stats?.streak || 0}`, unit: (stats?.streak === 1 ? 'day' : 'days'), icon: Flame, color: '#FF7E5F', bg: 'rgba(255,126,95,0.12)' },
    { label: 'Weekly Protein', value: `${stats?.weeklyProteinAvg || 0}`, unit: 'g/day', icon: TrendingUp, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Workouts / Month', value: `${stats?.monthlyWorkoutCount || 0}`, unit: '', icon: Dumbbell, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#1E293B' }}>Gym Tracker</h2>
          <p style={{ margin: '0.3rem 0 0', color: '#64748B', fontSize: '0.875rem' }}>Your date-wise fitness & nutrition journal</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={openAdd} title="Add to this day"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 10, fontWeight: 700, color: 'white', cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(255,126,95,0.35)', transition: 'transform 0.18s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <Plus size={17} /> Add Entry
          </button>
          <button onClick={duplicateYesterday} style={ghostBtn} title="Copy yesterday's log to today"><Copy size={14} /> Duplicate Yesterday</button>
          <button onClick={exportCSV} style={ghostBtn} title="Export day as CSV"><Download size={14} /> CSV</button>
          <button onClick={exportPDF} style={ghostBtn} title="Export day as PDF"><FileText size={14} /> PDF</button>
        </div>
      </div>

      {/* Date navigator */}
      <div style={{ ...CARD, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setDate(d => addDays(d, -1))} style={navBtn}><ChevronLeft size={18} /></button>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <CalendarDays size={16} color="#FF7E5F" />
            <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.9rem' }}>{prettyDate(date)}</span>
            <input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} title="Pick a date" />
          </div>
          <button onClick={() => setDate(d => addDays(d, 1))} style={navBtn}><ChevronRight size={18} /></button>
        </div>
        {date !== todayYMD() && (
          <button onClick={() => setDate(todayYMD())} style={{ ...ghostBtn, borderColor: '#FF7E5F', color: '#E8613C', background: 'rgba(255,126,95,0.08)' }}>Jump to Today</button>
        )}
      </div>

      {/* Search + filters */}
      <div style={{ ...CARD, padding: '0.9rem 1rem', display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all history — workout, exercise, meal, food, notes…"
            style={{ ...selStyle, width: '100%', paddingLeft: '2.1rem', cursor: 'text' }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}><X size={15} /></button>}
        </div>
        {!searching && <>
          <div style={{ width: 150 }}><Select value={filterType} onChange={setFilterType} options={typeOptions} /></div>
          <div style={{ width: 150 }}><Select value={filterMeal} onChange={setFilterMeal} options={mealFilterOptions} /></div>
          <div style={{ width: 160 }}><Select value={filterWorkout} onChange={setFilterWorkout} options={workoutFilterOptions} /></div>
          {anyFilter && <button onClick={() => { setFilterType(''); setFilterMeal(''); setFilterWorkout(''); }} style={{ ...ghostBtn, color: '#DC2626', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)' }}>Clear</button>}
        </>}
        {searching && <>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={selStyle} title="From date" />
          <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 700 }}>→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={selStyle} title="To date" />
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ ...ghostBtn, color: '#DC2626', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)' }}>Clear dates</button>}
        </>}
      </div>

      {searching ? (
        <div style={CARD}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '800', color: '#1E293B' }}>
            Search results {visibleResults.length > 0 && <span style={{ color: '#94A3B8', fontWeight: 600 }}>({visibleResults.length})</span>}
          </h3>
          {visibleResults.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>No matches found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {visibleResults.map(e => {
                const meta = TYPE_META[e.type] || TYPE_META.note;
                return (
                  <button key={e.id} onClick={() => { setDate(e.entry_date); setSearch(''); }}
                    style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.7rem 0.9rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><meta.icon size={17} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.85rem' }}>{entryTitle(e)}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entrySubtitle(e)}</div>
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#FF7E5F', flexShrink: 0 }}>{shortDate(e.entry_date)}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Hero: protein ring + goal + water + insight chips */}
          <div style={{ ...CARD, display: 'flex', gap: '1.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <ProteinRing protein={summary.protein || 0} goal={proteinGoal} />

            <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* protein goal editor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Protein Goal</span>
                {goalEditing ? (
                  <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                    <input type="number" min="1" value={goalDraft} onChange={e => setGoalDraft(e.target.value)} style={{ ...selStyle, width: 70, padding: '0.25rem 0.5rem' }} />
                    <button onClick={saveGoal} style={{ background: '#FF7E5F', color: 'white', border: 'none', borderRadius: 7, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Set</button>
                  </span>
                ) : (
                  <button onClick={() => setGoalEditing(true)} style={{ background: 'transparent', border: 'none', color: '#FF7E5F', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.82rem', fontWeight: 700 }}>{proteinGoal}g <Edit3 size={12} /></button>
                )}
              </div>

              {/* water */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 700, color: '#0891B2' }}><Droplets size={15} /> {summary.water || 0} / {waterGoal} ml</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}>{waterPct}%</span>
                    {waterGoalEditing ? (
                      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <input type="number" min="100" step="100" value={waterGoalDraft} onChange={e => setWaterGoalDraft(e.target.value)} style={{ ...selStyle, width: 72, padding: '0.2rem 0.4rem' }} />
                        <button onClick={saveWaterGoal} style={{ background: '#06B6D4', color: 'white', border: 'none', borderRadius: 7, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Set</button>
                      </span>
                    ) : (
                      <button onClick={() => setWaterGoalEditing(true)} style={{ background: 'transparent', border: 'none', color: '#06B6D4', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700 }}><Edit3 size={11} /></button>
                    )}
                  </div>
                </div>
                <div style={{ height: 9, borderRadius: 999, background: 'rgba(6,182,212,0.12)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${waterPct}%`, background: 'linear-gradient(90deg,#06B6D4,#22D3EE)', borderRadius: 999, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[250, 500, 750, 1000].map(v => (
                    <button key={v} onClick={() => quickWater(v)} style={{ flex: 1, padding: '0.4rem', borderRadius: 8, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.06)', color: '#0891B2', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>+{v}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* insight chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 190 }}>
              {insightChips.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.6rem 0.8rem' }}>
                  <div style={{ background: c.bg, color: c.color, padding: '0.5rem', borderRadius: 10, display: 'flex' }}><c.icon size={17} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1E293B', lineHeight: 1.1 }}>{c.value}{c.unit && <span style={{ fontSize: '0.66rem', color: '#94A3B8', fontWeight: 700, marginLeft: 3 }}>{c.unit}</span>}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline + Calendar */}
          <div className="gym-two">
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1E293B' }}>Timeline</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>{filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}</span>
                  {dayData.entries.length > 0 && (
                    <button onClick={handleClearDay} title="Clear duplicated entries (keeps your manually added entries)"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.35rem 0.7rem', fontSize: '0.72rem', fontWeight: 700, color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Trash2 size={13} /> Clear Duplicates
                    </button>
                  )}
                </div>
              </div>
              <Timeline entries={filteredEntries} loading={loading} onEdit={openEdit} onDelete={handleDelete} onDuplicate={handleDuplicate} />
            </div>

            <GymCalendar selectedDate={date} onSelect={setDate} marked={marked} onMonthChange={onMonthChange} />
          </div>

          {/* Insights + charts (full width) */}
          <GymStats stats={stats} />

          {/* Daily summary */}
          <DaySummary summary={summary} day={day} onSaveDay={handleSaveDay} onCompleteDay={handleCompleteDay} />
        </>
      )}

      <EntryModal open={modalOpen} date={date} editing={editingEntry} onClose={() => setModalOpen(false)} onSaved={refreshAll} />
    </div>
  );
};

const navBtn = { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.5rem', cursor: 'pointer', display: 'flex', color: '#475569' };
const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.5rem 0.85rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' };

export default GymTracker;
