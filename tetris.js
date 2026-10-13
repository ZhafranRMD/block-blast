// tetris.js - Falling Block Tetris Mode with Block Blast 3D Aesthetics & Blast Effects

const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;

const TETROMINOES = {
    I: { matrix: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: 'cyan' },
    J: { matrix: [[1,0,0], [1,1,1], [0,0,0]], color: 'blue' },
    L: { matrix: [[0,0,1], [1,1,1], [0,0,0]], color: 'orange' },
    O: { matrix: [[1,1], [1,1]], color: 'yellow' },
    S: { matrix: [[0,1,1], [1,1,0], [0,0,0]], color: 'green' },
    T: { matrix: [[0,1,0], [1,1,1], [0,0,0]], color: 'yellow' }, // Matching yellow T in photo!
    Z: { matrix: [[1,1,0], [0,1,1], [0,0,0]], color: 'red' }
};

class TetrisGame {
    constructor(canvas, onScoreUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.renderer = new GameRenderer(this.ctx);
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;

        this.grid = Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(null));
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('tetrisblast_highscore') || '0', 10);
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.isGameOver = false;
        this.isPaused = false;

        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;

        this.dropInterval = 800; // ms per drop
        this.dropTimer = 0;

        // Board layout sizing
        this.boardX = 0;
        this.boardY = 0;
        this.boardW = 0;
        this.boardH = 0;
        this.cellSize = 0;

        this.bindInput();
        this.resize();
        this.startNewGame();

        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        this.animFrame = requestAnimationFrame(this.loop);
    }

    destroy() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
        }
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler);
        }
    }

    startNewGame() {
        this.grid = Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(null));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.dropInterval = 800;
        this.isGameOver = false;
        this.holdPiece = null;
        this.canHold = true;

        this.bag = [];
        this.nextPiece = this.popPiece();
        this.spawnNext();

        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score, this.highScore, this.lines, this.level);
        }
    }

    popPiece() {
        if (!this.bag || this.bag.length === 0) {
            this.bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'].sort(() => Math.random() - 0.5);
        }
        const key = this.bag.pop();
        const def = TETROMINOES[key];
        return {
            type: key,
            matrix: def.matrix.map(r => [...r]),
            color: def.color,
            x: Math.floor(TETRIS_COLS / 2) - Math.ceil(def.matrix[0].length / 2),
            y: 0
        };
    }

    spawnNext() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.popPiece();
        this.canHold = true;

        // Check if spawn position is blocked
        if (this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y)) {
            this.isGameOver = true;
            if (window.soundEngine) window.soundEngine.playGameOver();
            if (this.onGameOver) this.onGameOver(this.score, this.highScore);
        }
    }

    hold() {
        if (!this.canHold || this.isGameOver) return;
        if (window.soundEngine) window.soundEngine.playPick();

        if (!this.holdPiece) {
            this.holdPiece = {
                type: this.currentPiece.type,
                matrix: TETROMINOES[this.currentPiece.type].matrix.map(r => [...r]),
                color: this.currentPiece.color
            };
            this.spawnNext();
        } else {
            const temp = this.holdPiece;
            this.holdPiece = {
                type: this.currentPiece.type,
                matrix: TETROMINOES[this.currentPiece.type].matrix.map(r => [...r]),
                color: this.currentPiece.color
            };
            this.currentPiece = {
                type: temp.type,
                matrix: TETROMINOES[temp.type].matrix.map(r => [...r]),
                color: temp.color,
                x: Math.floor(TETRIS_COLS / 2) - Math.ceil(temp.matrix[0].length / 2),
                y: 0
            };
        }
        this.canHold = false;
    }

    rotateMatrix(matrix) {
        const N = matrix.length;
        const result = Array(N).fill(null).map(() => Array(N).fill(0));
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                result[c][N - 1 - r] = matrix[r][c];
            }
        }
        return result;
    }

    rotate() {
        if (!this.currentPiece || this.isGameOver) return;
        const rotated = this.rotateMatrix(this.currentPiece.matrix);
        // Wall kick offsets
        const kicks = [0, 1, -1, 2, -2];
        for (const k of kicks) {
            if (!this.checkCollision(rotated, this.currentPiece.x + k, this.currentPiece.y)) {
                this.currentPiece.matrix = rotated;
                this.currentPiece.x += k;
                if (window.soundEngine) window.soundEngine.playPick();
                return;
            }
        }
    }

    moveLeft() {
        if (!this.currentPiece || this.isGameOver) return;
        if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x - 1, this.currentPiece.y)) {
            this.currentPiece.x--;
            if (window.soundEngine) window.soundEngine.playHover();
        }
    }

    moveRight() {
        if (!this.currentPiece || this.isGameOver) return;
        if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x + 1, this.currentPiece.y)) {
            this.currentPiece.x++;
            if (window.soundEngine) window.soundEngine.playHover();
        }
    }

    softDrop() {
        if (!this.currentPiece || this.isGameOver) return;
        if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            this.score += 1;
            if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.highScore, this.lines, this.level);
        } else {
            this.lockPiece();
        }
    }

    hardDrop() {
        if (!this.currentPiece || this.isGameOver) return;
        let dropCount = 0;
        while (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            dropCount++;
        }
        this.score += dropCount * 2;
        if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.highScore, this.lines, this.level);
        this.renderer.triggerShake(4, 0.15);
        this.lockPiece();
    }

    checkCollision(matrix, px, py) {
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c]) {
                    const gx = px + c;
                    const gy = py + r;
                    if (gx < 0 || gx >= TETRIS_COLS || gy >= TETRIS_ROWS) return true;
                    if (gy >= 0 && this.grid[gy][gx] !== null) return true;
                }
            }
        }
        return false;
    }

    getGhostY() {
        if (!this.currentPiece) return 0;
        let gy = this.currentPiece.y;
        while (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, gy + 1)) {
            gy++;
        }
        return gy;
    }

    lockPiece() {
        const piece = this.currentPiece;
        for (let r = 0; r < piece.matrix.length; r++) {
            for (let c = 0; c < piece.matrix[r].length; c++) {
                if (piece.matrix[r][c]) {
                    const gx = piece.x + c;
                    const gy = piece.y + r;
                    if (gy >= 0 && gy < TETRIS_ROWS && gx >= 0 && gx < TETRIS_COLS) {
                        this.grid[gy][gx] = piece.color;
                    }
                }
            }
        }

        if (window.soundEngine) window.soundEngine.playDrop();
        this.checkLineClears();
        this.spawnNext();
    }

    checkLineClears() {
        const clearedRows = [];
        for (let r = 0; r < TETRIS_ROWS; r++) {
            if (this.grid[r].every(c => c !== null)) {
                clearedRows.push(r);
            }
        }

        if (clearedRows.length > 0) {
            this.combo++;
            for (const r of clearedRows) {
                for (let c = 0; c < TETRIS_COLS; c++) {
                    const color = this.grid[r][c];
                    const cx = this.boardX + c * this.cellSize + this.cellSize / 2;
                    const cy = this.boardY + r * this.cellSize + this.cellSize / 2;
                    this.renderer.spawnBlastParticles(cx, cy, color, 12);
                }
                this.grid.splice(r, 1);
                this.grid.unshift(Array(TETRIS_COLS).fill(null));
            }

            this.lines += clearedRows.length;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(120, 800 - (this.level - 1) * 65);

            const lineScores = [0, 100, 300, 500, 800];
            const basePts = lineScores[clearedRows.length] || 1000;
            const pts = basePts * this.level * Math.max(1, this.combo);
            this.score += pts;

            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('tetrisblast_highscore', this.highScore.toString());
            }

            if (window.soundEngine) {
                window.soundEngine.playClear(clearedRows.length, this.combo);
                if (this.combo >= 2) window.soundEngine.playComboFanfare(this.combo);
            }

            this.renderer.triggerShake(5 + clearedRows.length * 4, 0.25);

            const cx = this.boardX + this.boardW / 2;
            const cy = this.boardY + clearedRows[0] * this.cellSize;
            if (clearedRows.length === 4) {
                this.renderer.addFloatingText('TETRIS BLAST! 💥', cx, cy, { color: '#FACC15', fontSize: 30 });
            } else {
                this.renderer.addFloatingText(`+${pts}`, cx, cy, { color: '#38BDF8', fontSize: 24 });
            }

            if (this.onScoreUpdate) {
                this.onScoreUpdate(this.score, this.highScore, this.lines, this.level);
            }
        } else {
            this.combo = 0;
        }
    }

    bindInput() {
        this.keyHandler = (e) => {
            if (this.isGameOver) return;
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    e.preventDefault();
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    e.preventDefault();
                    this.moveRight();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    e.preventDefault();
                    this.rotate();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    e.preventDefault();
                    this.softDrop();
                    break;
                case 'Space':
                    e.preventDefault();
                    this.hardDrop();
                    break;
                case 'KeyC':
                case 'ShiftLeft':
                case 'ShiftRight':
                    e.preventDefault();
                    this.hold();
                    break;
            }
        };
        window.addEventListener('keydown', this.keyHandler);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;

        this.boardH = Math.min(h - 32, Math.floor((w - 180) / TETRIS_COLS * TETRIS_ROWS));
        this.cellSize = Math.max(14, Math.floor(this.boardH / TETRIS_ROWS));
        this.boardH = this.cellSize * TETRIS_ROWS;
        this.boardW = this.cellSize * TETRIS_COLS;
        this.boardX = Math.floor((w - this.boardW) / 2);
        this.boardY = Math.max(16, Math.floor((h - this.boardH) / 2));
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        if (!this.isGameOver && !this.isPaused) {
            this.dropTimer += dt * 1000;
            if (this.dropTimer >= this.dropInterval) {
                this.dropTimer = 0;
                this.softDrop();
            }
        }

        this.renderer.update(dt);
        this.render();

        this.animFrame = requestAnimationFrame(this.loop);
    }

    render() {
        const ctx = this.ctx;
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.save();
        ctx.clearRect(0, 0, w, h);
        this.renderer.applyShake();

        // 1. Board Frame & Grid
        const pad = 8;
        ctx.fillStyle = '#071536';
        this.renderer.roundRect(ctx, this.boardX - pad, this.boardY - pad, this.boardW + pad * 2, this.boardH + pad * 2, 16);
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        this.renderer.roundRect(ctx, this.boardX - pad, this.boardY - pad, this.boardW + pad * 2, this.boardH + pad * 2, 16);
        ctx.stroke();

        // 2. Draw Grid Slots
        for (let r = 0; r < TETRIS_ROWS; r++) {
            for (let c = 0; c < TETRIS_COLS; c++) {
                const x = this.boardX + c * this.cellSize;
                const y = this.boardY + r * this.cellSize;
                this.renderer.drawEmptySlot(x, y, this.cellSize);

                const colorKey = this.grid[r][c];
                if (colorKey) {
                    this.renderer.drawBlock(x, y, this.cellSize, colorKey);
                }
            }
        }

        // 3. Ghost Piece
        if (this.currentPiece && !this.isGameOver) {
            const gy = this.getGhostY();
            const matrix = this.currentPiece.matrix;
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c]) {
                        const gx = this.currentPiece.x + c;
                        const gy2 = gy + r;
                        if (gy2 >= 0 && gy2 < TETRIS_ROWS) {
                            const x = this.boardX + gx * this.cellSize;
                            const y = this.boardY + gy2 * this.cellSize;
                            this.renderer.drawBlock(x, y, this.cellSize, this.currentPiece.color, 0.45, true);
                        }
                    }
                }
            }

            // 4. Active Falling Piece
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c]) {
                        const gx = this.currentPiece.x + c;
                        const gy2 = this.currentPiece.y + r;
                        if (gy2 >= 0 && gy2 < TETRIS_ROWS) {
                            const x = this.boardX + gx * this.cellSize;
                            const y = this.boardY + gy2 * this.cellSize;
                            this.renderer.drawBlock(x, y, this.cellSize, this.currentPiece.color, 1.0, false);
                        }
                    }
                }
            }
        }

        // 5. Draw Next & Hold side previews (if screen has room)
        this.drawSidePreviews();

        // 6. Particles & Floating Texts
        this.renderer.drawParticles();
        this.renderer.drawFloatingTexts();

        ctx.restore();
    }

    drawSidePreviews() {
        const ctx = this.ctx;
        const sideW = Math.min(65, this.boardX - 16);
        if (sideW < 40) return; // Not enough room on very narrow phone

        // Draw Next Piece on right
        const rightX = this.boardX + this.boardW + 10;
        if (this.nextPiece && rightX + sideW <= this.canvas.width / (window.devicePixelRatio || 1)) {
            ctx.fillStyle = 'rgba(11, 28, 66, 0.6)';
            this.renderer.roundRect(ctx, rightX, this.boardY, sideW, 70, 10);
            ctx.fill();

            ctx.font = "bold 11px 'Outfit', sans-serif";
            ctx.fillStyle = '#94A3B8';
            ctx.textAlign = 'center';
            ctx.fillText('NEXT', rightX + sideW / 2, this.boardY + 16);

            const m = this.nextPiece.matrix;
            const pSize = 12;
            const startX = rightX + (sideW - m[0].length * pSize) / 2;
            const startY = this.boardY + 26;
            for (let r = 0; r < m.length; r++) {
                for (let c = 0; c < m[r].length; c++) {
                    if (m[r][c]) {
                        this.renderer.drawBlock(startX + c * pSize, startY + r * pSize, pSize, this.nextPiece.color);
                    }
                }
            }
        }

        // Draw Hold Piece on left
        const leftX = this.boardX - sideW - 10;
        if (leftX >= 5) {
            ctx.fillStyle = 'rgba(11, 28, 66, 0.6)';
            this.renderer.roundRect(ctx, leftX, this.boardY, sideW, 70, 10);
            ctx.fill();

            ctx.font = "bold 11px 'Outfit', sans-serif";
            ctx.fillStyle = '#94A3B8';
            ctx.textAlign = 'center';
            ctx.fillText('HOLD', leftX + sideW / 2, this.boardY + 16);

            if (this.holdPiece) {
                const m = this.holdPiece.matrix;
                const pSize = 12;
                const startX = leftX + (sideW - m[0].length * pSize) / 2;
                const startY = this.boardY + 26;
                for (let r = 0; r < m.length; r++) {
                    for (let c = 0; c < m[r].length; c++) {
                        if (m[r][c]) {
                            this.renderer.drawBlock(startX + c * pSize, startY + r * pSize, pSize, this.holdPiece.color);
                        }
                    }
                }
            }
        }
    }
}

window.TetrisGame = TetrisGame;
