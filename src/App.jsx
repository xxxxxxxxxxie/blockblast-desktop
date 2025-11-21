import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Trophy, RotateCcw, Crown, Flame, Sparkles, Loader2 } from 'lucide-react';

// --- API 配置 ---
const apiKey = ""; // 系统会自动注入 API Key

// --- 游戏配置与常量 ---
const GRID_SIZE = 8;

// 默认颜色 (Tailwind Classes)
const DEFAULT_COLORS = {
  blue:   'bg-blue-500 border-blue-600',
  green:  'bg-green-500 border-green-600',
  red:    'bg-red-500 border-red-600',
  yellow: 'bg-yellow-400 border-yellow-500',
  purple: 'bg-purple-500 border-purple-600',
  cyan:   'bg-cyan-400 border-cyan-500',
  orange: 'bg-orange-500 border-orange-600',
  pink:   'bg-pink-500 border-pink-600',
};

// 霓虹特效颜色池
const EFFECT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
];

// 方块形状定义
const SHAPES = [
  { id: '1x1', matrix: [[1]], color: 'blue' },
  { id: '2x1', matrix: [[1, 1]], color: 'green' },
  { id: '1x2', matrix: [[1]], color: 'green' },
  { id: '3x1', matrix: [[1, 1, 1]], color: 'orange' },
  { id: '1x3', matrix: [[1], [1], [1]], color: 'orange' },
  { id: '4x1', matrix: [[1, 1, 1, 1]], color: 'cyan' },
  { id: '1x4', matrix: [[1], [1], [1], [1]], color: 'cyan' },
  { id: '2x2', matrix: [[1, 1], [1, 1]], color: 'yellow' },
  { id: 'L_br', matrix: [[1, 0], [1, 1]], color: 'purple' },
  { id: 'L_bl', matrix: [[0, 1], [1, 1]], color: 'purple' },
  { id: 'L_tr', matrix: [[1, 1], [1, 0]], color: 'pink' },
  { id: 'L_tl', matrix: [[1, 1], [0, 1]], color: 'pink' },
  { id: 'T_up', matrix: [[0, 1, 0], [1, 1, 1]], color: 'red' },
  { id: 'T_down',matrix: [[1, 1, 1], [0, 1, 0]], color: 'red' },
  { id: 'Z_h',  matrix: [[1, 1, 0], [0, 1, 1]], color: 'green' },
  { id: 'S_h',  matrix: [[0, 1, 1], [1, 1, 0]], color: 'green' },
  { id: '3x3_L', matrix: [[1,1,1],[1,0,0],[1,0,0]], color: 'blue'},
];

