import React, { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { ENTRY_TYPES, TYPE_META, MEAL_TYPE_OPTIONS, WORKOUT_TYPE_OPTIONS, SUPPLEMENT_OPTIONS, WATER_PRESETS } from './constants';
import { Field, Input, Textarea, Select } from './ui';

const nowHM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const blankForm = (type) => {
  switch (type) {
    case 'meal': return { mealType: 'Breakfast', foodItems: '', protein: '', notes: '' };
    case 'workout': return { workoutTypes: ['Push'], duration: '', cardioMinutes: '', notes: '' };
    case 'supplement': return { name: 'Whey Protein', customName: '', protein: '', notes: '' };
    case 'weight': return { bodyWeight: '', bodyFat: '', waist: '', chest: '', arms: '' };
    case 'water': return { amount: 500 };
    case 'note': return { text: '' };
    default: return {};
  }
};

const EntryModal = ({ open, date, editing, onClose, onSaved }) => {
  const [type, setType] = useState(null);
  const [time, setTime] = useState(nowHM());
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setTime(editing.entry_time || nowHM());
      const base = blankForm(editing.type);
      const data = { ...base, ...(editing.data || {}) };
      if (editing.type === 'supplement' && !['Whey Protein','Creatine','Coffee','Pre Workout','Fish Oil','Multivitamin','Vitamin D','Custom'].includes(data.name)) {
        data.customName = data.name; data.name = 'Custom';
      }
      // Convert old single workoutType to array
      if (editing.type === 'workout' && !Array.isArray(data.workoutTypes)) {
        data.workoutTypes = data.workoutType ? data.workoutType.split(' + ').map(s => s.trim()).filter(Boolean) : ['Push'];
      }
      setForm(data);
    } else {
      setType(null);
      setTime(nowHM());
      setForm({});
    }
  }, [open, editing]);

  if (!open) return null;

  const pick = (t) => { setType(t); setForm(blankForm(t)); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buildData = () => {
    if (type === 'supplement') {
      const name = form.name === 'Custom' ? (form.customName || 'Custom') : form.name;
      return { name, protein: form.protein || '', notes: form.notes || '' };
    }
    if (type === 'workout') {
      const types = form.workoutTypes || [];
      return { workoutTypes: types, workoutType: types.join(' + '), workoutName: types.join(' + '), duration: form.duration, cardioMinutes: form.cardioMinutes, notes: form.notes };
    }
    return { ...form };
  };

  const validate = () => {
    if (type === 'meal' && !form.foodItems.trim()) return 'Please enter the food items';
    if (type === 'workout' && (!form.workoutTypes || form.workoutTypes.length === 0)) return 'Select at least one workout type';
    if (type === 'weight' && !form.bodyWeight) return 'Enter your body weight';
    if (type === 'water' && !form.amount) return 'Enter a water amount';
    if (type === 'note' && !form.text.trim()) return 'Write something in the note';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const payload = { entry_date: date, entry_time: time, type, data: buildData() };
      if (editing) {
        await api.put(`/gym/entry/${editing.id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/gym/entry', payload);
        toast.success(`${TYPE_META[type].label} added`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const meta = type ? TYPE_META[type] : null;
  const MetaIcon = meta ? meta.icon : null;
  const exSm = { padding: '0.5rem 0.55rem', fontSize: '0.82rem', flex: 1, minWidth: 0 };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 540, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {type && !editing && (
              <button onClick={() => setType(null)} style={iconBtn} aria-label="Back"><ChevronLeft size={18} /></button>
            )}
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {!type ? 'What do you want to add?' : (
                <>
                  {editing ? 'Edit' : 'Add'}
                  {MetaIcon && <MetaIcon size={19} style={{ color: meta.color }} />}
                  {meta.label}
                </>
              )}
            </h3>
          </div>
          <button onClick={onClose} style={iconBtn} aria-label="Close"><X size={20} /></button>
        </div>

        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* STEP 1 — chooser */}
          {!type && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
              {ENTRY_TYPES.map(t => (
                <button key={t.key} onClick={() => pick(t.key)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 0.5rem', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer', transition: 'all 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 26px ${t.bg}`; e.currentTarget.style.borderColor = t.color; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <t.icon size={22} />
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2 — form */}
          {type && (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <Field label="Time" htmlFor="gym-time">
                <Input id="gym-time" type="time" value={time} onChange={e => setTime(e.target.value)} />
              </Field>

              {type === 'meal' && (
                <>
                  <Field label="Meal Type">
                    <Select value={form.mealType} onChange={v => set('mealType', v)} options={MEAL_TYPE_OPTIONS} />
                  </Field>
                  <Field label="Food Items">
                    <Textarea rows="2" placeholder="e.g. 4 eggs, 100g oats, 1 banana" value={form.foodItems} onChange={e => set('foodItems', e.target.value)} />
                  </Field>
                  <Field label="Protein (g)">
                    <Input type="number" min="0" value={form.protein} onChange={e => set('protein', e.target.value)} placeholder="e.g. 30" />
                  </Field>
                  <Field label="Notes">
                    <Input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
                  </Field>
                </>
              )}

              {type === 'workout' && (
                <>
                  <div className="gym-field">
                    <label className="gym-label">Workout Type (select one or more)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {WORKOUT_TYPE_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const selected = (form.workoutTypes || []).includes(opt.value);
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => {
                              const current = form.workoutTypes || [];
                              if (selected) {
                                set('workoutTypes', current.filter(v => v !== opt.value));
                              } else {
                                set('workoutTypes', [...current, opt.value]);
                              }
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                              padding: '0.5rem 0.85rem', borderRadius: 10, cursor: 'pointer',
                              fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit',
                              border: selected ? '2px solid #8B5CF6' : '1.5px solid var(--border)',
                              background: selected ? 'rgba(139,92,246,0.1)' : 'var(--card-bg)',
                              color: selected ? '#7C3AED' : 'var(--text-secondary)',
                              transition: 'all 0.15s'
                            }}>
                            <Icon size={15} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Field label="Duration (hours)">
                      <Input type="number" min="0" step="0.1" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 1.5" />
                    </Field>
                    <Field label="Cardio (minutes)">
                      <Input type="number" min="0" step="1" value={form.cardioMinutes} onChange={e => set('cardioMinutes', e.target.value)} placeholder="e.g. 15" />
                    </Field>
                  </div>
                  <Field label="Workout Notes">
                    <Input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
                  </Field>
                </>
              )}

              {type === 'supplement' && (
                <>
                  <Field label="Supplement">
                    <Select value={form.name} onChange={v => set('name', v)} options={SUPPLEMENT_OPTIONS} accent="#3B82F6" />
                  </Field>
                  {form.name === 'Custom' && (
                    <Field label="Custom Name">
                      <Input type="text" value={form.customName} onChange={e => set('customName', e.target.value)} placeholder="e.g. BCAA" />
                    </Field>
                  )}
                  <Field label="Protein (g)">
                    <Input type="number" min="0" value={form.protein} onChange={e => set('protein', e.target.value)} placeholder="e.g. 25" />
                  </Field>
                  <Field label="Notes">
                    <Input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Dosage, timing…" />
                  </Field>
                </>
              )}

              {type === 'weight' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[['bodyWeight', 'Body Weight (kg)'], ['bodyFat', 'Body Fat (%)'], ['waist', 'Waist (in)'], ['chest', 'Chest (in)'], ['arms', 'Arms (in)']].map(([k, l]) => (
                    <Field key={k} label={l}>
                      <Input type="number" step="0.1" min="0" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0" />
                    </Field>
                  ))}
                </div>
              )}

              {type === 'water' && (
                <Field label="Amount (ml)">
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    {WATER_PRESETS.map(v => (
                      <button type="button" key={v} onClick={() => set('amount', v)}
                        style={{ flex: 1, minWidth: 70, padding: '0.7rem', borderRadius: 12, cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
                          border: `1px solid ${Number(form.amount) === v ? '#06B6D4' : 'var(--border)'}`,
                          background: Number(form.amount) === v ? 'rgba(6,182,212,0.12)' : 'var(--card-bg)',
                          color: Number(form.amount) === v ? '#0891B2' : 'var(--text-secondary)', transition: 'all 0.18s' }}>
                        {v}ml
                      </button>
                    ))}
                  </div>
                  <Input type="number" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="Custom ml" />
                </Field>
              )}

              {type === 'note' && (
                <Field label="Note">
                  <Textarea rows="4" value={form.text} onChange={e => set('text', e.target.value)} placeholder="How was your day, how you felt, anything to remember…" />
                </Field>
              )}

              <button type="submit" disabled={saving}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.95rem', color: 'white', background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)', boxShadow: '0 4px 16px rgba(255,126,95,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.25rem' }}>
                {saving ? <div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', animationDuration: '0.4s' }} /> : (editing ? 'Save Changes' : `Add ${meta.label}`)}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const iconBtn = { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 8 };

export default EntryModal;
