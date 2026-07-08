import React, { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContext';

export const VaultContext = createContext();

export const VaultProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [hiddenModules, setHiddenModules] = useState([]);
  const [hasPin, setHasPin] = useState(false);
  const timerRef = useRef(null);

  // Check vault status on login
  useEffect(() => {
    if (!user) { setVaultUnlocked(false); setHiddenModules([]); return; }
    api.get('/vault/status').then(r => {
      setHasPin(r.data.hasPin);
      setHiddenModules(r.data.hiddenModules || []);
    }).catch(() => {});
  }, [user]);

  // Auto-lock after 30 min idle
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (vaultUnlocked) {
      timerRef.current = setTimeout(() => setVaultUnlocked(false), 30 * 60 * 1000);
    }
  }, [vaultUnlocked]);

  useEffect(() => {
    if (!vaultUnlocked) return;
    resetTimer();
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => { events.forEach(e => window.removeEventListener(e, resetTimer)); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [vaultUnlocked, resetTimer]);

  // Lock on tab hide
  useEffect(() => {
    const onVis = () => { if (document.hidden && vaultUnlocked) setVaultUnlocked(false); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [vaultUnlocked]);

  const unlock = async (pin) => {
    const res = await api.post('/vault/unlock', { pin });
    if (res.data.unlocked) {
      setVaultUnlocked(true);
      setHiddenModules(res.data.hiddenModules || []);
      return true;
    }
    return false;
  };

  const lock = () => setVaultUnlocked(false);

  const isHidden = (moduleKey) => !vaultUnlocked && hiddenModules.includes(moduleKey);

  const updateModules = async (pin, modules) => {
    await api.put('/vault/modules', { pin, hiddenModules: modules });
    setHiddenModules(modules);
  };

  const setPin = async (pin, currentPin) => {
    await api.post('/vault/set-pin', { pin, currentPin });
    setHasPin(true);
  };

  return (
    <VaultContext.Provider value={{ vaultUnlocked, hasPin, hiddenModules, unlock, lock, isHidden, updateModules, setPin }}>
      {children}
    </VaultContext.Provider>
  );
};
