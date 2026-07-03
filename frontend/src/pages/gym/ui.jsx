import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Field — label + control wrapper with consistent premium spacing.
 */
export const Field = ({ label, htmlFor, children, hint }) => (
  <div className="gym-field">
    {label && <label className="gym-label" htmlFor={htmlFor}>{label}</label>}
    {children}
    {hint && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{hint}</span>}
  </div>
);

export const Input = ({ invalid, className = '', ...props }) => (
  <input className={`gym-input${invalid ? ' gym-invalid' : ''}${className ? ' ' + className : ''}`} {...props} />
);

export const Textarea = ({ invalid, className = '', ...props }) => (
  <textarea className={`gym-input${invalid ? ' gym-invalid' : ''}${className ? ' ' + className : ''}`} {...props} />
);

/**
 * Select — accessible custom dropdown (no native <select>, no emoji).
 * options: array of strings OR { value, label, icon? }
 */
export const Select = ({ value, onChange, options = [], placeholder = 'Select…', id, accent = '#FF7E5F' }) => {
  const norm = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const selected = norm.find(o => o.value === value);
  const SelIcon = selected?.icon;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open) setActive(Math.max(0, norm.findIndex(o => o.value === value)));
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    if (open && listRef.current && listRef.current.children[active]) {
      listRef.current.children[active].scrollIntoView({ block: 'nearest' });
    }
  }, [active, open]);

  const choose = (v) => { onChange(v); setOpen(false); if (btnRef.current) btnRef.current.focus(); };

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); if (btnRef.current) btnRef.current.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(norm.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(norm.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (norm[active]) choose(norm[active].value); }
  };

  return (
    <div className="gym-select" ref={rootRef}>
      <button
        type="button" ref={btnRef} id={id}
        className={`gym-select-trigger${open ? ' open' : ''}`}
        aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen(o => !o)} onKeyDown={onKeyDown}
      >
        <span className="gym-select-value">
          {SelIcon && <SelIcon size={17} style={{ color: accent, flexShrink: 0 }} />}
          <span>{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown size={17} className="gym-select-chevron" />
      </button>

      {open && (
        <ul className="gym-select-panel" role="listbox" ref={listRef} tabIndex={-1}>
          {norm.map((o, i) => {
            const Ico = o.icon;
            const isSel = o.value === value;
            return (
              <li
                key={o.value} role="option" aria-selected={isSel}
                className={`gym-option${isSel ? ' selected' : ''}${i === active && !isSel ? ' active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o.value)}
              >
                {Ico && <span className="gym-option-ico"><Ico size={17} /></span>}
                <span>{o.label}</span>
                {isSel && <Check size={15} className="gym-option-check" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
