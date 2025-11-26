import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Trophy, RotateCcw, Crown, Flame, Sparkles, Loader2, Settings, Volume2, VolumeX, Vibrate, Languages, X, Heart, HeartCrack } from 'lucide-react';

import { getRandomShape, getBlockClass, GRID_SIZE } from './utils/shapeGenerator';
import { UI_CONFIG } from './utils/uiConfig';

// --- API 配置 ---
const apiKey = ""; // 系统会自动注入 API Key

// --- 游戏配置与常量 ---
// GRID_SIZE moved to utils


// --- 手感参数配置 ---
const TOUCH_OFFSET_Y = 80;
const MOUSE_OFFSET_Y = 0;
const TOUCH_SENSITIVITY = 1.3;
const MOUSE_SENSITIVITY = 1.0;
//------------------------
// --- 称赞语配置 (多语言) ---
const PRAISE_TEXTS = {
  en: [
    { threshold: 0, text: "Good", style: "text-white font-extrabold text-3xl" },
    { threshold: 30, text: "Good Job!", style: "text-blue-300 font-black text-4xl" },
    { threshold: 50, text: "Great Clear!", style: "text-green-300 font-black text-4xl drop-shadow-md" },
    { threshold: 80, text: "Excellent!", style: "text-yellow-300 font-black text-5xl" },
    { threshold: 120, text: "Fantastic!", style: "text-orange-400 font-black text-5xl score-stroke" },
    { threshold: 180, text: "Perfect Hit!", style: "text-pink-400 font-black text-6xl score-stroke drop-shadow-lg" },
    { threshold: 250, text: "Superb!", style: "text-purple-400 font-black text-6xl score-stroke flame-text" },
    { threshold: 350, text: "Unbelievable!", style: "text-fuchsia-500 font-black text-7xl score-stroke flame-purple" },
    { threshold: 500, text: "World Class!", style: "text-cyan-400 font-black text-7xl score-stroke flame-blue" },
    { threshold: 700, text: "Godlike!", style: "text-rose-500 font-black text-8xl score-stroke flame-gold" },
    { threshold: 1000, text: "Legendary!", style: "gold-metal-text font-black text-8xl score-stroke filter drop-shadow-xl" },
  ],
  zh: [
    { threshold: 0, text: "好样!", style: "text-white font-extrabold text-3xl" },
    { threshold: 30, text: "干得好!", style: "text-blue-300 font-black text-4xl" },
    { threshold: 50, text: "漂亮消除!", style: "text-green-300 font-black text-4xl drop-shadow-md" },
    { threshold: 80, text: "太棒了!", style: "text-yellow-300 font-black text-5xl" },
    { threshold: 120, text: "精彩绝伦!", style: "text-orange-400 font-black text-5xl score-stroke" },
    { threshold: 180, text: "完美一击!", style: "text-pink-400 font-black text-6xl score-stroke drop-shadow-lg" },
    { threshold: 250, text: "超凡入圣!", style: "text-purple-400 font-black text-6xl score-stroke flame-text" },
    { threshold: 350, text: "难以置信!", style: "text-fuchsia-500 font-black text-7xl score-stroke flame-purple" },
    { threshold: 500, text: "世界级!", style: "text-cyan-400 font-black text-7xl score-stroke flame-blue" },
    { threshold: 700, text: "超神了!", style: "text-rose-500 font-black text-8xl score-stroke flame-gold" },
    { threshold: 1000, text: "传说级!", style: "gold-metal-text font-black text-8xl score-stroke filter drop-shadow-xl" },
  ]
};

const PRAISE_DURATIONS = [800, 1000, 1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000, 4000];

const EFFECT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
];

// --- 辅助函数 ---
// getRandomShape moved to utils

const createEmptyGrid = () => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

// 获取 Combo 样式配置
const getComboStyle = (combo) => {
  let containerClass = 'opacity-50 grayscale scale-90';
  let colorClass = 'text-slate-500';
  let scaleStyle = {};
  let animationStyle = {};
  let glowStyle = {};

  if (combo > 0) {
    containerClass = 'opacity-100';

    const baseScale = Math.min(1 + combo * 0.05, 1.5);
    scaleStyle = { transform: `scale(${baseScale})` };

    const maxDuration = 0.6;
    const minDuration = 0.1;
    const maxComboThreshold = 20;
    const progress = Math.min(combo, maxComboThreshold) / maxComboThreshold;
    const currentDuration = maxDuration - (progress * (maxDuration - minDuration));
    animationStyle = { animation: `shake-vertical ${currentDuration.toFixed(3)}s infinite linear` };

    if (combo < 3) {
      colorClass = 'text-blue-400';
      glowStyle = { filter: 'drop-shadow(0 0 5px rgba(96, 165, 250, 0.6))' };
    } else if (combo < 6) {
      colorClass = 'text-purple-400';
      glowStyle = { filter: 'drop-shadow(0 0 8px rgba(192, 132, 252, 0.8))' };
    } else if (combo < 10) {
      colorClass = 'text-pink-500';
      glowStyle = { filter: 'drop-shadow(0 0 12px rgba(244, 114, 182, 0.9))' };
    } else {
      colorClass = 'text-yellow-400';
      glowStyle = { filter: 'drop-shadow(0 0 15px rgba(250, 204, 21, 1)) brightness(1.2)' };
    }
  } else {
    // Combo 0 state
    containerClass = 'opacity-40 grayscale scale-90';
    colorClass = 'text-slate-500';
  }

  return { containerClass, colorClass, scaleStyle, animationStyle, glowStyle };
};

