import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Receipt, Download, FileText, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const CATEGORIES = ['Chai & Snacks', 'Travel', 'Stationery', 'Food', 'Internet/Recharge', 'Parking', 'Courier', 'Petrol', 'Other'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];

const OfficeExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCat, setFilterCat] = useState('All');
  const [filterMonth, setFilterMonth] = useState('');
  const [form, setForm] = useState({ expense_date: new Date().toISOString().split('T')[0], item: '', amount: '', category: 'Chai & Snacks', payment_mode: 'Cash', notes: '' });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCat !== 'All') params.append('category', filterCat);
      if (filterMonth) {
        const [y, m] = filterMonth.split('-');
        params.append('from', `${y}-${m}-01`);
        const lastDay = new Date(Number(y), Number(m), 0).getDate();
        params.append('to', `${y}-${m}-${String(lastDay).padStart(2, '0')}`);
      }
      const res = await api.get(`/office-expenses?${params.toString()}`);
      setExpenses(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filterCat, filterMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotal = expenses.filter(e => (e.expense_date || '').startsWith(todayStr)).reduce((s, e) => s + Number(e.amount), 0);

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
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleEdit = (exp) => {
    setForm({ expense_date: (exp.expense_date || '').split('T')[0], item: exp.item, amount: exp.amount, category: exp.category, payment_mode: exp.payment_mode, notes: exp.notes || '' });
    setEditing(exp); setShowForm(true);
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete this entry?')) return; await api.delete(`/office-expenses/${id}`); toast.success('Deleted'); fetchData(); };

  const exportCSV = () => {
    const rows = [['Date', 'Item', 'Amount (₹)', 'Category', 'Payment Mode', 'Notes']];
    expenses.forEach(e => rows.push([(e.expense_date || '').split('T')[0], e.item, e.amount, e.category, e.payment_mode, e.notes || '']));
    rows.push(['', '', '', '', '', '']);
    rows.push(['', 'TOTAL', `₹${total.toFixed(0)}`, '', '', '']);
    const csv = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `office-expenses${filterMonth ? '-' + filterMonth : ''}.csv`; a.click();
  };

  const exportPDF = () => {
    const tableRows = expenses.map(e => `<tr><td>${(e.expense_date || '').split('T')[0]}</td><td>${e.item}</td><td style="text-align:right;font-weight:700;">₹${Number(e.amount).toFixed(0)}</td><td>${e.category}</td><td>${e.payment_mode}</td><td style="color:#64748B;">${e.notes || '-'}</td></tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) { toast.error('Allow pop-ups for PDF'); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Office Expenses</title>
      <style>
        body{font-family:'Inter',Arial,sans-serif;color:#1E293B;padding:40px;max-width:900px;margin:0 auto;}
        h1{font-size:22px;margin:0 0 4px;} .sub{color:#64748B;margin:0 0 24px;font-size:13px;}
        .stats{display:flex;gap:16px;margin-bottom:24px;} .stat{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 18px;}
        .stat-label{font-size:11px;text-transform:uppercase;color:#94A3B8;font-weight:700;} .stat-value{font-size:20px;font-weight:800;margin-top:2px;}
        table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;}
        th{text-align:left;padding:10px 12px;background:#F8FAFC;border-bottom:2px solid #E2E8F0;font-size:11px;text-transform:uppercase;color:#64748B;font-weight:700;}
        td{padding:10px 12px;border-bottom:1px solid #F1F5F9;}
        .total-row td{font-weight:800;font-size:14px;border-top:2px solid #1E293B;background:#F8FAFC;}
        .footer{margin-top:32px;text-align:center;font-size:11px;color:#94A3B8;}
      </style></head><body>
      <h1>Office Expenses Report</h1>
      <p class="sub">${filterMonth ? `Month: ${filterMonth}` : 'All time'} · Generated: ${new Date().toLocaleDateString('en-IN')}</p>
      <div class="stats">
        <div class="stat"><div class="stat-label">Total</div><div class="stat-value">₹${total.toFixed(0)}</div></div>
        <div class="stat"><div class="stat-label">Entries</div><div class="stat-value">${expenses.length}</div></div>
        <div class="stat"><div class="stat-label">Today</div><div class="stat-value">₹${todayTotal.toFixed(0)}</div></div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Item</th><th style="text-align:right;">Amount</th><th>Category</th><th>Payment</th><th>Notes</th></tr></thead>
        <tbody>${tableRows}<tr class="total-row"><td></td><td>TOTAL</td><td style="text-align:right;">₹${total.toFixed(0)}</td><td></td><td></td><td></td></tr></tbody>
      </table>
      <div class="footer">Helios · Office Expense Report</div>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Office Expenses</h2>
          <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Daily office purchases — track for reimbursement</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => { setEditing(null); setForm({ expense_date: new Date().toISOString().split('T')[0], item: '', amount: '', category: 'Chai & Snacks', payment_mode: 'Cash', notes: '' }); setShowForm(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#0F172A', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            <Plus size={17} /> Add
          </button>
          <button onClick={exportCSV} style={ghostBtn}><Download size={15} /> CSV</button>
          <button onClick={exportPDF} style={ghostBtn}><FileText size={15} /> PDF</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
        {[
          { label: 'Total', value: `₹${total.toFixed(0)}`, color: '#0F172A' },
          { label: 'Today', value: `₹${todayTotal.toFixed(0)}`, color: '#8B5CF6' },
          { label: 'Entries', value: expenses.length, color: '#10B981' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--glass-strong)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', backdropFilter: 'blur(16px)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: c.color, marginTop: '0.15rem' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: '0.45rem 0.8rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={14} color="var(--text-muted)" />
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            style={{ padding: '0.4rem 0.7rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }} />
          {filterMonth && <button onClick={() => setFilterMonth('')} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Clear</button>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : expenses.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Receipt size={40} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>No expenses yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>Tap "Add" to start tracking</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--glass-strong)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--table-head-bg)' }}>
                <th style={th}>Date</th>
                <th style={th}>Item</th>
                <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                <th style={th}>Category</th>
                <th style={th}>Payment</th>
                <th style={th}>Notes</th>
                <th style={{ ...th, width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={td}>{(exp.expense_date || '').split('T')[0]}</td>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--text-primary)' }}>{exp.item}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>₹{Number(exp.amount).toFixed(0)}</td>
                  <td style={td}><span style={{ background: 'rgba(139,92,246,0.08)', color: '#7C3AED', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>{exp.category}</span></td>
                  <td style={td}>{exp.payment_mode}</td>
                  <td style={{ ...td, color: 'var(--text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.notes || '-'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleEdit(exp)} style={actBtn}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(exp.id)} style={actBtn}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--table-head-bg)' }}>
                <td style={{ ...td, fontWeight: 800 }}></td>
                <td style={{ ...td, fontWeight: 800 }}>TOTAL</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>₹{total.toFixed(0)}</td>
                <td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td>
              </tr>
            </tbody>
          </table>
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
              <button type="submit" style={{ height: 50, border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, background: '#0F172A', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {editing ? 'Save Changes' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const th = { padding: '0.7rem 0.85rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left' };
const td = { padding: '0.7rem 0.85rem', fontSize: '0.85rem', color: 'var(--text-secondary)' };
const actBtn = { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' };
const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' };

export default OfficeExpenses;
