import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Sparkles } from 'lucide-react';

const StartScreen = ({ onStart, config }) => {
  const [starting, setStarting] = useState(false);
  const ui = config?.ui?.startScreen || {};
  const anim = config?.animations || {};

  const titleText = ui.titleText || 'Combo Blast';
  const titleInMs = anim.titleInMs ?? 600;
  const buttonInMs = anim.buttonInMs ?? 500;
  const fadeOutMs = anim.screenFadeOutMs ?? 300;

  const overlayClass = useMemo(() => {
    return `fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 transition-opacity ${starting ? 'pointer-events-none animate-[screen-fade-out_'+fadeOutMs+'ms_ease-out_forwards]' : ''}`;
  }, [starting, fadeOutMs]);

  const titleAnimClass = useMemo(() => {
    return `flex items-center gap-3 mb-6 animate-[title-in_${titleInMs}ms_ease-out]`;
  }, [titleInMs]);

  const buttonAnimClass = useMemo(() => {
    return `px-8 py-3 rounded-full font-bold text-white shadow-lg border border-white/10 bg-white/10 hover:bg-white/15 active:scale-95 transition transform animate-[button-in_${buttonInMs}ms_ease-out] ${starting ? 'opacity-80' : ''}`;
  }, [buttonInMs, starting]);

  const handleClick = () => {
    if (starting) return;
    setStarting(true);
    setTimeout(() => { onStart && onStart(); }, fadeOutMs - 20);
  };

  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    window.addEventListener('contextmenu', prevent);
    return () => window.removeEventListener('contextmenu', prevent);
  }, []);

  return (
    <div className={overlayClass}>
      <div className={titleAnimClass}>
        <Flame size={36} className="text-rose-500" fill="currentColor" />
        <div className="text-center">
          <div className="text-5xl md:text-6xl font-black tracking-tight score-stroke gold-metal-text drop-shadow-2xl">{titleText}</div>
        </div>
        <Sparkles size={28} className="text-yellow-400" />
      </div>
      <button onClick={handleClick} className={buttonAnimClass}>
        Click To Start
      </button>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-gradient-to-tr from-fuchsia-600/10 via-yellow-500/5 to-cyan-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default StartScreen;

