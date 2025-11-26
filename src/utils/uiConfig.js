/**
 * UI Layout Configuration
 * 
 * This file contains all the layout parameters for the game UI.
 * You can adjust the classes here to fine-tune the position and style of elements.
 */

export const UI_CONFIG = {
    // --- Top Bar (Settings, Lives, etc.) ---
    topBar: {
        // 1. 容器改为 Grid，依然是 3 列
        // 2. gap-y-2: 让第一行和第二行之间有点空隙
        // 3. items-center: 让所有东西垂直居中（不再强制到底部）
        container: "w-full max-w-[550px] px-6 grid grid-cols-3 gap-y-2 mb-2 shrink-0 items-center",

        // 设置组（左边那个）：强制放在第 2 行，第 1 列
        settingsGroup: "col-start-1 row-start-1 flex items-center justify-start gap-2 h-full",

        // 生命组（右边那个）：强制放在第 2 行，第 3 列
        livesGroup: "col-start-3 row-start-3 flex items-center justify-end gap-1 h-full",
    },

    score: {
        // 分数：强制放在第 1 行，第 2 列（也就是第一行的正中间）
        // z-10: 稍微提高层级，防止动画遮挡
        container: "col-start-2 row-start-2 flex flex-col items-center justify-center h-full pb-1 z-10",

        label: "text-slate-400 text-xs font-bold tracking-widest uppercase mb-1",
        // 字体稍微调大一点，因为它是第一行唯一的主角
        currentScore: "text-6xl md:text-7xl font-black shine-text leading-none filter drop-shadow-lg ",
        bestScoreContainer: "flex items-center gap-2 text-amber-400 font-bold text-sm mt-1 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20",
    },

    // --- Game Board Area ---
    board: {
        wrapper: "relative w-full max-w-[500px] aspect-square mx-auto mb-4 shrink-0",
        container: "relative w-full h-full p-1 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 relative",
        grid: "grid grid-cols-8 grid-rows-8 gap-1 w-full h-full",
    },

    // --- Combo Display ---
    combo: {
        // Positioned in the first column, third row of the top bar grid
        container: "col-start-1 row-start-3 flex items-center justify-start z-20 pointer-events-none",
        text: "text-4xl font-black text-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] stroke-black stroke-2",
    },

    // --- Game Over Screen ---
    gameOver: {
        overlay: "absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-fade-in",
        content: "flex flex-col items-center p-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl transform transition-all hover:scale-105 duration-300",
        title: "text-5xl font-black text-white mb-2 tracking-tight",
        scoreLabel: "text-slate-400 text-sm font-bold uppercase tracking-widest mb-2",
        finalScore: "text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-600 mb-8 filter drop-shadow-lg",
        restartButton: "group relative px-8 py-4 bg-white text-slate-950 rounded-full font-black text-xl hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 flex items-center gap-3 overflow-hidden",
    },

    // --- "No Space" Effect ---
    noSpace: {
        container: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none",
        text: "text-5xl font-black text-red-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] stroke-white stroke-2 animate-shake-vertical",
    }
};
