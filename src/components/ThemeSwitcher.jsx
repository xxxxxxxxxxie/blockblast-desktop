import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Palette } from 'lucide-react';

const THEMES = [
  {
    key: 'neo-slate',
    name: 'Neo Slate',
    vars: {
      '--bg-main': 'rgba(2,6,23,1)',
      '--board-bg': 'rgba(11,18,32,1)',
      '--board-border': 'rgba(51,65,85,1)',
      '--cell-bg': 'rgba(31,41,55,1)',
      '--text-primary': 'rgba(255,255,255,0.92)',
      '--text-muted': 'rgba(148,163,184,1)',
      '--accent': 'rgba(250,204,21,1)',
      '--button-bg': 'rgba(255,255,255,0.06)',
      '--button-border': 'rgba(255,255,255,0.08)',
      '--font-family': 'system-ui, Avenir, Helvetica, Arial, sans-serif'
    }
  },
  {
    key: 'aurora',
    name: 'Aurora',
    vars: {
      '--bg-main': 'linear-gradient(180deg, rgba(8,9,25,1) 0%, rgba(5,18,35,1) 100%)',
      '--board-bg': 'rgba(5,28,46,0.9)',
      '--board-border': 'rgba(56,189,248,0.5)',
      '--cell-bg': 'rgba(12,74,110,0.6)',
      '--text-primary': 'rgba(240,249,255,1)',
      '--text-muted': 'rgba(186,230,253,1)',
      '--accent': 'rgba(56,189,248,1)',
      '--button-bg': 'rgba(56,189,248,0.15)',
      '--button-border': 'rgba(56,189,248,0.4)',
      '--font-family': 'system-ui, Avenir, Helvetica, Arial, sans-serif'
    }
  },
  {
    key: 'cyber-neon',
    name: 'Cyber Neon',
    vars: {
      '--bg-main': 'linear-gradient(180deg, rgba(10,3,25,1) 0%, rgba(10,20,35,1) 100%)',
      '--board-bg': 'rgba(12,12,20,0.95)',
      '--board-border': 'rgba(168,85,247,0.6)',
      '--cell-bg': 'rgba(24,24,40,0.8)',
      '--text-primary': 'rgba(250,250,255,0.95)',
      '--text-muted': 'rgba(199,210,254,1)',
      '--accent': 'rgba(244,114,182,1)',
      '--button-bg': 'rgba(168,85,247,0.14)',
      '--button-border': 'rgba(168,85,247,0.5)',
      '--font-family': 'system-ui, Avenir, Helvetica, Arial, sans-serif'
    }
  },
  {
    key: 'classic',
    name: 'Classic',
    vars: {
      '--bg-main': 'rgba(20,20,20,1)',
      '--board-bg': 'rgba(30,30,30,1)',
      '--board-border': 'rgba(80,80,80,1)',
      '--cell-bg': 'rgba(50,50,50,1)',
      '--text-primary': 'rgba(250,250,250,0.92)',
      '--text-muted': 'rgba(160,160,160,1)',
      '--accent': 'rgba(255,163,0,1)',
      '--button-bg': 'rgba(255,255,255,0.06)',
      '--button-border': 'rgba(255,255,255,0.1)',
      '--font-family': 'system-ui, Avenir, Helvetica, Arial, sans-serif'
    }
  }
];

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('cb_theme') || 'neo-slate');
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const [panelReady, setPanelReady] = useState(false);

  useEffect(() => {
    const t = THEMES.find(x => x.key === theme) || THEMES[0];
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.style.fontFamily = t.vars['--font-family'] || 'inherit';
    localStorage.setItem('cb_theme', theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setPanelReady(false);
      const id = setTimeout(() => setPanelReady(true), 10);
      return () => clearTimeout(id);
    }
    setPanelReady(false);
  }, [open]);

  const current = useMemo(() => THEMES.find(x => x.key === theme), [theme]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="transition text-white/80 w-fit flex items-center justify-center"
        style={{
          width: '2.5rem',
          height: '2.5rem',
          backgroundColor: 'var(--button-bg)',
          borderColor: 'var(--button-border)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: '50%'
        }}
        aria-label="Theme"
      >
        <Palette size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[100]" onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); btnRef.current?.focus(); } }} onTouchStart={(e) => { if (e.target === e.currentTarget) { setOpen(false); btnRef.current?.focus(); } }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            ref={panelRef}
            className="absolute bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl"
            style={{ top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${panelReady ? 1 : 0.95})`, transition: 'transform 180ms ease, opacity 180ms ease', width: '16rem' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-bold text-white/70 mb-2 text-center">Theme</div>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(t => (
                <button
                  key={t.key}
                  onClick={() => {
                    panelRef.current && (panelRef.current.style.transform = 'translate(-50%, -50%) scale(0.92)');
                    setTimeout(() => { setTheme(t.key); setOpen(false); btnRef.current?.focus(); }, 140);
                  }}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition ${theme === t.key ? 'border-white/30' : 'border-white/10'} hover:border-white/30`}
                >
                  <div
                    style={{
                      width: '6rem',
                      height: '3.5rem',
                      borderRadius: '0.625rem',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: t.vars['--bg-main']
                    }}
                  />
                  <div className="text-xs font-medium text-white/80">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
