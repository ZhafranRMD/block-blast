// blockblast.js - Core 8x8 Block Blast Game Logic & Drag-and-Drop Interaction

const BOARD_SIZE = 8;

// Catalog of Polyomino shapes matching Block Blast
const SHAPES = [
    // 1x1 Single Dot
    { matrix: [[1]], color: 'yellow' },
    { matrix: [[1]], color: 'cyan' },

    // 2-blocks Dominoes
    { matrix: [[1, 1]], color: 'green' },
    { matrix: [[1], [1]], color: 'green' },

    // 3-blocks Trominoes
    { matrix: [[1, 1, 1]], color: 'cyan' },
    { matrix: [[1], [1], [1]], color: 'cyan' },
    { matrix: [[1, 1], [1, 0]], color: 'orange' },
    { matrix: [[1, 1], [0, 1]], color: 'orange' },
    { matrix: [[0, 1], [1, 1]], color: 'orange' },
    { matrix: [[1, 0], [1, 1]], color: 'orange' },

    // 4-blocks Tetrominoes
    // T-Shapes (Iconic yellow from poster!)
    { matrix: [[1, 1, 1], [0, 1, 0]], color: 'yellow' },
    { matrix: [[0, 1, 0], [1, 1, 1]], color: 'yellow' },
    { matrix: [[1, 0], [1, 1], [1, 0]], color: 'yellow' },
    { matrix: [[0, 1], [1, 1], [0, 1]], color: 'yellow' },

    // Squares 2x2
    { matrix: [[1, 1], [1, 1]], color: 'red' },

    // I-bars (4 and 5)
    { matrix: [[1, 1, 1, 1]], color: 'cyan' },
    { matrix: [[1], [1], [1], [1]], color: 'cyan' },
    { matrix: [[1, 1, 1, 1, 1]], color: 'blue' },
    { matrix: [[1], [1], [1], [1], [1]], color: 'blue' },

    // L-Shapes 3x2
    { matrix: [[1, 0], [1, 0], [1, 1]], color: 'blue' },
    { matrix: [[0, 1], [0, 1], [1, 1]], color: 'blue' },
    { matrix: [[1, 1, 1], [1, 0, 0]], color: 'blue' },
    { matrix: [[1, 1, 1], [0, 0, 1]], color: 'blue' },

    // J-Shapes
    { matrix: [[0, 1], [0, 1], [1, 1]], color: 'orange' },
    { matrix: [[1, 0, 0], [1, 1, 1]], color: 'orange' },

    // S and Z shapes
    { matrix: [[0, 1, 1], [1, 1, 0]], color: 'green' },
    { matrix: [[1, 1, 0], [0, 1, 1]], color: 'red' },
    { matrix: [[1, 0], [1, 1], [0, 1]], color: 'green' },
    { matrix: [[0, 1], [1, 1], [1, 0]], color: 'red' },

    // Large L-shapes (3x3 corner 5 blocks)
    { matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: 'purple' },
    { matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], color: 'purple' },
    { matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: 'purple' },
    { matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], color: 'purple' },

    // 3x3 Big Square (rare challenge)
    { matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 'red' },

    // Plus shape
    { matrix: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: 'purple' }
];

class BlockBlastGame {
    constructor(canvas, onScoreUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.renderer = new GameRenderer(this.ctx);
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;

        this.grid = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        this.dockPieces = [null, null, null];
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('blockblast_highscore') || '0', 10);
        this.combo = 0;
        this.isGameOver = false;

        // Power-up inventory
        this.powerups = {
            bomb: 2,
            hammer: 2,
            refresh: 2
        };
        this.activePowerup = null; // 'bomb' or 'hammer'

        // Sizing & coordinates
        this.boardX = 0;
        this.boardY = 0;
        this.boardSize = 0;
        this.cellSize = 0;
        this.cellGap = 5;

        // Dock coordinates
        this.dockY = 0;
        this.dockHeight = 120;
        this.dockSlots = [];