const THEMES = {
  classic: { bg: 'bg-slate-950', board: 'bg-slate-900', name: 'Classic', color: 'bg-slate-900' },
  light: { bg: 'bg-slate-100', board: 'bg-white', name: 'Light', color: 'bg-slate-200' },
  ocean: { bg: 'bg-cyan-950', board: 'bg-cyan-900', name: 'Ocean', color: 'bg-cyan-900' },
  nature: { bg: 'bg-green-950', board: 'bg-green-900', name: 'Nature', color: 'bg-green-900' },
};

// --- 多语言配置 ---
const TEXTS = {
  en: {
    score: "Score",
    best: "BEST",
    combo: "COMBO",
    newRecord: "NEW RECORD!",
    gameOver: "Game Over!",
    tryAgain: "Try Again",
    restartTitle: "Restart Game?",
    restartMsg: "Current progress will be lost.",
    cancel: "Cancel",
    restart: "Restart",
    settings: "Settings",
    sound: "Sound",
    vibration: "Vibration",
    language: "Language",
    on: "ON",
    off: "OFF",
    noSpace: "No Space!",
  },
  zh: {
    score: "得分",
    best: "最高分",
    combo: "连击",
    newRecord: "新纪录!",
    gameOver: "游戏结束!",
    tryAgain: "再来一局",
    restartTitle: "重新开始?",
    restartMsg: "当前进度将会丢失。",
    cancel: "取消",
    restart: "重来",
    settings: "设置",
    sound: "音效",
    vibration: "震动",
    language: "语言",
    on: "开",
    off: "关",
    noSpace: "没位置了!",
  }
};

