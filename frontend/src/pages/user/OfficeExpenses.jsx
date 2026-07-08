import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Receipt, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const CATEGORIES = ['Chai & Snacks', 'Travel', 'Stationery', 'Food', 'Internet/Recharge', 'Parking', 'Courier', 'Other'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];
const STATUS_COLORS = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444' };

const OfficeExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, count: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ expense_date: new Date().toISOString().split('T')[0], item: '', amount: '', category: 'Chai & Snacks', payment_mode: 'Cash', notes: '' });

  const fetch = useCallback(async () => {
    try {
      const [res, sum] = await Promise.all([
        api.get(`/office-expenses?status=${filter}`),
        api.get('/office-expenses/summary')
      ]);
      setExpenses(res.data);
      setSummary(sum.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.item.trim() || !form.amount) { toast.error('Item and amount required'); return; }
    try {
      if (editing) {
        await api.put(`/office-expenses/${editing.id}`, form);
        toast.success('Updated');
      } else {
        await api.post('/office-expenses', form);
        toast.success('Added');
      }
      setShowForm(false); setEditing(null);
      setForm({ expense_date: new Date().toISOString().split('T')[0], item: '', amount: '', category: 'Chai & Snacks', payment_mode: 'Cash', notes: '' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleEdit = (exp) => { setForm({ expense_date: exp.expense_date?.split('T')[0] || '', item: exp.item, amount: exp.amount, category: exp.category, payment_mode: exp.payment_mode, notes: exp.notes || '' }); setEditing(exp); setShowForm(true); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await api.delete(`/office-expenses/${id}`); toast.success('Deleted'); fetch(); };

  const exportCSV = () => {
    const rows = [['Date', 'Item', 'Amount', 'Category', 'Payment', 'Status', 'Notes']];
    expenses.forEach(e => rows.push([e.expense_date?.split('T')[0], e.item, e.amount, e.category, e.payment_mode, e.status, e.notes || '']));
    const csv = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'office-expenses.csv'; a.click();
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Office Expenses</h2>
          <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Track daily office purchases for reimbursement</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => { setEditing(null); setForm({ expense_date: new Date().toISOString().split('T')[0], item: '', amount: '', category: 'Chai & Snacks', payment_mode: 'Cash', notes: '' }); setShowForm(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#0F172A', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            <Plus size={17} /> Add Expense
          </button>
          <button onClick={exportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <Download size={15} /> CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Spent', value: `₹${summary.total.toFixed(0)}`, color: '#0F172A' },
          { label: 'Pending', value: `₹${summary.pending.toFixed(0)}`, color: '#F59E0B' },
          { label: 'Approved', value: `₹${summary.approved.toFixed(0)}`, color: '#10B981' },
          { label: 'Entries', value: summary.count, color: '#8B5CF6' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--glass-strong)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.1rem', backdropFilter: 'blur(16px)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color, marginTop: '0.2rem' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={15} color="var(--text-muted)" />
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '0.4rem 0.85rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', border: filter === s ? '1.5px solid #8B5CF6' : '1px solid var(--border)', background: filter === s ? 'rgba(139,92,246,0.08)' : 'var(--card-bg)', color: filter === s ? '#7C3AED' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Expenses list */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : expenses.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Receipt size={40} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>No expenses yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>Tap "Add Expense" to start tracking</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {expenses.map(exp => (
            <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.1rem', background: 'var(--glass-strong)', border: '1px solid var(--border)', borderRadius: 14, backdropFilter: 'blur(16px)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{exp.item}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 999, background: `${STATUS_COLORS[exp.status]}15`, color: STATUS_COLORS[exp.status], textTransform: 'uppercase' }}>{exp.status}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{exp.category}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {exp.expense_date?.split('T')[0]} · {exp.payment_mode}{exp.notes ? ` · ${exp.notes}` : ''}
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', flexShrink: 0 }}>₹{Number(exp.amount).toFixed(0)}</div>
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <button onClick={() => handleEdit(exp)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}><Edit2 size={15} /></button>
                <button onClick={() => handleDelete(exp.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditing(null); } }}>
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{editing ? 'Edit Expense' : 'Add Office Expense'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="gym-field">
                <label className="gym-label">Date</label>
                <input type="date" className="gym-input" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
              </div>
              <div className="gym-field">
                <label className="gym-label">Item / Description</label>
                <input type="text" className="gym-input" value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="gym-field">
                  <label className="gym-label">Amount (₹)</label>
                  <input type="number" min="0" step="1" className="gym-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="gym-field">
                  <label className="gym-label">Category</label>
                  <select className="gym-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="gym-field">
                <label className="gym-label">Payment Mode</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {PAYMENT_MODES.map(m => (
                    <button type="button" key={m} onClick={() => setForm(f => ({ ...f, payment_mode: m }))}
                      style={{ flex: 1, padding: '0.55rem', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', border: form.payment_mode === m ? '1.5px solid #8B5CF6' : '1px solid var(--border)', background: form.payment_mode === m ? 'rgba(139,92,246,0.08)' : 'var(--card-bg)', color: form.payment_mode === m ? '#7C3AED' : 'var(--text-secondary)' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="gym-field">
                <label className="gym-label">Notes (optional)</label>
                <input type="text" className="gym-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <button type="submit" style={{ height: 50, border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, background: '#0F172A', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(15,23,42,0.2)' }}>
                {editing ? 'Save Changes' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeExpenses;