        // Dragging state
        this.dragging = {
            active: false,
            slotIndex: -1,
            piece: null,
            startX: 0,
            startY: 0,
            curX: 0,
            curY: 0,
            touchOffsetY: 75, // Finger offset
            gridRow: -1,
            gridCol: -1,
            isValidPlacement: false,
            highlightRows: [],
            highlightCols: []
        };

        // Flash clears animation
        this.flashClears = []; // { cells: [{r, c, color}], time: 0.2 }

        this.bindEvents();
        this.resize();
        this.startNewGame();

        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    startNewGame(usePreset = true) {
        this.score = 0;
        this.combo = 0;
        this.isGameOver = false;
        this.activePowerup = null;
        this.flashClears = [];

        if (usePreset) {
            this.initPosterPreset();
        } else {
            this.grid = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
            this.generateDockPieces();
        }

        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score, this.highScore, this.combo);
        }
    }

    // Initialize the exact block layout from the reference poster!
    initPosterPreset() {
        this.grid = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

        // Left Staircase: Red, Cyan, Purple blocks (matching photo)
        this.grid[3][1] = 'red';
        this.grid[4][1] = 'red';
        this.grid[4][2] = 'red';

        this.grid[5][0] = 'purple';
        this.grid[5][1] = 'blue';
        this.grid[5][2] = 'red';

        this.grid[6][0] = 'purple';
        this.grid[6][1] = 'purple';
        this.grid[6][2] = 'blue';

        this.grid[7][0] = 'purple';
        this.grid[7][1] = 'purple';
        this.grid[7][2] = 'purple';
        this.grid[7][3] = 'cyan';

        // Right Staircase: Green, Orange, Purple, Cyan blocks (matching photo)
        this.grid[3][7] = 'green';
        this.grid[4][6] = 'orange';
        this.grid[4][7] = 'green';

        this.grid[5][6] = 'orange';
        this.grid[5][7] = 'orange';

        this.grid[6][5] = 'purple';
        this.grid[6][6] = 'purple';
        this.grid[6][7] = 'cyan';

        this.grid[7][5] = 'purple';
        this.grid[7][6] = 'purple';
        this.grid[7][7] = 'cyan';

        // Dock pieces: Slot 1 is the iconic Golden Yellow T-shape piece!
        this.dockPieces[0] = {
            matrix: [[1, 1], [1, 1]],
            color: 'red',
            rows: 2,
            cols: 2,
            animScale: 1.0
        };
        this.dockPieces[1] = {
            matrix: [[1, 1, 1], [0, 1, 0]],
            color: 'yellow',
            rows: 2,
            cols: 3,
            animScale: 1.0,
            isPosterPiece: true
        };
        this.dockPieces[2] = {
            matrix: [[1, 1, 1]],
            color: 'green',
            rows: 1,
            cols: 3,
            animScale: 1.0
        };
    }

    generateDockPieces() {
        for (let i = 0; i < 3; i++) {
            this.dockPieces[i] = this.getRandomPiece();
        }
        this.checkGameOver();
    }

    getRandomPiece() {
        // Weighted random picking
        const index = Math.floor(Math.random() * SHAPES.length);
        const template = SHAPES[index];
        return {
            matrix: template.matrix.map(row => [...row]),
            color: template.color,
            rows: template.matrix.length,
            cols: template.matrix[0].length,
            animScale: 1.0
        };
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width || 380;
        const h = rect.height || 480;
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);

        const isLandscape = (w >= h * 1.12);

        if (isLandscape) {
            // 16:9 Landscape Layout: Board takes full vertical height, Dock pedestals on the right
            const padY = 16;
            const targetBoardH = h - padY * 2;
            const dockW = Math.min(220, Math.max(140, Math.floor(w * 0.22)));
            const dockGap = 20;
            const availBoardW = w - dockW - dockGap - 32;

            this.boardSize = Math.max(220, Math.min(targetBoardH, availBoardW));
            this.cellGap = Math.max(3, Math.floor(this.boardSize * 0.016));
            this.cellSize = (this.boardSize - (this.cellGap * (BOARD_SIZE - 1))) / BOARD_SIZE;

            const totalW = this.boardSize + dockGap + dockW;
            this.boardX = Math.max(16, Math.floor((w - totalW) / 2));
            this.boardY = Math.floor((h - this.boardSize) / 2);

            const dockX = this.boardX + this.boardSize + dockGap;
            const dockY = this.boardY;
            const dockHeight = this.boardSize;
            const slotGap = 12;
            const slotH = Math.floor((dockHeight - slotGap * 2) / 3);

            this.dockSlots = [];
            for (let i = 0; i < 3; i++) {
                const sy = dockY + i * (slotH + slotGap);
                this.dockSlots.push({
                    x: dockX,
                    y: sy,
                    w: dockW,
                    h: slotH,
                    cx: dockX + dockW / 2,
                    cy: sy + slotH / 2
                });
            }
            this.dockY = dockY;
            this.dockHeight = dockHeight;
        } else {
            // Portrait Layout: Board on top, Dock underneath
            const pad = 12;
            const availWidth = w - pad * 2;
            const maxBoardH = Math.min(availWidth, h - 135);
            this.boardSize = Math.max(190, maxBoardH);
            this.boardX = (w - this.boardSize) / 2;
            this.boardY = 12;

            this.cellGap = Math.max(3, Math.floor(this.boardSize * 0.016));
            this.cellSize = (this.boardSize - (this.cellGap * (BOARD_SIZE - 1))) / BOARD_SIZE;

            this.dockY = this.boardY + this.boardSize + 16;
            this.dockHeight = Math.max(100, h - this.dockY - 8);

            const slotW = (w - pad * 2) / 3;
            this.dockSlots = [];
            for (let i = 0; i < 3; i++) {
                this.dockSlots.push({
                    x: pad + i * slotW,
                    y: this.dockY,
                    w: slotW,
                    h: this.dockHeight,
                    cx: pad + i * slotW + slotW / 2,
                    cy: this.dockY + this.dockHeight / 2
                });
            }
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        // Mouse & Touch events
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const onStart = (e) => {
            if (this.isGameOver) return;
            const pos = getPos(e);

            // If a power-up is active (Hammer or Bomb)
            if (this.activePowerup) {
                this.handlePowerupClick(pos.x, pos.y);
                return;
            }

            // Check if tapped on a dock slot
            for (let i = 0; i < 3; i++) {
                const piece = this.dockPieces[i];
                if (!piece) continue;
                const slot = this.dockSlots[i];
                if (pos.x >= slot.x && pos.x <= slot.x + slot.w &&
                    pos.y >= slot.y && pos.y <= slot.y + slot.h) {
                    
                    this.dragging.active = true;
                    this.dragging.slotIndex = i;
                    this.dragging.piece = piece;
                    this.dragging.startX = pos.x;
                    this.dragging.startY = pos.y;
                    this.dragging.curX = pos.x;
                    this.dragging.curY = pos.y - (e.touches ? this.dragging.touchOffsetY : 20);

                    if (window.soundEngine) window.soundEngine.playPick();
                    this.updateDragPlacement();
                    break;
                }
            }
        };

        const onMove = (e) => {
            if (!this.dragging.active) return;
            e.preventDefault();
            const pos = getPos(e);
            this.dragging.curX = pos.x;
            this.dragging.curY = pos.y - (e.touches ? this.dragging.touchOffsetY : 20);
            this.updateDragPlacement();
        };

        const onEnd = (e) => {
            if (!this.dragging.active) return;
            this.commitDragPlacement();
            this.dragging.active = false;
            this.dragging.slotIndex = -1;
            this.dragging.piece = null;
        };

        this.canvas.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        this.canvas.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
    }

    handlePowerupClick(x, y) {
        // Check if inside board
        if (x >= this.boardX && x <= this.boardX + this.boardSize &&
            y >= this.boardY && y <= this.boardY + this.boardSize) {
            
            const col = Math.floor((x - this.boardX) / (this.cellSize + this.cellGap));
            const row = Math.floor((y - this.boardY) / (this.cellSize + this.cellGap));

            if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
                if (this.activePowerup === 'hammer') {
                    if (this.grid[row][col]) {
                        const color = this.grid[row][col];
                        this.grid[row][col] = null;
                        this.powerups.hammer--;
                        this.activePowerup = null;
                        if (window.soundEngine) window.soundEngine.playPowerup('hammer');
                        
                        const cx = this.boardX + col * (this.cellSize + this.cellGap) + this.cellSize / 2;
                        const cy = this.boardY + row * (this.cellSize + this.cellGap) + this.cellSize / 2;
                        this.renderer.spawnBlastParticles(cx, cy, color, 14);
                        this.renderer.triggerShake(5, 0.2);
                        this.renderer.addFloatingText('SMASH!', cx, cy, { color: '#F97316' });
                        this.checkGameOver();
                    }
                } else if (this.activePowerup === 'bomb') {
                    // Clear 3x3 around row, col
                    let clearedCount = 0;
                    for (let r = row - 1; r <= row + 1; r++) {
                        for (let c = col - 1; c <= col + 1; c++) {
                            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.grid[r][c]) {
                                const color = this.grid[r][c];
                                this.grid[r][c] = null;
                                clearedCount++;
                                const cx = this.boardX + c * (this.cellSize + this.cellGap) + this.cellSize / 2;
                                const cy = this.boardY + r * (this.cellSize + this.cellGap) + this.cellSize / 2;
                                this.renderer.spawnBlastParticles(cx, cy, color, 12);
                            }
                        }
                    }
                    this.powerups.bomb--;
                    this.activePowerup = null;
                    if (window.soundEngine) window.soundEngine.playPowerup('bomb');
                    this.renderer.triggerShake(12, 0.35);
                    const cx = this.boardX + col * (this.cellSize + this.cellGap) + this.cellSize / 2;
                    const cy = this.boardY + row * (this.cellSize + this.cellGap) + this.cellSize / 2;
                    this.renderer.addFloatingText('BOOM! 💥', cx, cy, { color: '#EF4444', fontSize: 32 });
                    this.addScore(clearedCount * 25);
                    this.checkGameOver();
                }
            }
        } else {
            // Cancel powerup
            this.activePowerup = null;
        }
    }

    useRefreshPowerup() {
        if (this.powerups.refresh <= 0) return;
        this.powerups.refresh--;
        if (window.soundEngine) window.soundEngine.playPowerup('refresh');
        this.generateDockPieces();
        const cx = this.canvas.width / (2 * (window.devicePixelRatio || 1));
        this.renderer.addFloatingText('REFRESH! ✨', cx, this.dockY + 20, { color: '#38BDF8' });
    }

    useHammerPowerup() {
        if (this.powerups.hammer <= 0) return;
        this.activePowerup = (this.activePowerup === 'hammer') ? null : 'hammer';
    }

    useBombPowerup() {
        if (this.powerups.bomb <= 0) return;
        this.activePowerup = (this.activePowerup === 'bomb') ? null : 'bomb';
    }

    updateDragPlacement() {
        const piece = this.dragging.piece;
        if (!piece) return;

        // Calculate piece center top-left on board
        const pieceW = piece.cols * (this.cellSize + this.cellGap);
        const pieceH = piece.rows * (this.cellSize + this.cellGap);

        const targetX = this.dragging.curX - pieceW / 2;
        const targetY = this.dragging.curY - pieceH / 2;

        const col = Math.round((targetX - this.boardX) / (this.cellSize + this.cellGap));
        const row = Math.round((targetY - this.boardY) / (this.cellSize + this.cellGap));

        this.dragging.gridRow = row;
        this.dragging.gridCol = col;
        this.dragging.isValidPlacement = this.canPlacePiece(piece, row, col);

        this.dragging.highlightRows = [];
        this.dragging.highlightCols = [];

        if (this.dragging.isValidPlacement) {
            // Predict which rows and columns will clear!
            const tempGrid = this.grid.map(r => [...r]);
            for (let r = 0; r < piece.rows; r++) {
                for (let c = 0; c < piece.cols; c++) {
                    if (piece.matrix[r][c]) {
                        tempGrid[row + r][col + c] = piece.color;
                    }
                }
            }

            // Check full rows
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (tempGrid[r].every(cell => cell !== null)) {
                    this.dragging.highlightRows.push(r);
                }
            }

            // Check full cols
            for (let c = 0; c < BOARD_SIZE; c++) {
                let full = true;
                for (let r = 0; r < BOARD_SIZE; r++) {
                    if (tempGrid[r][c] === null) {
                        full = false;
                        break;
                    }
                }
                if (full) {
                    this.dragging.highlightCols.push(c);
                }
            }
        }
    }

    canPlacePiece(piece, startRow, startCol) {
        if (startRow < 0 || startCol < 0) return false;
        if (startRow + piece.rows > BOARD_SIZE || startCol + piece.cols > BOARD_SIZE) return false;

        for (let r = 0; r < piece.rows; r++) {
            for (let c = 0; c < piece.cols; c++) {
                if (piece.matrix[r][c]) {
                    if (this.grid[startRow + r][startCol + c] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    commitDragPlacement() {
        if (this.dragging.isValidPlacement) {
            const piece = this.dragging.piece;
            const startRow = this.dragging.gridRow;
            const startCol = this.dragging.gridCol;

            let blockCount = 0;
            for (let r = 0; r < piece.rows; r++) {
                for (let c = 0; c < piece.cols; c++) {
                    if (piece.matrix[r][c]) {
                        this.grid[startRow + r][startCol + c] = piece.color;
                        blockCount++;
                    }
                }
            }

            // Points for placing blocks
            this.addScore(blockCount * 10);
            if (window.soundEngine) window.soundEngine.playDrop();

            // Clear piece from dock
            this.dockPieces[this.dragging.slotIndex] = null;

            // Check line clears
            this.checkAndBlastLines();

            // If dock is empty, roll 3 new pieces
            if (this.dockPieces.every(p => p === null)) {
                this.generateDockPieces();
            } else {
                this.checkGameOver();
            }
        }
    }

    checkAndBlastLines() {
        const fullRows = [];
        const fullCols = [];

        // Check rows
        for (let r = 0; r < BOARD_SIZE; r++) {
            if (this.grid[r].every(cell => cell !== null)) {
                fullRows.push(r);
            }
        }

        // Check cols
        for (let c = 0; c < BOARD_SIZE; c++) {
            let full = true;
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (this.grid[r][c] === null) {
                    full = false;
                    break;
                }
            }
            if (full) {
                fullCols.push(c);
            }
        }

        const totalLines = fullRows.length + fullCols.length;

        if (totalLines > 0) {
            this.combo++;
            const cellsToBlast = new Set();

            for (const r of fullRows) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    cellsToBlast.add(`${r},${c}`);
                }
            }

            for (const c of fullCols) {
                for (let r = 0; r < BOARD_SIZE; r++) {
                    cellsToBlast.add(`${r},${c}`);
                }
            }

            // Spawn particles and clear
            cellsToBlast.forEach(key => {
                const [r, c] = key.split(',').map(Number);
                const color = this.grid[r][c];
                const cx = this.boardX + c * (this.cellSize + this.cellGap) + this.cellSize / 2;
                const cy = this.boardY + r * (this.cellSize + this.cellGap) + this.cellSize / 2;

                this.renderer.spawnBlastParticles(cx, cy, color, 14);
                this.grid[r][c] = null;
            });

            // Audio & visual feedback
            if (window.soundEngine) {
                window.soundEngine.playClear(totalLines, this.combo);
                if (this.combo >= 2) window.soundEngine.playComboFanfare(this.combo);
            }

            this.renderer.triggerShake(6 + totalLines * 4, 0.25 + totalLines * 0.05);

            // Scoring with combo multiplier
            const basePoints = (totalLines * 100) + (cellsToBlast.size * 10);
            const comboMultiplier = Math.max(1, this.combo);
            const totalPoints = basePoints * comboMultiplier;
            this.addScore(totalPoints);

            // Floating combo banners
            const centerBoardX = this.boardX + this.boardSize / 2;
            const centerBoardY = this.boardY + this.boardSize / 2;

            if (this.combo >= 2) {
                const compliments = ['AWESOME! 🔥', 'UNBELIEVABLE! 💥', 'SPECTACULAR! 🌟', 'BLOCK MASTER! 👑', 'LEGENDARY! ⚡'];
                const compliment = compliments[Math.min(this.combo - 2, compliments.length - 1)];
                this.renderer.addFloatingText(compliment, centerBoardX, centerBoardY - 30, {
                    color: '#FACC15',
                    fontSize: 28,
                    fontWeight: '900'
                });
                this.renderer.addFloatingText(`COMBO x${this.combo} (+${totalPoints})`, centerBoardX, centerBoardY + 15, {
                    color: '#38BDF8',
                    fontSize: 22
                });
            } else {
                this.renderer.addFloatingText(`+${totalPoints}`, centerBoardX, centerBoardY, {
                    color: '#4ADE80',
                    fontSize: 26
                });
            }
        } else {
            // Reset combo streak if no lines cleared
            this.combo = 0;
            if (this.onScoreUpdate) {
                this.onScoreUpdate(this.score, this.highScore, this.combo);
            }
        }
    }

    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('blockblast_highscore', this.highScore.toString());
        }
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score, this.highScore, this.combo);
        }
    }

    checkGameOver() {
        const remainingPieces = this.dockPieces.filter(p => p !== null);
        if (remainingPieces.length === 0) return;

        // Check if AT LEAST ONE piece can fit anywhere on the board
        let hasValidMove = false;

        for (const piece of remainingPieces) {
            for (let r = 0; r <= BOARD_SIZE - piece.rows; r++) {
                for (let c = 0; c <= BOARD_SIZE - piece.cols; c++) {
                    if (this.canPlacePiece(piece, r, c)) {
                        hasValidMove = true;
                        break;
                    }
                }
                if (hasValidMove) break;
            }
            if (hasValidMove) break;
        }

        if (!hasValidMove) {
            this.isGameOver = true;
            if (window.soundEngine) window.soundEngine.playGameOver();
            if (this.onGameOver) {
                this.onGameOver(this.score, this.highScore);
            }
        }
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(dt);
        this.render();

        requestAnimationFrame(this.loop);
    }

    update(dt) {
        this.renderer.update(dt);

        // Animate dock piece pop-in
        for (const p of this.dockPieces) {
            if (p && p.animScale < 1.0) {
                p.animScale = Math.min(1.0, p.animScale + dt * 4.5);
            }
        }
    }

    render() {
        const ctx = this.ctx;
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width || 380;
        const h = rect.height || 480;
        const dpr = window.devicePixelRatio || 1;

        // Guarantee rock-solid transform every single frame
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        ctx.save();
        this.renderer.applyShake();

        // 1. Draw 8x8 Board Background & Glow
        this.drawBoardFrame();

        // Special: In Poster Mode, draw vertical light beam through the central gap
        if (this.dockPieces[1] && this.dockPieces[1].isPosterPiece && !this.grid[5][4]) {
            const beamX = this.boardX + 3 * (this.cellSize + this.cellGap);
            const beamW = 3 * (this.cellSize + this.cellGap);
            const beamGrad = ctx.createLinearGradient(0, this.boardY, 0, this.boardY + this.boardSize);
            beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
            beamGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.22)');
            beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0.35)');
            ctx.fillStyle = beamGrad;
            ctx.fillRect(beamX, this.boardY, beamW, this.boardSize);
        }

        // 2. Draw Grid Slots & Filled Blocks
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const x = this.boardX + c * (this.cellSize + this.cellGap);
                const y = this.boardY + r * (this.cellSize + this.cellGap);

                // Draw recessed slot
                this.renderer.drawEmptySlot(x, y, this.cellSize);

                // Draw filled block if present
                const colorKey = this.grid[r][c];
                if (colorKey) {
                    this.renderer.drawBlock(x, y, this.cellSize, colorKey);
                }
            }
        }

        // 3. Highlight rows & cols that are about to blast!
        if (this.dragging.active && this.dragging.isValidPlacement) {
            const glowColor = 'rgba(250, 204, 21, 0.4)';
            ctx.fillStyle = glowColor;

            for (const r of this.dragging.highlightRows) {
                const y = this.boardY + r * (this.cellSize + this.cellGap);
                this.renderer.roundRect(ctx, this.boardX - 4, y - 2, this.boardSize + 8, this.cellSize + 4, 8);
                ctx.fill();
            }

            for (const c of this.dragging.highlightCols) {
                const x = this.boardX + c * (this.cellSize + this.cellGap);
                this.renderer.roundRect(ctx, x - 2, this.boardY - 4, this.cellSize + 4, this.boardSize + 8, 8);
                ctx.fill();
            }

            // Draw Ghost Piece on grid
            const piece = this.dragging.piece;
            const startRow = this.dragging.gridRow;
            const startCol = this.dragging.gridCol;

            for (let r = 0; r < piece.rows; r++) {
                for (let c = 0; c < piece.cols; c++) {
                    if (piece.matrix[r][c]) {
                        const x = this.boardX + (startCol + c) * (this.cellSize + this.cellGap);
                        const y = this.boardY + (startRow + r) * (this.cellSize + this.cellGap);
                        this.renderer.drawBlock(x, y, this.cellSize, piece.color, 0.65, true);
                    }
                }
            }
        }

        // 4. Draw Dock Pieces with Glowing Pedestals
        for (let i = 0; i < 3; i++) {
            const slot = this.dockSlots[i];
            if (!slot) continue;

            // Pedestal box for slot
            ctx.save();
            ctx.fillStyle = 'rgba(11, 28, 66, 0.75)';
            this.renderer.roundRect(ctx, slot.x + 3, slot.y + 4, slot.w - 6, slot.h - 8, 14);
            ctx.fill();
            ctx.strokeStyle = (i === 1 && this.dockPieces[1] && this.dockPieces[1].isPosterPiece) 
                ? 'rgba(250, 204, 21, 0.7)' 
                : 'rgba(56, 189, 248, 0.3)';
            ctx.lineWidth = 1.5;
            this.renderer.roundRect(ctx, slot.x + 3, slot.y + 4, slot.w - 6, slot.h - 8, 14);
            ctx.stroke();
            ctx.restore();

            const piece = this.dockPieces[i];
            if (!piece) continue;
            if (this.dragging.active && this.dragging.slotIndex === i) continue; // Currently being dragged

            // Adaptive piece scale so blocks are large, vibrant and clear
            const pUnit = this.cellSize + this.cellGap;
            const maxScaleW = (slot.w * 0.76) / (piece.cols * pUnit);
            const maxScaleH = (slot.h * 0.76) / (piece.rows * pUnit);
            let scale = Math.min(maxScaleW, maxScaleH);
            scale = Math.min(0.88, Math.max(0.48, scale));

            const pCellSize = this.cellSize * scale;
            const pGap = this.cellGap * scale;
            const totalW = piece.cols * (pCellSize + pGap);
            const totalH = piece.rows * (pCellSize + pGap);
            const px = slot.cx - totalW / 2;
            const py = slot.cy - totalH / 2;

            // Highlight glow on poster piece
            if (piece.isPosterPiece) {
                ctx.save();
                ctx.shadowColor = '#FACC15';
                ctx.shadowBlur = 18;
                for (let r = 0; r < piece.rows; r++) {
                    for (let c = 0; c < piece.cols; c++) {
                        if (piece.matrix[r][c]) {
                            const bx = px + c * (pCellSize + pGap);
                            const by = py + r * (pCellSize + pGap);
                            this.renderer.drawBlock(bx, by, pCellSize, piece.color, 1.0, false);
                        }
                    }
                }
                ctx.restore();
            } else {
                for (let r = 0; r < piece.rows; r++) {
                    for (let c = 0; c < piece.cols; c++) {
                        if (piece.matrix[r][c]) {
                            const bx = px + c * (pCellSize + pGap);
                            const by = py + r * (pCellSize + pGap);
                            this.renderer.drawBlock(bx, by, pCellSize, piece.color, 1.0, false);
                        }
                    }
                }
            }
        }

        // Draw hint text if poster piece is in dock
        if (this.dockPieces[1] && this.dockPieces[1].isPosterPiece && !this.dragging.active) {
            ctx.save();
            ctx.font = "bold 12px 'Outfit', sans-serif";
            ctx.fillStyle = '#FACC15';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            const isLandscape = (this.canvas.width / (window.devicePixelRatio || 1)) >= (this.canvas.height / (window.devicePixelRatio || 1)) * 1.12;
            const hintX = isLandscape ? (this.dockSlots[1].cx) : (this.boardX + this.boardSize / 2);
            const hintY = isLandscape ? Math.max(16, this.boardY - 10) : (this.dockY - 6);
            ctx.fillText('👆 TARIK BALOK KUNING KE CELAH! 💥', hintX, hintY);
            ctx.restore();
        }

        // 5. Draw Currently Dragged Piece (Full size directly following touch/cursor)
        if (this.dragging.active && this.dragging.piece) {
            const piece = this.dragging.piece;
            const pieceW = piece.cols * (this.cellSize + this.cellGap);
            const pieceH = piece.rows * (this.cellSize + this.cellGap);
            const startX = this.dragging.curX - pieceW / 2;
            const startY = this.dragging.curY - pieceH / 2;

            for (let r = 0; r < piece.rows; r++) {
                for (let c = 0; c < piece.cols; c++) {
                    if (piece.matrix[r][c]) {
                        const bx = startX + c * (this.cellSize + this.cellGap);
                        const by = startY + r * (this.cellSize + this.cellGap);
                        this.renderer.drawBlock(bx, by, this.cellSize, piece.color, 0.95, false);
                    }
                }
            }
        }

        // 6. Draw Particles & Floating Texts
        this.renderer.drawParticles();
        this.renderer.drawFloatingTexts();

        ctx.restore();
    }

    drawBoardFrame() {
        const ctx = this.ctx;
        const pad = 12;
        const bx = this.boardX - pad;
        const by = this.boardY - pad;
        const bw = this.boardSize + pad * 2;
        const bh = this.boardSize + pad * 2;
        const radius = 20;

        // Glowing backdrop behind board
        ctx.save();
        ctx.shadowColor = 'rgba(14, 165, 233, 0.35)';
        ctx.shadowBlur = 28;
        ctx.fillStyle = '#071536';
        this.renderer.roundRect(ctx, bx, by, bw, bh, radius);
        ctx.fill();
        ctx.restore();

        // Border stroke with neon cyan accent
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2.5;
        this.renderer.roundRect(ctx, bx, by, bw, bh, radius);
        ctx.stroke();

        // Dock background panel
        const dockPad = 8;
        const minX = Math.min(...this.dockSlots.map(s => s.x));
        const minY = Math.min(...this.dockSlots.map(s => s.y));
        const maxX = Math.max(...this.dockSlots.map(s => s.x + s.w));
        const maxY = Math.max(...this.dockSlots.map(s => s.y + s.h));
        const dx = minX - dockPad;
        const dy = minY - dockPad;
        const dw = maxX - minX + dockPad * 2;
        const dh = maxY - minY + dockPad * 2;

        ctx.fillStyle = 'rgba(11, 28, 66, 0.55)';
        this.renderer.roundRect(ctx, dx, dy, dw, dh, 16);
        ctx.fill();

        ctx.strokeStyle = 'rgba(30, 64, 135, 0.3)';
        ctx.lineWidth = 1.5;
        this.renderer.roundRect(ctx, dx, dy, dw, dh, 16);
        ctx.stroke();
    }
}

window.BlockBlastGame = BlockBlastGame;