// --- 辅助函数 ---
const getRandomShape = () => {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { ...shape, uid: Math.random().toString(36).substr(2, 9) };
};

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
  }

  return { containerClass, colorClass, scaleStyle, animationStyle, glowStyle };
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
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  
  const clearedInRound = useRef(false);

  // UI 状态
  const [showRestartModal, setShowRestartModal] = useState(false);
  const scoreRef = useRef(null); 
  const bottomAreaRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // 动画状态
  const [explosions, setExplosions] = useState([]); 
  const [flyingScores, setFlyingScores] = useState([]); 

  // 拖拽状态
  const [draggingShape, setDraggingShape] = useState(null); 
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [previewPlacement, setPreviewPlacement] = useState(null);
  const [previewClears, setPreviewClears] = useState({ rows: [], cols: [] });
  
  const gridRef = useRef(null);

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

  // 分数滚动动画
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

  // --- Game Over 判定逻辑 ---
  useEffect(() => {
      if (gameOver) return;
      const activeShapes = availableShapes.filter(s => s !== null);
      if (activeShapes.length === 0) return;

      const timer = setTimeout(() => {
         if (checkGameOver(grid, activeShapes)) {
             setGameOver(true);
         }
      }, 500);
      return () => clearTimeout(timer);
  }, [availableShapes, grid, gameOver]);

  const startNewGame = () => {
    setGrid(createEmptyGrid());
    setScore(0);
    setDisplayScore(0);
    setCombo(0);
    setMaxCombo(0);
    setGameOver(false);
    setExplosions([]);
    setFlyingScores([]);
    setShowRestartModal(false);
    setHasBrokenRecord(false);
    setShowNewRecordAnim(false);
    const currentSaved = parseInt(localStorage.getItem('blockBlastBestScore') || '0');
    setInitialBestScore(isNaN(currentSaved) ? 0 : currentSaved); 
    
    clearedInRound.current = false;
    setPreviewClears({ rows: [], cols: [] });
    refillShapes();
  };

  const refillShapes = () => {
    setAvailableShapes([getRandomShape(), getRandomShape(), getRandomShape()]);
    clearedInRound.current = false; 
  };

  // --- 特效逻辑 ---
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

  const getBlockClass = (colorName) => DEFAULT_COLORS[colorName] || 'bg-slate-700';

  // --- 游戏逻辑 ---
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
      const totalPoints = basePoints * newCombo;
      
      if (triggerRect) addFlyingScore(totalPoints, triggerRect, newCombo > 1);

      setScore(prev => prev + totalPoints);

      const clearedGrid = newGrid.map(row => [...row]);
      rowsToClear.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) clearedGrid[r][c] = null; });
      colsToClear.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) clearedGrid[r][c] = null; });
      
      setGrid(clearedGrid);
      finalGrid = clearedGrid; 
    } else {
      setGrid(newGrid);
    }
    setPreviewClears({ rows: [], cols: [] });
    
    return { linesCleared: linesCleared > 0, finalGrid };
  };

  // --- 交互处理 ---
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

    if (targetIndex === 0 && !s0) {
       if (s1) return 1; 
       return 2; 
    }
    if (targetIndex === 2 && !s2) {
       if (s1) return 1; 
       return 0; 
    }
    if (targetIndex === 1 && !s1) {
        return clickXRatio < 0.5 ? 0 : 2;
    }

    return targetIndex;
  };

  const handleBottomAreaStart = (e) => {
    e.preventDefault(); 
    if (gameOver) return;

    const touch = e.touches ? e.touches[0] : e;
    const rect = bottomAreaRef.current.getBoundingClientRect();
    
    const clickXRatio = (touch.clientX - rect.left) / rect.width;
    const targetIndex = getSmartTargetIndex(clickXRatio);
    
    if (targetIndex !== -1 && availableShapes[targetIndex]) {
      const shape = availableShapes[targetIndex];
      dragOffset.current = { x: 0, y: 0 }; 
      setDraggingShape({ ...shape, originalIndex: targetIndex });
      setDragPosition({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!draggingShape) return;
    const touch = e.touches ? e.touches[0] : e;
    const mouseX = touch.clientX;
    const mouseY = touch.clientY;
    setDragPosition({ x: mouseX, y: mouseY });

    if (gridRef.current) {
      const gridRect = gridRef.current.getBoundingClientRect();
      const cellSize = gridRect.width / GRID_SIZE;
      const visualOffsetY = 60;
      const relativeX = mouseX - gridRect.left;
      const relativeY = (mouseY - visualOffsetY) - gridRect.top;
      
      const rawCol = Math.round((relativeX / cellSize) - (draggingShape.matrix[0].length / 2));
      const rawRow = Math.round((relativeY / cellSize) - (draggingShape.matrix.length / 2));

      let bestCandidate = null;
      let minDistance = Infinity;
      const searchOffsets = [
          [0, 0], [0, 1], [0, -1], [1, 0], [-1, 0], 
          [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];

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
    let dropRect = {
      left: dragPosition.x - 20, 
      top: dragPosition.y - 80, 
      width: 40, height: 40
    };

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
      
      const { finalGrid } = clearLines(newGrid, dropRect);
      
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


  // --- 渲染 ---
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
        
        {isWillClear && (
           <div className="absolute inset-0 bg-white/40 z-20 animate-pulse rounded-md box-content border-2 border-white/50" />
        )}

        {explosion && (
          <div 
            className={`absolute inset-0 rounded-md z-10 animate-pop ${getBlockClass(explosion.color)}`}
          >
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
    <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-between font-sans overflow-hidden select-none touch-none relative">
      
      <style>{`
        @keyframes pop-out {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.8; box-shadow: 0 0 20px currentColor; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes juicy-fly {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1.8) rotate(calc(-15deg * var(--dir))); opacity: 1; }
          40% { transform: translate(-50%, -50%) scale(1.2) rotate(calc(10deg * var(--dir))); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
        }
        @keyframes pulse-gold {
          0% { transform: scale(1); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes shake-vertical {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-3px); }
          75% { transform: translateY(3px); }
        }
        
        .animate-pop { animation: pop-out 0.4s ease-out forwards; }
        .animate-fly { animation: juicy-fly 1s ease-in-out forwards; }
        .score-stroke { -webkit-text-stroke: 2px #000; paint-order: stroke fill; }
        .score-shadow { filter: drop-shadow(0 4px 0px rgba(0,0,0,0.5)); }

        .best-gold-text {
          background: linear-gradient(to bottom, #fcd34d, #d97706);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
        }

        /* 恢复随机颜色发光效果 (内联样式控制颜色，这里只保留动画类) */
        .flying-score-effect {
            text-shadow: 0 0 8px currentColor;
        }
      `}</style>

      {/* Top Spacer Removed, pt-12 added */}
      {/* Main Content Group: Top UI + Board */}
      <div className="flex flex-col items-center justify-start shrink-0 z-10 w-full pt-12">

          {/* 顶部 UI：紧贴棋盘上方 (mb-2) */}
          <div className="w-full max-w-[500px] px-6 grid grid-cols-3 items-end mb-2 shrink-0 pt-4">
            
            <div className="flex flex-col gap-3 justify-self-start">
              <button onClick={() => setShowRestartModal(true)} className="p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm transition text-white/80 w-fit border border-white/5">
                <RotateCcw size={18} />
              </button>
              {/* 扁平化金色 Best UI */}
              <div className="text-xs font-black flex items-center gap-1.5">
                <Crown size={14} className="text-yellow-500" fill="currentColor" /> 
                <span className="best-gold-text text-sm">BEST {bestScore}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-self-center" ref={scoreRef}>
              <div className="text-white/30 text-[10px] font-bold tracking-widest uppercase mb-1">Score</div>
              <div className="text-6xl font-black tracking-tighter tabular-nums transition-all duration-100 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent score-shadow leading-none">
                {displayScore}
              </div>
            </div>

            <div className="flex flex-col items-end justify-self-end h-full justify-end pb-1">
              {/* 炫酷光效 Combo UI */}
              <div 
                className={`text-xl md:text-2xl font-black italic tracking-tighter flex items-center gap-1 transition-all duration-500 ${comboStyle.containerClass} ${comboStyle.colorClass}`}
                style={{ ...comboStyle.scaleStyle, ...comboStyle.animationStyle, ...comboStyle.glowStyle }}
              >
                  {combo >= 1 && (
                    <>
                      {combo >= 5 && <Flame size={20} fill="currentColor" className="animate-bounce" />}
                      <div className="flex flex-col items-end leading-none">
                          <span className="text-[10px] opacity-90 not-italic font-bold">COMBO</span>
                          <span className="score-stroke">x{combo}</span>
                      </div>
                    </>
                  )}
                  {combo <= 0 && (
                    <div className="flex flex-col items-end leading-none text-slate-600">
                        <span className="text-[10px] opacity-50 not-italic">COMBO</span>
                        <span>x0</span>
                    </div>
                  )}
              </div>
            </div>

          </div>

          {/* 游戏主棋盘：最大宽度增加到 500px，宽度 90vw */}
          <div className="w-[90vw] max-w-[500px] flex justify-center shrink-0">
            <div className="relative p-1 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 aspect-square w-full">
                <div ref={gridRef} className="w-full h-full grid grid-rows-8 grid-cols-8 gap-1 p-3">
                    {grid.map((row, r) => row.map((color, c) => renderCell(color, r, c)))}
                </div>

                {showNewRecordAnim && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-yellow-500/20 animate-pulse"></div>
                    <div className="text-5xl font-black text-yellow-300 drop-shadow-2xl scale-150 animate-bounce flex flex-col items-center z-40 score-stroke">
                        <Crown size={64} fill="gold" className="mb-2" />
                        <div className="whitespace-nowrap">NEW RECORD!</div>
                    </div>
                    <div className="absolute w-full h-full border-4 border-yellow-400 rounded-full animate-[pulse-gold_1s_ease-out_infinite]" />
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl z-20 animate-in fade-in duration-300 p-6 text-center">
                    <div className="text-4xl font-bold mb-2 text-white">Game Over!</div>
                    <div className="text-slate-300 mb-6 text-xl">Score: {score}</div>
                    <button onClick={startNewGame} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg mt-8">
                      <RefreshCw size={20} /> Try Again
                    </button>
                  </div>
                )}
            </div>
          </div>
      
      </div>

      {/* 3. 底部弹性触控区：紧贴棋盘下方 (pt-2)，判定范围填满剩余空间 (flex-1) */}
      <div 
        ref={bottomAreaRef}
        className="w-full max-w-[500px] flex-1 min-h-[100px] px-2 flex justify-between items-start pt-2 z-20 gap-0 cursor-grab active:cursor-grabbing touch-none shrink-0 bg-gradient-to-t from-slate-950/50 to-transparent"
        onMouseDown={handleBottomAreaStart}
        onTouchStart={handleBottomAreaStart}
      >
        {availableShapes.map((shape, i) => renderShape(shape, i))}
      </div>

      {/* 拖拽 Ghost */}
      {draggingShape && (
        <div className="fixed pointer-events-none z-50 opacity-90" style={{ left: dragPosition.x, top: dragPosition.y - 60, transform: 'translate(-50%, -50%) scale(1.2)' }}>
           <div style={{ display: 'grid', gridTemplateRows: `repeat(${draggingShape.matrix.length}, 1fr)`, gridTemplateColumns: `repeat(${draggingShape.matrix[0].length}, 1fr)`, gap: '2px' }}>
            {draggingShape.matrix.map((row, r) => row.map((val, c) => (
                <div key={`drag-${r}-${c}`} className={`w-10 h-10 md:w-12 md:h-12 rounded-md ${val ? getBlockClass(draggingShape.color) : 'opacity-0'}`}/>
              )))}
          </div>
        </div>
      )}

      {/* 飞行分数层 - 恢复随机颜色 */}
      {flyingScores.map(fs => (
        <div
          key={fs.id}
          className="fixed font-black italic text-4xl z-50 pointer-events-none animate-fly flying-score-effect score-stroke"
          style={{
            left: fs.x,
            top: fs.y,
            color: fs.color, // 随机颜色
            '--tx': `${fs.moveX}px`,
            '--ty': `${fs.moveY}px`,
            '--dir': fs.rotationDir,
            fontFamily: '"Verdana", sans-serif',
          }}
        >
          {fs.text}
        </div>
      ))}

      {/* Restart Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Restart Game?</h3>
            <p className="text-slate-400 mb-6 text-sm">Current progress will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRestartModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 font-medium text-slate-300 hover:bg-white/10 transition">Cancel</button>
              <button onClick={startNewGame} className="flex-1 py-3 rounded-xl bg-red-500 font-medium text-white hover:bg-red-600 shadow-lg shadow-red-900/20 transition">Restart</button>
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