const App = () => {
  // 游戏核心状态
  const [grid, setGrid] = useState(createEmptyGrid());
  const [availableShapes, setAvailableShapes] = useState([]);
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [initialBestScore, setInitialBestScore] = useState(0);
  const [hasBrokenRecord, setHasBrokenRecord] = useState(false);
  const [showNewRecordAnim, setShowNewRecordAnim] = useState(false);

  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(2); // 初始2条命
  const [showHeartBreak, setShowHeartBreak] = useState(false); // 心碎动画
  const [showNoSpace, setShowNoSpace] = useState(false); // 没位置了动画

  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const [praise, setPraise] = useState(null);

  const clearedInRound = useRef(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // --- 设置状态 ---
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('blockBlastSettings');
    // 默认语言改为中文 'zh'
    return saved ? { ...JSON.parse(saved), theme: JSON.parse(saved).theme || 'classic' } : { sound: true, vibration: true, language: 'zh', theme: 'classic' };
  });

  useEffect(() => {
    localStorage.setItem('blockBlastSettings', JSON.stringify(settings));
  }, [settings]);

  const t = TEXTS[settings.language]; // 当前语言包

  const scoreRef = useRef(null);
  const bottomAreaRef = useRef(null);

  const dragInfoRef = useRef({
    isDragging: false,
    isTouch: false,
    startX: 0,
    startY: 0,
    blockStartX: 0,
    blockStartY: 0
  });

  const [explosions, setExplosions] = useState([]);
  const [flyingScores, setFlyingScores] = useState([]);

  const [draggingShape, setDraggingShape] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [previewPlacement, setPreviewPlacement] = useState(null);
  const [previewClears, setPreviewClears] = useState({ rows: [], cols: [] });

  const gridRef = useRef(null);

  // --- 布局自适应状态 ---
  const [boardSize, setBoardSize] = useState(320);
  const [isCompact, setIsCompact] = useState(false);

  // AI 分析状态
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Screen Shake State
  const [shakeClass, setShakeClass] = useState('');

  const triggerScreenShake = (intensity) => {
    if (!settings.vibration) return;

    let cls = '';
    let duration = 0;
    switch (intensity) {
      case 'light': cls = 'animate-shake-light'; duration = 100; break;
      case 'medium': cls = 'animate-shake-medium'; duration = 200; break;
      case 'heavy': cls = 'animate-shake-heavy'; duration = 300; break;
      default: return;
    }

    setShakeClass(cls);
    setTimeout(() => setShakeClass(''), duration);
  };

  // --- 布局计算 Effect ---
  useEffect(() => {
    const calculateLayout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // 预留给顶部 UI 和底部方块的高度
      // 顶部约 120px (含 padding), 底部约 140px
      const verticalReserved = 260;
      const horizontalPadding = 32; // px-4 * 2

      const maxBoardHeight = h - verticalReserved;
      const maxBoardWidth = w - horizontalPadding;

      // 棋盘是正方形，取宽高的较小值
      let size = Math.min(maxBoardHeight, maxBoardWidth);

      // 限制最大尺寸，避免在大屏上过大
      size = Math.min(size, 500);

      // 限制最小尺寸，避免不可玩 (虽然正常手机不会小于 280)
      size = Math.max(size, 280);

      setBoardSize(size);
      setIsCompact(h < 667); // iPhone SE 等小屏判定
    };

    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, []);

  // --- 初始化 ---
  useEffect(() => {
    startNewGame();
    const savedBest = localStorage.getItem('blockBlastBestScore');
    if (savedBest) {
      const parsedBest = parseInt(savedBest);
      setBestScore(isNaN(parsedBest) ? 0 : parsedBest);
      setInitialBestScore(isNaN(parsedBest) ? 0 : parsedBest);
    }
  }, []);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('blockBlastBestScore', score.toString());
      if (initialBestScore > 0 && !hasBrokenRecord) {
        setHasBrokenRecord(true);
        setShowNewRecordAnim(true);
        setTimeout(() => setShowNewRecordAnim(false), 3000);
      }
    }
  }, [score, bestScore, initialBestScore, hasBrokenRecord]);

  useEffect(() => {
    if (combo > maxCombo) setMaxCombo(combo);
  }, [combo]);

  useEffect(() => {
    if (displayScore === score) return;
    const diff = score - displayScore;
    const step = Math.ceil(diff / 10);
    const timer = requestAnimationFrame(() => {
      setDisplayScore(prev => {
        const next = prev + step;
        return next >= score ? score : next;
      });
    });
    return () => cancelAnimationFrame(timer);
  }, [score, displayScore]);

  useEffect(() => {
    if (gameOver) return;
    const activeShapes = availableShapes.filter(s => s !== null);
    if (activeShapes.length === 0) return;

    const timer = setTimeout(() => {
      if (checkGameOver(grid, activeShapes)) {
        if (lives > 0) {
          // 还有命，触发复活逻辑
          handleRevive();
        } else {
          // 没命了，显示没位置了，然后结束
          setShowNoSpace(true);
          setTimeout(() => {
            setShowNoSpace(false);
            setGameOver(true);
          }, 1500);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [availableShapes, grid, gameOver, lives]);

  const startNewGame = () => {
    setGrid(createEmptyGrid());
    setScore(0);
    setDisplayScore(0);
    setCombo(0);
    setMaxCombo(0);
    setGameOver(false);
    setLives(2);
    setShowHeartBreak(false);
    setShowNoSpace(false);
    setAiAnalysis('');
    setExplosions([]);
    setFlyingScores([]);
    setShowRestartModal(false);
    setHasBrokenRecord(false);
    setShowNewRecordAnim(false);
    setPraise(null);
    const currentSaved = parseInt(localStorage.getItem('blockBlastBestScore') || '0');
    setInitialBestScore(isNaN(currentSaved) ? 0 : currentSaved);

    clearedInRound.current = false;
    setPreviewClears({ rows: [], cols: [] });
    refillShapes();
  };

  const handleRevive = () => {
    setLives(prev => prev - 1);
    setShowHeartBreak(true);
    setTimeout(() => setShowHeartBreak(false), 1000);

    // 清除中间 4x4 区域
    const newGrid = grid.map(row => [...row]);
    const start = 2;
    const end = 6;
    for (let r = start; r < end; r++) {
      for (let c = start; c < end; c++) {
        newGrid[r][c] = null;
      }
    }
    setGrid(newGrid);

    // 刷新手牌
    refillShapes();
  };

  const refillShapes = () => {
    // 传入当前分数和棋盘状态用于计算概率
    setAvailableShapes([
      getRandomShape(score, grid),
      getRandomShape(score, grid),
      getRandomShape(score, grid)
    ]);
    clearedInRound.current = false;
  };

  const triggerPraise = (points) => {
    const lang = settings.language || 'zh';
    const texts = PRAISE_TEXTS[lang];
    // 找到对应阈值的配置索引
    const index = [...texts].reverse().findIndex(p => points >= p.threshold);

    if (index !== -1) {
      // 修正 reverse 后的索引
      const originalIndex = texts.length - 1 - index;
      const config = texts[originalIndex];
      const duration = PRAISE_DURATIONS[originalIndex];

      const id = Date.now();
      setPraise({ ...config, duration, id });
      setTimeout(() => {
        setPraise(prev => (prev && prev.id === id ? null : prev));
      }, duration);
    }
  };

  const addFlyingScore = (points, startRect, isCombo) => {
    if (!startRect || !scoreRef.current) return;

    const scoreRect = scoreRef.current.getBoundingClientRect();
    const moveX = (scoreRect.left + scoreRect.width / 2) - (startRect.left + startRect.width / 2);
    const moveY = (scoreRect.top + scoreRect.height / 2) - (startRect.top + startRect.height / 2);

    const randomColor = EFFECT_COLORS[Math.floor(Math.random() * EFFECT_COLORS.length)];
    const rotationDir = Math.random() > 0.5 ? 1 : -1;

    const id = Date.now() + Math.random();
    setFlyingScores(prev => [...prev, {
      id,
      x: startRect.left + startRect.width / 2,
      y: startRect.top + startRect.height / 2,
      text: `+${points}`,
      moveX,
      moveY,
      isCombo,
      color: randomColor,
      rotationDir
    }]);

    setTimeout(() => {
      setFlyingScores(prev => prev.filter(fs => fs.id !== id));
    }, 1200);
  };

  const analyzeGame = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `
        The player just finished a game of Block Blast.
        Stats: Score: ${score}, Best Score: ${bestScore}, Max Combo: ${maxCombo}.
        Give a short, witty, 2-sentence reaction.
      `;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) setAiAnalysis(text);
      else throw new Error("Invalid response");
    } catch (error) {
      console.error("Analysis failed:", error);
      setAiAnalysis("The AI is currently speechless. Great job anyway!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // getBlockClass imported from utils

  const canPlaceShape = (currentGrid, shapeMatrix, startR, startC) => {
    const rows = shapeMatrix.length;
    const cols = shapeMatrix[0].length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shapeMatrix[r][c] === 1) {
          const gridR = startR + r;
          const gridC = startC + c;
          if (gridR < 0 || gridR >= GRID_SIZE || gridC < 0 || gridC >= GRID_SIZE) return false;
          if (currentGrid[gridR][gridC] !== null) return false;
        }
      }
    }
    return true;
  };

  const checkGameOver = (currentGrid, shapes) => {
    if (!shapes || shapes.length === 0) return false;
    for (let s = 0; s < shapes.length; s++) {
      const shape = shapes[s];
      if (!shape) continue;
      const rows = shape.matrix.length;
      const cols = shape.matrix[0].length;
      for (let r = 0; r <= GRID_SIZE - rows; r++) {
        for (let c = 0; c <= GRID_SIZE - cols; c++) {
          if (canPlaceShape(currentGrid, shape.matrix, r, c)) return false;
        }
      }
    }
    return true;
  };

  const clearLines = (newGrid, triggerRect) => {
    let linesCleared = 0;
    const rowsToClear = new Set();
    const colsToClear = new Set();

    for (let r = 0; r < GRID_SIZE; r++) if (newGrid[r].every(cell => cell !== null)) rowsToClear.add(r);
    for (let c = 0; c < GRID_SIZE; c++) {
      let full = true;
      for (let r = 0; r < GRID_SIZE; r++) if (newGrid[r][c] === null) { full = false; break; }
      if (full) colsToClear.add(c);
    }

    linesCleared = rowsToClear.size + colsToClear.size;

    let finalGrid = newGrid;
    let pointsGained = 0;

    if (linesCleared > 0) {
      const cellsToExplode = new Set();
      rowsToClear.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) cellsToExplode.add(`${r}-${c}`); });
      colsToClear.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) cellsToExplode.add(`${r}-${c}`); });

      const newExplosions = [];
      cellsToExplode.forEach(key => {
        const [r, c] = key.split('-').map(Number);
        if (newGrid[r][c]) {
          newExplosions.push({ id: Math.random() + key, r, c, color: newGrid[r][c] });
        }
      });
      setExplosions(prev => [...prev, ...newExplosions]);
      setTimeout(() => {
        setExplosions(prev => prev.filter(ex => !newExplosions.find(ne => ne.id === ex.id)));
      }, 400);

      const newCombo = combo + 1;
      setCombo(newCombo);
      clearedInRound.current = true;

      const basePoints = linesCleared * 10;
      pointsGained = basePoints * newCombo;

      if (triggerRect) addFlyingScore(pointsGained, triggerRect, newCombo > 1);

      // 震动反馈
      if (settings.vibration && navigator.vibrate) {
        if (newCombo > 5) navigator.vibrate([50, 30, 50]); // 强震动
        else navigator.vibrate(30); // 轻震动
      }

      // Screen Shake
      if (pointsGained >= 100 || newCombo >= 3) triggerScreenShake('heavy');
      else if (pointsGained >= 50) triggerScreenShake('medium');
      else triggerScreenShake('medium'); // Clearing lines always gives at least medium shake

      setScore(prev => prev + pointsGained);

      const clearedGrid = newGrid.map(row => [...row]);
      rowsToClear.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) clearedGrid[r][c] = null; });
      colsToClear.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) clearedGrid[r][c] = null; });

      setGrid(clearedGrid);
      finalGrid = clearedGrid;
    } else {
      setGrid(newGrid);
    }
    setPreviewClears({ rows: [], cols: [] });

    return { linesCleared: linesCleared > 0, finalGrid, pointsGained };
  };

  const getSmartTargetIndex = (clickXRatio) => {
    const s0 = availableShapes[0];
    const s1 = availableShapes[1];
    const s2 = availableShapes[2];

    const activeIndices = [0, 1, 2].filter(i => availableShapes[i]);
    if (activeIndices.length === 1) return activeIndices[0];

    let targetIndex = -1;
    if (clickXRatio < 0.33) targetIndex = 0;
    else if (clickXRatio < 0.66) targetIndex = 1;
    else targetIndex = 2;

    if (targetIndex === 0 && !s0) return s1 ? 1 : 2;
    if (targetIndex === 2 && !s2) return s1 ? 1 : 0;
    if (targetIndex === 1 && !s1) return clickXRatio < 0.5 ? 0 : 2;

    return targetIndex;
  };

  const handleBottomAreaStart = (e) => {
    e.preventDefault();
    if (gameOver) return;

    const touch = e.touches ? e.touches[0] : e;
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    const rect = bottomAreaRef.current.getBoundingClientRect();

    const clickXRatio = (clientX - rect.left) / rect.width;
    const targetIndex = getSmartTargetIndex(clickXRatio);

    if (targetIndex !== -1 && availableShapes[targetIndex]) {
      const shape = availableShapes[targetIndex];

      const isTouch = e.type === 'touchstart';
      const offsetY = isTouch ? TOUCH_OFFSET_Y : MOUSE_OFFSET_Y;

      dragInfoRef.current = {
        isDragging: true,
        isTouch,
        startX: clientX,
        startY: clientY,
        blockStartX: clientX,
        blockStartY: clientY - offsetY
      };

      setDraggingShape({ ...shape, originalIndex: targetIndex });
      setDragPosition({ x: clientX, y: clientY - offsetY });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    if (!draggingShape) return;

    const touch = e.touches ? e.touches[0] : e;
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    const { startX, startY, blockStartX, blockStartY, isTouch } = dragInfoRef.current;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const sensitivity = isTouch ? TOUCH_SENSITIVITY : MOUSE_SENSITIVITY;

    const newBlockX = blockStartX + deltaX * sensitivity;
    const newBlockY = blockStartY + deltaY * sensitivity;

    setDragPosition({ x: newBlockX, y: newBlockY });

    if (gridRef.current) {
      const gridRect = gridRef.current.getBoundingClientRect();
      const cellSize = gridRect.width / GRID_SIZE;

      const centerX = newBlockX;
      const centerY = newBlockY;

      const relativeX = centerX - gridRect.left;
      const relativeY = centerY - gridRect.top;

      const rawCol = Math.round((relativeX / cellSize) - (draggingShape.matrix[0].length / 2));
      const rawRow = Math.round((relativeY / cellSize) - (draggingShape.matrix.length / 2));

      let bestCandidate = null;
      let minDistance = Infinity;
      const searchOffsets = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

      for (const [rOff, cOff] of searchOffsets) {
        const r = rawRow + rOff;
        const c = rawCol + cOff;
        if (canPlaceShape(grid, draggingShape.matrix, r, c)) {
          const candX = (c + draggingShape.matrix[0].length / 2) * cellSize;
          const candY = (r + draggingShape.matrix.length / 2) * cellSize;
          const dist = Math.hypot(relativeX - candX, relativeY - candY);

          if (dist < minDistance) {
            minDistance = dist;
            bestCandidate = { r, c };
          }
        }
      }

      if (bestCandidate && minDistance < cellSize * 1.5) {
        const { r, c } = bestCandidate;
        setPreviewPlacement({ r, c });

        const simulatedGrid = grid.map(row => [...row]);
        draggingShape.matrix.forEach((rowVec, rIdx) => {
          rowVec.forEach((val, cIdx) => {
            if (val === 1) simulatedGrid[r + rIdx][c + cIdx] = draggingShape.color;
          });
        });

        const rowsToClear = [];
        const colsToClear = [];
        for (let i = 0; i < GRID_SIZE; i++) {
          if (simulatedGrid[i].every(cell => cell !== null)) rowsToClear.push(i);
        }
        for (let i = 0; i < GRID_SIZE; i++) {
          if (simulatedGrid.every(row => row[i] !== null)) colsToClear.push(i);
        }
        setPreviewClears({ rows: rowsToClear, cols: colsToClear });
      } else {
        setPreviewPlacement(null);
        setPreviewClears({ rows: [], cols: [] });
      }
    }
  }, [draggingShape, grid]);

  const handleMouseUp = useCallback((e) => {
    if (!draggingShape) return;
    let dropRect = { left: dragPosition.x - 20, top: dragPosition.y - 20, width: 40, height: 40 };

    if (previewPlacement) {
      const newGrid = grid.map(row => [...row]);
      const { r: startR, c: startC } = previewPlacement;
      let cellsPlaced = 0;
      draggingShape.matrix.forEach((rowVec, r) => {
        rowVec.forEach((val, c) => {
          if (val === 1) {
            newGrid[startR + r][startC + c] = draggingShape.color;
            cellsPlaced++;
          }
        });
      });

      const newAvailableShapes = [...availableShapes];
      newAvailableShapes[draggingShape.originalIndex] = null;

      setScore(s => s + cellsPlaced);

      const { finalGrid, pointsGained } = clearLines(newGrid, dropRect);

      if (pointsGained > 0) {
        triggerPraise(pointsGained);
      } else {
        // Just placed, no clear
        triggerScreenShake('light');
      }

      const remainingShapes = newAvailableShapes.filter(s => s !== null);

      if (remainingShapes.length === 0) {
        if (!clearedInRound.current) {
          setCombo(prev => Math.floor(prev / 2));
        }
        refillShapes();
      } else {
        setAvailableShapes(newAvailableShapes);
      }
    }
    setDraggingShape(null);
    setPreviewPlacement(null);
    setPreviewClears({ rows: [], cols: [] });
    setDragPosition({ x: 0, y: 0 });
    dragInfoRef.current.isDragging = false;
  }, [draggingShape, previewPlacement, grid, availableShapes, dragPosition, combo]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  const renderCell = (color, r, c) => {
    let isPreview = false;
    if (previewPlacement && draggingShape) {
      const { r: pr, c: pc } = previewPlacement;
      if (r >= pr && r < pr + draggingShape.matrix.length && c >= pc && c < pc + draggingShape.matrix[0].length) {
        if (draggingShape.matrix[r - pr][c - pc] === 1) isPreview = true;
      }
    }
    const explosion = explosions.find(e => e.r === r && e.c === c);
    const isWillClear = previewClears.rows.includes(r) || previewClears.cols.includes(c);

    return (
      <div key={`${r}-${c}`} className="relative w-full h-full">
        <div
          className={`w-full h-full rounded-md border border-slate-700 transition-all duration-150
            ${color ? getBlockClass(color) : 'bg-slate-800'}
            ${isPreview ? '!bg-white/50 !border-white/80' : ''}
            ${color ? 'shadow-sm' : ''}
          `}
        />
        {isWillClear && <div className="absolute inset-0 bg-white/40 z-20 animate-pulse rounded-md box-content border-2 border-white/50" />}
        {explosion && (
          <div className={`absolute inset-0 rounded-md z-10 animate-pop ${getBlockClass(explosion.color)}`}>
            <div className="absolute inset-0 bg-white animate-particle opacity-0"></div>
          </div>
        )}
      </div>
    );
  };

  const renderShape = (shape, index) => {
    if (!shape) return <div className="relative flex-1 h-full min-w-0 p-4 opacity-0 pointer-events-none" key={`empty-${index}`} />;
    const isBeingDragged = draggingShape && draggingShape.originalIndex === index;
    const rows = shape.matrix.length;
    const cols = shape.matrix[0].length;
    const scale = Math.min(1.2, 3.8 / Math.max(rows, cols));

    return (
      <div
        key={shape.uid}
        className={`relative flex-1 h-full flex items-center justify-center min-w-0 p-4 pointer-events-none
          ${isBeingDragged ? 'opacity-0' : ''}
        `}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '2px',
            transform: `scale(${scale})`,
          }}
        >
          {shape.matrix.map((row, r) => (
            row.map((val, c) => (
              <div key={`${r}-${c}`} className={`w-6 h-6 rounded-sm transition-colors ${val ? getBlockClass(shape.color) : 'bg-transparent'}`} />
            ))
          ))}
        </div>
      </div>
    );
  };

  const comboStyle = getComboStyle(combo);

  return (
    <div className={`fixed inset-0 w-full h-full ${THEMES[settings.theme].bg} text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none touch-none relative transition-colors duration-500 ${shakeClass}`}>

      <style>{`
        html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; background-color: ${settings.theme === 'light' ? '#f1f5f9' : '#020617'}; overflow: hidden; overscroll-behavior: none; touch-action: none; -webkit-user-select: none; user-select: none; }

        @keyframes pop-out { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.8; box-shadow: 0 0 20px currentColor; } 100% { transform: scale(0); opacity: 0; } }
        @keyframes juicy-fly { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 20% { transform: translate(-50%, -50%) scale(1.8) rotate(calc(-15deg * var(--dir))); opacity: 1; } 40% { transform: translate(-50%, -50%) scale(1.2) rotate(calc(10deg * var(--dir))); opacity: 1; } 50% { transform: translate(-50%, -50%) scale(1.2) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; } }
        @keyframes pulse-gold { 0% { transform: scale(1); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes shake-vertical { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-3px); } 75% { transform: translateY(3px); } }
        @keyframes praise-pop { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); } 20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); } 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -100%) scale(1.2); } }
        
        .animate-pop { animation: pop-out 0.4s ease-out forwards; }
        .animate-fly { animation: juicy-fly 1s ease-in-out forwards; }
        .animate-praise { animation: praise-pop var(--duration, 1s) ease-out forwards; }

        .score-stroke { -webkit-text-stroke: 2px #000; paint-order: stroke fill; }
        .score-shadow { filter: drop-shadow(0 4px 0px rgba(0,0,0,0.5)); }

        .best-gold-text { background: linear-gradient(to bottom, #fcd34d, #d97706); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3)); }
        .flying-score-effect { text-shadow: 0 0 8px currentColor; }
        .flame-text { text-shadow: 0 0 10px #ff5500, 0 0 20px #ff0000; }
        .flame-purple { text-shadow: 0 0 10px #aa00ff, 0 0 20px #ff00ff; }
        .flame-blue { text-shadow: 0 0 10px #00aaff, 0 0 20px #00ffff; }
        .flame-gold { text-shadow: 0 0 10px #ffaa00, 0 0 20px #ffff00; }
        .gold-metal-text { background: linear-gradient(to bottom, #fbf5b7 0%, #bf953f 30%, #b38728 50%, #fbf5b7 80%, #aa771c 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        
        @keyframes heart-break { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5) rotate(-15deg); opacity: 0.8; } 100% { transform: scale(0) translateY(50px); opacity: 0; } }
        .animate-heart-break { animation: heart-break 0.8s ease-out forwards; }
        
        @keyframes no-space-pop { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
        .animate-no-space { animation: no-space-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shine-text {
          background: linear-gradient(to right, #94a3b8 20%, #ffffff 50%, #94a3b8 80%);
          background-size: 200% auto;
          color: #000;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 3s linear infinite;
        }

        @keyframes shake-light { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(2px, 2px); } 50% { transform: translate(-2px, -2px); } 75% { transform: translate(2px, -2px); } }
        @keyframes shake-medium { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(4px, 4px) rotate(1deg); } 50% { transform: translate(-4px, -4px) rotate(-1deg); } 75% { transform: translate(4px, -4px); } }
        @keyframes shake-heavy { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(8px, -8px) rotate(-2deg); } 30% { transform: translate(-8px, 8px) rotate(2deg); } 50% { transform: translate(8px, 8px) rotate(-2deg); } 70% { transform: translate(-8px, -8px) rotate(2deg); } 90% { transform: translate(4px, -4px); } }

        .animate-shake-light { animation: shake-light 0.2s ease-out; }
        .animate-shake-medium { animation: shake-medium 0.3s ease-out; }
        .animate-shake-heavy { animation: shake-heavy 0.4s ease-out; }
      `}</style>

      {/* 顶部留白 - 适配异形屏 */}
      <div className="w-full h-12 shrink-0" />

      {/* 核心内容区 - 垂直排列 */}
      <div className="flex flex-col items-center justify-start shrink-0 z-10 w-full flex-1 ">  {/*whitespace-nowrap*/}

        {/* 顶部 UI */}
        <div className={UI_CONFIG.topBar.container}>

          <div className={UI_CONFIG.topBar.settingsGroup}>
            <div className="flex gap-2">
              <button onClick={() => setShowRestartModal(true)} className="p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm transition text-white/80 w-fit border border-white/5">
                <RotateCcw size={18} />
              </button>
              <button onClick={() => setShowSettingsModal(true)} className="p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm transition text-white/80 w-fit border border-white/5">
                <Settings size={18} />
              </button>
            </div>
            <div className="text-xs font-black flex items-center gap-1.5">
              <Crown size={14} className="text-yellow-500" fill="currentColor" />
              <span className="best-gold-text text-sm">{t.best} {bestScore}</span>
            </div>
          </div>

          <div className={UI_CONFIG.score.container} ref={scoreRef}>
            <div className={UI_CONFIG.score.label}>{t.score}</div>
            <div className={UI_CONFIG.score.currentScore}>
              {displayScore}
            </div>
          </div>

          <div className={UI_CONFIG.topBar.livesGroup}>
            {/* Lives UI */}
            <div className="flex gap-1">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="relative">
                  <Heart
                    size={24}
                    className={`${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700 fill-slate-800'}`}
                  />
                  {i === lives && showHeartBreak && (
                    <HeartCrack size={24} className="absolute inset-0 text-slate-500 animate-heart-break" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Combo UI - Moved to Top Bar */}
          <div className={UI_CONFIG.combo.container}>
            <div
              className={`text-xl md:text-2xl font-black italic tracking-tighter flex items-center gap-1 transition-all duration-500 ${comboStyle.containerClass} ${comboStyle.colorClass}`}
              style={{ ...comboStyle.scaleStyle, ...comboStyle.animationStyle, ...comboStyle.glowStyle }}
            >
              {combo >= 5 && <Flame size={20} fill="currentColor" className="animate-bounce" />}
              <div className="flex flex-col items-center leading-none">
                <span className={`text-[10px] opacity-90 not-italic font-bold ${settings.theme === 'light' ? 'text-slate-500' : 'text-white'} shadow-black drop-shadow-md`}>{t.combo}</span>
                <span className="score-stroke text-3xl">x{combo}</span>
              </div>
            </div>
          </div>

        </div>

        {/* 游戏主棋盘 - 动态调整大小 */}
        <div
          className={UI_CONFIG.board.wrapper}
          style={{ width: boardSize, height: boardSize }}
        >
          <div className={`${UI_CONFIG.board.container} ${THEMES[settings.theme].board} transition-colors duration-500`}>



            {/* 称赞语弹出层 */}
            {praise && (
              <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none whitespace-nowrap animate-praise ${praise.style}`}
                style={{ '--duration': `${praise.duration}ms` }}
              >
                {praise.text}
              </div>
            )}

            <div ref={gridRef} className="w-full h-full grid grid-rows-8 grid-cols-8 gap-1 p-3">
              {grid.map((row, r) => row.map((color, c) => renderCell(color, r, c)))}
            </div>

            {showNewRecordAnim && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-yellow-500/20 animate-pulse"></div>
                <div className="text-5xl font-black text-yellow-300 drop-shadow-2xl scale-150 animate-bounce flex flex-col items-center z-40 score-stroke">
                  <Crown size={64} fill="gold" className="mb-2" />
                  <div className="whitespace-nowrap">{t.newRecord}</div>
                </div>
                <div className="absolute w-full h-full border-4 border-yellow-400 rounded-full animate-[pulse-gold_1s_ease-out_infinite]" />
              </div>
            )}
            {showNoSpace && (
              <div className={UI_CONFIG.noSpace.container}>
                <div className={UI_CONFIG.noSpace.text}>{t.noSpace}</div>
              </div>
            )}

            {gameOver && (
              <div className={UI_CONFIG.gameOver.overlay}>
                <div className={UI_CONFIG.gameOver.content}>
                  <div className={UI_CONFIG.gameOver.title}>{t.gameOver}</div>
                  <div className={UI_CONFIG.gameOver.scoreLabel}>{t.score}</div>
                  <div className={UI_CONFIG.gameOver.finalScore}>{score}</div>
                  <button onClick={startNewGame} className={UI_CONFIG.gameOver.restartButton}>
                    <RefreshCw size={24} /> {t.tryAgain}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 底部弹性触控区 - 填满下方剩余空间 */}
      <div
        ref={bottomAreaRef}
        className="w-full max-w-[500px] flex-1 min-h-[100px] px-2 flex justify-between items-start pt-2 z-20 gap-0 cursor-grab active:cursor-grabbing touch-none shrink-0 bg-gradient-to-t from-slate-950/50 to-transparent"
        onMouseDown={handleBottomAreaStart}
        onTouchStart={handleBottomAreaStart}
      >
        {availableShapes.map((shape, i) => renderShape(shape, i))}
      </div>

      {draggingShape && (
        <div className="fixed pointer-events-none z-50 opacity-90" style={{ left: dragPosition.x, top: dragPosition.y, transform: 'translate(-50%, -50%) scale(1.2)' }}>
          <div style={{ display: 'grid', gridTemplateRows: `repeat(${draggingShape.matrix.length}, 1fr)`, gridTemplateColumns: `repeat(${draggingShape.matrix[0].length}, 1fr)`, gap: '2px' }}>
            {draggingShape.matrix.map((row, r) => row.map((val, c) => (
              <div key={`drag-${r}-${c}`} className={`w-10 h-10 md:w-12 md:h-12 rounded-md ${val ? getBlockClass(draggingShape.color) : 'opacity-0'}`} />
            )))}
          </div>
        </div>
      )}

      {flyingScores.map(fs => (
        <div
          key={fs.id}
          className="fixed font-black italic text-4xl z-50 pointer-events-none animate-fly flying-score-effect score-stroke"
          style={{
            left: fs.x,
            top: fs.y,
            color: fs.color,
            textShadow: `0 0 8px ${fs.color}`,
            '--tx': `${fs.moveX}px`,
            '--ty': `${fs.moveY}px`,
            '--dir': fs.rotationDir,
            fontFamily: '"Verdana", sans-serif',
          }}
        >
          {fs.text}
        </div>
      ))}

      {showRestartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">{t.restartTitle}</h3>
            <p className="text-slate-400 mb-6 text-sm">{t.restartMsg}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRestartModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 font-medium text-slate-300 hover:bg-white/10 transition">{t.cancel}</button>
              <button onClick={startNewGame} className="flex-1 py-3 rounded-xl bg-red-500 font-medium text-white hover:bg-red-600 shadow-lg shadow-red-900/20 transition">{t.restart}</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-xs w-full shadow-2xl relative">
            <button onClick={() => setShowSettingsModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings size={22} className="text-blue-400" /> {t.settings}
            </h3>

            <div className="space-y-4">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-slate-200">
                  {settings.sound ? <Volume2 size={20} className="text-green-400" /> : <VolumeX size={20} className="text-slate-500" />}
                  <span className="font-medium">{t.sound}</span>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, sound: !s.sound }))}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${settings.sound ? 'bg-blue-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${settings.sound ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Vibration Toggle */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-slate-200">
                  <Vibrate size={20} className={settings.vibration ? "text-purple-400" : "text-slate-500"} />
                  <span className="font-medium">{t.vibration}</span>
                </div>
                <button
                  onClick={() => {
                    if (!settings.vibration && navigator.vibrate) navigator.vibrate(20);
                    setSettings(s => ({ ...s, vibration: !s.vibration }));
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${settings.vibration ? 'bg-blue-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${settings.vibration ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Language Toggle */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-slate-200">
                  <Languages size={20} className="text-orange-400" />
                  <span className="font-medium">{t.language}</span>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, language: s.language === 'en' ? 'zh' : 'en' }))}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold text-blue-300 transition"
                >
                  {settings.language === 'en' ? 'English' : '中文'}
                </button>
              </div>

              {/* Theme Selector */}
              <div className="flex flex-col gap-3 bg-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-slate-200">
                  <Sparkles size={20} className="text-yellow-400" />
                  <span className="font-medium">Theme</span>
                </div>
                <div className="flex justify-between gap-2">
                  {Object.entries(THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => setSettings(s => ({ ...s, theme: key }))}
                      className={`flex-1 aspect-square rounded-xl border-2 transition-all duration-200 flex items-center justify-center relative overflow-hidden ${theme.color} ${settings.theme === key ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                      title={theme.name}
                    >
                      {settings.theme === key && <div className="absolute inset-0 border-2 border-white/20 rounded-xl" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="absolute bottom-2 text-slate-500/20 text-[10px] select-none pointer-events-none">
        Block Blast • React
      </div>

    </div>
  );
};

export default App;