// --- 游戏配置与常量 ---
export const GRID_SIZE = 8;

// 默认颜色
const DEFAULT_COLORS = {
    blue: 'bg-blue-500 border-blue-600',
    green: 'bg-green-500 border-green-600',
    red: 'bg-red-500 border-red-600',
    yellow: 'bg-yellow-400 border-yellow-500',
    purple: 'bg-purple-500 border-purple-600',
    cyan: 'bg-cyan-400 border-cyan-500',
    orange: 'bg-orange-500 border-orange-600',
    pink: 'bg-pink-500 border-pink-600',
};

export const getBlockClass = (color) => {
    return DEFAULT_COLORS[color] || 'bg-slate-500 border-slate-600';
};

export const SHAPES = [
    // Easy Shapes
    { id: '2x1', matrix: [[1, 1]], color: 'green' },
    { id: '1x2', matrix: [[1], [1]], color: 'green' },
    { id: '2x2', matrix: [[1, 1], [1, 1]], color: 'yellow' },
    { id: '3x1', matrix: [[1, 1, 1]], color: 'blue' },
    { id: '1x3', matrix: [[1], [1], [1]], color: 'blue' },

    // Medium Shapes
    { id: 'L_br', matrix: [[1, 0], [1, 1]], color: 'orange' }, // Bottom-Right corner
    { id: 'L_bl', matrix: [[0, 1], [1, 1]], color: 'orange' }, // Bottom-Left corner
    { id: 'L_tr', matrix: [[1, 1], [1, 0]], color: 'orange' }, // Top-Right corner
    { id: 'L_tl', matrix: [[1, 1], [0, 1]], color: 'orange' }, // Top-Left corner

    { id: 'T_up', matrix: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
    { id: 'T_down', matrix: [[1, 1, 1], [0, 1, 0]], color: 'purple' },

    { id: 'Z_h', matrix: [[1, 1, 0], [0, 1, 1]], color: 'red' },
    { id: 'S_h', matrix: [[0, 1, 1], [1, 1, 0]], color: 'red' },

    { id: '4x1', matrix: [[1, 1, 1, 1]], color: 'cyan' },
    { id: '1x4', matrix: [[1], [1], [1], [1]], color: 'cyan' },

    // Hard Shapes
    { id: '3x3_L', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: 'pink' }, // Big L
    { id: '3x3', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 'red' },
    { id: '2x3', matrix: [[1, 1], [1, 1], [1, 1]], color: 'blue' },
    { id: '3x2', matrix: [[1, 1, 1], [1, 1, 1]], color: 'blue' }
];

const SHAPE_POOLS = {
    EASY: ['2x1', '1x2', '2x2', '3x1', '1x3'],
    MEDIUM: ['L_br', 'L_bl', 'L_tr', 'L_tl', 'T_up', 'T_down', 'Z_h', 'S_h', '4x1', '1x4'],
    HARD: ['3x3_L', '3x3', '2x3', '3x2']
};

/**
 * 获取随机方块
 * @param {number} score 当前分数
 * @param {Array} grid 当前棋盘状态
 * @returns {Object} 包含 uid 的方块对象
 */
export const getRandomShape = (score = 0, grid = null) => {
    let pool = [];

    // 1. 计算棋盘填充率
    let fillRatio = 0;
    if (grid) {
        let filledCount = 0;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c]) filledCount++;
            }
        }
        fillRatio = filledCount / (GRID_SIZE * GRID_SIZE);
    }

    // 2. 动态概率配置
    let easyProb = 0.6;
    let mediumProb = 0.3;
    let hardProb = 0.1;

    // 随着分数增加，增加难度
    if (score > 500) { easyProb = 0.4; mediumProb = 0.4; hardProb = 0.2; }
    if (score > 1500) { easyProb = 0.3; mediumProb = 0.4; hardProb = 0.3; }
    if (score > 3000) { easyProb = 0.2; mediumProb = 0.4; hardProb = 0.4; }

    // --- 特殊机制 ---

    // A. 绝境保护 (Mercy Mechanic): 如果盘面很满 (>65%)，大幅增加简单方块概率
    if (fillRatio > 0.65) {
        easyProb = 0.9;
        mediumProb = 0.1;
        hardProb = 0;
    }
    // B. 快速填充 (Fill Assist): 如果盘面很空 (<30%)，大幅增加大方块概率，帮助玩家快速填满
    else if (fillRatio < 0.30) {
        easyProb = 0.2;
        mediumProb = 0.3;
        hardProb = 0.5; // 50% 概率出现大方块
    }

    // 3. 随机选择池子
    const rand = Math.random();
    let selectedPoolType = 'EASY';
    if (rand < easyProb) selectedPoolType = 'EASY';
    else if (rand < easyProb + mediumProb) selectedPoolType = 'MEDIUM';
    else selectedPoolType = 'HARD';

    // 4. 从池子中选形状
    const poolIds = SHAPE_POOLS[selectedPoolType];
    const shapeId = poolIds[Math.floor(Math.random() * poolIds.length)];
    const shape = SHAPES.find(s => s.id === shapeId) || SHAPES[0];

    return { ...shape, uid: Math.random().toString(36).substr(2, 9) };
};
