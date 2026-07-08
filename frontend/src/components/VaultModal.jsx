import React, { useState, useContext } from 'react';
import { X, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { VaultContext } from '../context/VaultContext';

const MODULES = [
  { key: 'gym', label: 'Gym Tracker' },
  { key: 'office_expenses', label: 'Office Expenses' },
  { key: 'spendflow', label: 'SpendFlow' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'projects', label: 'Projects' },
];

const VaultModal = ({ open, onClose }) => {
  const { hasPin, vaultUnlocked, hiddenModules, unlock, lock, setPin, updateModules } = useContext(VaultContext);
  const [pin, setLocalPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [step, setStep] = useState(hasPin ? 'enter' : 'setup'); // 'setup' | 'enter' | 'panel'
  const [localHidden, setLocalHidden] = useState(hiddenModules);

  if (!open) return null;

  const handleUnlock = async () => {
    try {
      const ok = await unlock(pin);
      if (ok) { setStep('panel'); setLocalHidden(hiddenModules); toast.success('Vault unlocked'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Wrong PIN'); }
  };

  const handleSetup = async () => {
    if (newPin.length < 4) { toast.error('PIN must be 4+ digits'); return; }
    try {
      await setPin(newPin, hasPin ? pin : undefined);
      toast.success('Vault PIN set!');
      setStep('panel');
      setLocalHidden([]);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSaveModules = async () => {
    try {
      await updateModules(pin || newPin, localHidden);
      toast.success('Vault updated');
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleModule = (key) => {
    setLocalHidden(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 380, textAlign: 'center' }}>

        {step === 'setup' && (
          <>
            <Lock size={28} color="#8B5CF6" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Set Vault PIN</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Create a 4-6 digit PIN to protect private modules</p>
            <input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', height: 52, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', borderRadius: 12, border: '1.5px solid var(--border)', outline: 'none', fontFamily: 'inherit' }}
              autoFocus onKeyDown={e => e.key === 'Enter' && handleSetup()} />
            <button onClick={handleSetup} style={{ width: '100%', marginTop: '1rem', height: 48, borderRadius: 12, border: 'none', background: '#0F172A', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Set PIN</button>
          </>
        )}

        {step === 'enter' && (
          <>
            <Lock size={28} color="#8B5CF6" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Enter Vault PIN</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Unlock to access hidden modules</p>
            <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e => setLocalPin(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', height: 52, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', borderRadius: 12, border: '1.5px solid var(--border)', outline: 'none', fontFamily: 'inherit' }}
              autoFocus onKeyDown={e => e.key === 'Enter' && handleUnlock()} />
            <button onClick={handleUnlock} style={{ width: '100%', marginTop: '1rem', height: 48, borderRadius: 12, border: 'none', background: '#0F172A', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Unlock</button>
          </>
        )}

        {step === 'panel' && (
          <>
            <Unlock size={28} color="#10B981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Vault Settings</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Choose which modules to hide</p>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {MODULES.map(m => (
                <label key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0.9rem', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', background: localHidden.includes(m.key) ? 'rgba(139,92,246,0.06)' : 'var(--card-bg)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {localHidden.includes(m.key) ? <EyeOff size={16} color="#8B5CF6" /> : <Eye size={16} color="var(--text-muted)" />}
                    {m.label}
                  </span>
                  <input type="checkbox" checked={localHidden.includes(m.key)} onChange={() => toggleModule(m.key)}
                    style={{ width: 18, height: 18, accentColor: '#8B5CF6', cursor: 'pointer' }} />
                </label>
              ))}
            </div>

            <button onClick={handleSaveModules} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: '#0F172A', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Save & Lock</button>
          </>
        )}

        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
      </div>
    </div>
  );
};

export default VaultModal;
