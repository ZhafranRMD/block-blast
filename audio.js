// audio.js - Web Audio API Sound System for Block Blast
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('blockblast_muted') === 'true';
        this.bgmMuted = localStorage.getItem('blockblast_bgm_muted') === 'true';
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('blockblast_muted', this.muted);
        return this.muted;
    }

    toggleBGM() {
        this.bgmMuted = !this.bgmMuted;
        localStorage.setItem('blockblast_bgm_muted', this.bgmMuted);
        if (this.bgmMuted) {
            this.stopBGM();
        } else {
            this.startBGM();
        }
        return !this.bgmMuted;
    }

    // Crisp pick sound when grabbing a block
    playPick() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.06);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Punchy tactile thud when dropping a block
    playDrop() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    // Hover tick when dragging over valid board cells
    playHover() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
    }

    // Harmonious blast chime with escalating pitch on combos!
    playClear(linesCount = 1, combo = 1) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        // Base pentatonic scale frequencies
        const baseFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        const pitchShift = Math.min(combo - 1, 6);
        const startIndex = Math.min(pitchShift, baseFreqs.length - 4);

        // Sub blast explosion noise & thud
        const blastOsc = this.ctx.createOscillator();
        const blastGain = this.ctx.createGain();
        blastOsc.type = 'sine';
        blastOsc.frequency.setValueAtTime(140 + linesCount * 20, now);
        blastOsc.frequency.exponentialRampToValueAtTime(40, now + 0.28);
        blastGain.gain.setValueAtTime(0.4, now);
        blastGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        blastOsc.connect(blastGain);
        blastGain.connect(this.ctx.destination);
        blastOsc.start(now);
        blastOsc.stop(now + 0.3);

        // Upward arpeggio bells
        const notesToPlay = Math.max(2, linesCount + 1);
        for (let i = 0; i < notesToPlay; i++) {
            const noteFreq = baseFreqs[Math.min(startIndex + i * 2, baseFreqs.length - 1)];
            const noteTime = now + i * 0.07;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = combo > 2 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(noteFreq, noteTime);

            gain.gain.setValueAtTime(0.25, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(noteTime);
            osc.stop(noteTime + 0.26);
        }
    }

    // High combo fanfare ("AWESOME!", "UNBELIEVABLE!")
    playComboFanfare(combo) {
        if (this.muted || combo < 2) return;
        this.init();
        const now = this.ctx.currentTime + 0.15;
        const chords = [
            [523.25, 659.25, 783.99], // C Major
            [587.33, 739.99, 880.00], // D Major
            [659.25, 830.61, 987.77], // E Major
            [783.99, 987.77, 1174.66] // G Major
        ];
        const chordIndex = Math.min(combo - 2, chords.length - 1);
        const chord = chords[chordIndex];

        chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            gain.gain.setValueAtTime(0.18, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + 0.46);
        });
    }

    // Power-up sounds
    playPowerup(type) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;

        if (type === 'bomb') {
            // Big explosion
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'hammer') {
            // Sharp metal smash
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'refresh') {
            // Magical sparkly swirl
            [440, 554, 659, 880].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.18, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.22);
            });
        }
    }

    // Game over sad chime
    playGameOver() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const freqs = [392, 349.23, 311.13, 261.63];
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.18);
            gain.gain.setValueAtTime(0.25, now + idx * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.18);
            osc.stop(now + idx * 0.18 + 0.36);
        });
    }

    // Upbeat, cute synthesized background arcade groove
    startBGM() {
        if (this.bgmMuted || this.bgmPlaying) return;
        this.init();
        this.bgmPlaying = true;
        this.bgmStep = 0;

        const melody = [
            261.63, 0, 329.63, 0, 392.00, 329.63, 523.25, 0,
            440.00, 0, 392.00, 0, 329.63, 0, 293.66, 0,
            261.63, 0, 329.63, 0, 392.00, 523.25, 659.25, 523.25,
            587.33, 0, 523.25, 0, 392.00, 0, 261.63, 0
        ];
        const bass = [
            130.81, 130.81, 130.81, 130.81, 174.61, 174.61, 174.61, 174.61,
            130.81, 130.81, 130.81, 130.81, 196.00, 196.00, 196.00, 196.00
        ];

        const tick = () => {
            if (!this.bgmPlaying || this.bgmMuted) return;
            const now = this.ctx.currentTime;
            const melNote = melody[this.bgmStep % melody.length];
            const bassNote = bass[Math.floor(this.bgmStep / 2) % bass.length];

            // Melody synth note
            if (melNote > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(melNote, now);
                gain.gain.setValueAtTime(0.045, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.17);
            }

            // Soft bass pulse
            if (this.bgmStep % 2 === 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sine';
                bOsc.frequency.setValueAtTime(bassNote, now);
                bGain.gain.setValueAtTime(0.05, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                bOsc.connect(bGain);
                bGain.connect(this.ctx.destination);
                bOsc.start(now);
                bOsc.stop(now + 0.23);
            }

            this.bgmStep++;
            this.bgmTimer = setTimeout(tick, 185);
        };

        tick();
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

window.soundEngine = new SoundEngine();
