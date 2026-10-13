// app.js - Main Game Controller, 16:9 Landscape Fullscreen & PWA Manager
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const scoreVal = document.getElementById('scoreVal');
    const highScoreVal = document.getElementById('highScoreVal');
    const comboBadge = document.getElementById('comboBadge');
    const comboText = document.getElementById('comboText');

    // Mode Buttons
    const modeBlockblastBtn = document.getElementById('modeBlockblast');
    const modeTetrisBtn = document.getElementById('modeTetris');

    // Controls and bars
    const powerupsBar = document.getElementById('powerupsBar');
    const tetrisControls = document.getElementById('tetrisControls');
    const bombBtn = document.getElementById('bombBtn');
    const hammerBtn = document.getElementById('hammerBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const bombCount = document.getElementById('bombCount');
    const hammerCount = document.getElementById('hammerCount');
    const refreshCount = document.getElementById('refreshCount');

    // Sound and Action buttons
    const presetBtn = document.getElementById('presetBtn');
    const sfxBtn = document.getElementById('sfxBtn');
    const bgmBtn = document.getElementById('bgmBtn');
    const restartBtn = document.getElementById('restartBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const installPwaBtn = document.getElementById('installPwaBtn');
    const promptFsBtn = document.getElementById('promptFsBtn');
    const landscapePrompt = document.getElementById('landscapePrompt');

    // Game Over Modal
    const gameOverModal = document.getElementById('gameOverModal');
    const modalScore = document.getElementById('modalScore');
    const modalBest = document.getElementById('modalBest');
    const restartModalBtn = document.getElementById('restartModalBtn');
    const reviveModalBtn = document.getElementById('reviveModalBtn');

    let currentMode = 'blockblast'; // 'blockblast' or 'tetris'
    let blockBlastGame = null;
    let tetrisGame = null;

    // Callbacks for Block Blast
    const onBlockBlastScore = (score, highScore, combo) => {
        scoreVal.textContent = score.toLocaleString();
        highScoreVal.textContent = highScore.toLocaleString();
        if (combo >= 2) {
            comboBadge.classList.add('show');
            comboText.textContent = `COMBO x${combo}!`;
        } else {
            comboBadge.classList.remove('show');
        }
        updatePowerupUI();
    };

    const onBlockBlastGameOver = (score, highScore) => {
        modalScore.textContent = score.toLocaleString();
        modalBest.textContent = highScore.toLocaleString();
        gameOverModal.classList.add('show');
    };

    // Callbacks for Tetris
    const onTetrisScore = (score, highScore, lines, level) => {
        scoreVal.textContent = score.toLocaleString();
        highScoreVal.textContent = highScore.toLocaleString();
        if (tetrisGame && tetrisGame.combo >= 2) {
            comboBadge.classList.add('show');
            comboText.textContent = `COMBO x${tetrisGame.combo}!`;
        } else {
            comboBadge.classList.remove('show');
        }
    };

    const onTetrisGameOver = (score, highScore) => {
        modalScore.textContent = score.toLocaleString();
        modalBest.textContent = highScore.toLocaleString();
        gameOverModal.classList.add('show');
    };

    // Initialize Block Blast game first
    blockBlastGame = new BlockBlastGame(canvas, onBlockBlastScore, onBlockBlastGameOver);

    function updatePowerupUI() {
        if (!blockBlastGame) return;
        bombCount.textContent = blockBlastGame.powerups.bomb;
        hammerCount.textContent = blockBlastGame.powerups.hammer;
        refreshCount.textContent = blockBlastGame.powerups.refresh;

        bombBtn.classList.toggle('active', blockBlastGame.activePowerup === 'bomb');
        hammerBtn.classList.toggle('active', blockBlastGame.activePowerup === 'hammer');
    }

    // Switch between modes
    function switchMode(mode) {
        if (currentMode === mode) return;
        currentMode = mode;

        if (mode === 'blockblast') {
            modeBlockblastBtn.classList.add('active');
            modeTetrisBtn.classList.remove('active');
            powerupsBar.style.display = 'flex';
            tetrisControls.classList.remove('show');

            if (tetrisGame) {
                tetrisGame.destroy();
                tetrisGame = null;
            }

            blockBlastGame = new BlockBlastGame(canvas, onBlockBlastScore, onBlockBlastGameOver);
            onBlockBlastScore(blockBlastGame.score, blockBlastGame.highScore, blockBlastGame.combo);
        } else {
            modeTetrisBtn.classList.add('active');
            modeBlockblastBtn.classList.remove('active');
            powerupsBar.style.display = 'none';
            tetrisControls.classList.add('show');

            blockBlastGame = null;

            tetrisGame = new TetrisGame(canvas, onTetrisScore, onTetrisGameOver);
            onTetrisScore(tetrisGame.score, tetrisGame.highScore, tetrisGame.lines, tetrisGame.level);
        }
        gameOverModal.classList.remove('show');
    }

    modeBlockblastBtn.addEventListener('click', () => switchMode('blockblast'));
    modeTetrisBtn.addEventListener('click', () => switchMode('tetris'));

    // Power-up button clicks
    bombBtn.addEventListener('click', () => {
        if (blockBlastGame) {
            blockBlastGame.useBombPowerup();
            updatePowerupUI();
        }
    });

    hammerBtn.addEventListener('click', () => {
        if (blockBlastGame) {
            blockBlastGame.useHammerPowerup();
            updatePowerupUI();
        }
    });

    refreshBtn.addEventListener('click', () => {
        if (blockBlastGame) {
            blockBlastGame.useRefreshPowerup();
            updatePowerupUI();
        }
    });

    // Sound controls
    sfxBtn.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        sfxBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    bgmBtn.addEventListener('click', () => {
        const isPlaying = window.soundEngine.toggleBGM();
        bgmBtn.textContent = isPlaying ? '🎵' : '💤';
    });

    presetBtn.addEventListener('click', () => {
        if (currentMode === 'blockblast' && blockBlastGame) {
            blockBlastGame.startNewGame(true); // Load iconic poster preset
        } else if (currentMode === 'tetris' && tetrisGame) {
            tetrisGame.startNewGame();
        }
        gameOverModal.classList.remove('show');
    });

    restartBtn.addEventListener('click', () => {
        if (currentMode === 'blockblast' && blockBlastGame) {
            blockBlastGame.startNewGame(false); // Clean empty board
        } else if (currentMode === 'tetris' && tetrisGame) {
            tetrisGame.startNewGame();
        }
        gameOverModal.classList.remove('show');
    });

    // ========================================================
    // FULLSCREEN & 16:9 LANDSCAPE CONTROLLER
    // ========================================================
    function toggleFullscreen() {
        const docEl = document.documentElement;
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

        if (!isFS) {
            const requestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
            if (requestFS) {
                requestFS.call(docEl).then(() => {
                    // Lock orientation to landscape if supported by browser/device
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(() => {});
                    }
                }).catch((err) => {
                    console.log('Fullscreen request bypassed:', err);
                });
            }
        } else {
            const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exitFS) {
                exitFS.call(document).catch(() => {});
            }
        }
    }

    function onFullscreenChange() {
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        if (fullscreenBtn) {
            fullscreenBtn.textContent = isFS ? '⛷' : '⛶';
            fullscreenBtn.title = isFS ? 'Keluar Layar Penuh (Esc / F)' : 'Layar Penuh (16:9 Fullscreen) [F]';
        }
        if (isFS && landscapePrompt) {
            landscapePrompt.style.display = 'none';
        }

        // Trigger immediate resize recalculation
        setTimeout(handleResize, 100);
        setTimeout(handleResize, 300);
    }

    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
    if (promptFsBtn) promptFsBtn.addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('msfullscreenchange', onFullscreenChange);

    // ========================================================
    // PROGRESSIVE WEB APP (PWA) INSTALLATION & SERVICE WORKER
    // ========================================================
    let deferredInstallPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default mini-infobar on mobile browsers
        e.preventDefault();
        deferredInstallPrompt = e;
        if (installPwaBtn) {
            installPwaBtn.style.display = 'flex';
            installPwaBtn.title = 'Pasang Game Block Blast (PWA)!';
        }
    });

    if (installPwaBtn) {
        installPwaBtn.addEventListener('click', async () => {
            if (!deferredInstallPrompt) {
                alert('Aplikasi sudah siap atau dapat dipasang via menu browser (titik tiga > Pasang Aplikasi / Tambahkan ke Layar Utama).');
                return;
            }
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') {
                installPwaBtn.style.display = 'none';
            }
            deferredInstallPrompt = null;
        });
    }

    window.addEventListener('appinstalled', () => {
        if (installPwaBtn) installPwaBtn.style.display = 'none';
        deferredInstallPrompt = null;
        console.log('Block Blast PWA installed successfully!');
    });

    // Register Service Worker for offline play
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('Service Worker registered with scope:', reg.scope))
                .catch((err) => console.log('Service Worker registration skipped:', err));
        });
    }

    // Keyboard Shortcuts: F = Fullscreen, M = Music, R = Restart
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'KeyF') {
            e.preventDefault();
            toggleFullscreen();
        } else if (e.code === 'KeyM') {
            e.preventDefault();
            bgmBtn.click();
        } else if (e.code === 'KeyR' && currentMode === 'blockblast') {
            e.preventDefault();
            restartBtn.click();
        }
    });

    // ResizeObserver ensures canvas always syncs with actual wrapper size
    function handleResize() {
        if (currentMode === 'blockblast' && blockBlastGame) {
            blockBlastGame.resize();
        } else if (currentMode === 'tetris' && tetrisGame) {
            tetrisGame.resize();
        }
    }

    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (window.ResizeObserver && canvasWrapper) {
        const ro = new ResizeObserver(handleResize);
        ro.observe(canvasWrapper);
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 150);
    });

    // Modal buttons
    restartModalBtn.addEventListener('click', () => {
        gameOverModal.classList.remove('show');
        if (currentMode === 'blockblast' && blockBlastGame) {
            blockBlastGame.startNewGame();
        } else if (currentMode === 'tetris' && tetrisGame) {
            tetrisGame.startNewGame();
        }
    });

    reviveModalBtn.addEventListener('click', () => {
        gameOverModal.classList.remove('show');
        if (currentMode === 'blockblast' && blockBlastGame) {
            // Revive by clearing the center 4x4 area & giving fresh pieces!
            for (let r = 2; r < 6; r++) {
                for (let c = 2; c < 6; c++) {
                    if (blockBlastGame.grid[r][c]) {
                        const color = blockBlastGame.grid[r][c];
                        const cx = blockBlastGame.boardX + c * (blockBlastGame.cellSize + blockBlastGame.cellGap) + blockBlastGame.cellSize / 2;
                        const cy = blockBlastGame.boardY + r * (blockBlastGame.cellSize + blockBlastGame.cellGap) + blockBlastGame.cellSize / 2;
                        blockBlastGame.renderer.spawnBlastParticles(cx, cy, color, 14);
                        blockBlastGame.grid[r][c] = null;
                    }
                }
            }
            blockBlastGame.isGameOver = false;
            blockBlastGame.generateDockPieces();
            blockBlastGame.renderer.triggerShake(14, 0.4);
            const cx = blockBlastGame.boardX + blockBlastGame.boardSize / 2;
            const cy = blockBlastGame.boardY + blockBlastGame.boardSize / 2;
            blockBlastGame.renderer.addFloatingText('REVIVED! ⚡', cx, cy, { color: '#FACC15', fontSize: 32 });
        } else if (currentMode === 'tetris' && tetrisGame) {
            // Clear top 12 rows
            for (let r = 0; r < 12; r++) {
                tetrisGame.grid[r] = Array(10).fill(null);
            }
            tetrisGame.isGameOver = false;
            tetrisGame.spawnNext();
        }
    });

    // Mobile Tetris On-screen Controls
    const setupTouchBtn = (id, action) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const trigger = (e) => {
            e.preventDefault();
            if (tetrisGame && !tetrisGame.isGameOver) {
                action();
            }
        };
        btn.addEventListener('touchstart', trigger, { passive: false });
        btn.addEventListener('mousedown', trigger);
    };

    setupTouchBtn('btnLeft', () => tetrisGame && tetrisGame.moveLeft());
    setupTouchBtn('btnRight', () => tetrisGame && tetrisGame.moveRight());
    setupTouchBtn('btnRotate', () => tetrisGame && tetrisGame.rotate());
    setupTouchBtn('btnDown', () => tetrisGame && tetrisGame.softDrop());
    setupTouchBtn('btnDrop', () => tetrisGame && tetrisGame.hardDrop());
    setupTouchBtn('btnHold', () => tetrisGame && tetrisGame.hold());

    // Update SFX icon initially
    if (window.soundEngine.muted) sfxBtn.textContent = '🔇';
    if (window.soundEngine.bgmMuted) bgmBtn.textContent = '💤';

    // Start BGM on first user interaction (browser autoplay policy)
    const startAudioOnFirstClick = () => {
        window.soundEngine.init();
        if (!window.soundEngine.bgmMuted && !window.soundEngine.bgmPlaying) {
            window.soundEngine.startBGM();
        }
        window.removeEventListener('pointerdown', startAudioOnFirstClick);
    };
    window.addEventListener('pointerdown', startAudioOnFirstClick);
});
