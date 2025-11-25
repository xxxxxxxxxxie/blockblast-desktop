import { useEffect, useState } from 'react';

const defaultConfig = {
  ui: {
    startScreen: {
      titleText: 'Combo Blast'
    },
    layout: {
      verticalReserved: 260,
      horizontalPadding: 32,
      boardMin: 280,
      boardMax: 500,
      smallScreenHeightThreshold: 667
    }
  },
  animations: {
    titleInMs: 600,
    buttonInMs: 500,
    screenFadeOutMs: 300
  }
};

export function useUIConfig() {
  const [cfg, setCfg] = useState(defaultConfig);

  useEffect(() => {
    let mounted = true;
    import('../ui_config.json')
      .then((mod) => { if (mounted && mod?.default) setCfg(mod.default); })
      .catch(() => {});

    if (import.meta.hot) {
      import.meta.hot.accept('../ui_config.json', (mod) => {
        if (mod?.default) setCfg(mod.default);
      });
    }

    return () => { mounted = false; };
  }, []);

  return cfg;
}

