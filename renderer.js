// renderer.js - 3D Beveled Block & Particle Renderer for Block Blast
const THEME_COLORS = {
    yellow: { base: '#FBBF24', light: '#FEF08A', dark: '#B45309', glow: '#FDE047' },
    red:    { base: '#EF4444', light: '#FCA5A5', dark: '#B91C1C', glow: '#F87171' },
    cyan:   { base: '#06B6D4', light: '#A5F3FC', dark: '#0E7490', glow: '#67E8F9' },
    purple: { base: '#A855F7', light: '#E9D5FF', dark: '#7E22CE', glow: '#C084FC' },
    green:  { base: '#10B981', light: '#A7F3D0', dark: '#047857', glow: '#34D399' },
    orange: { base: '#F97316', light: '#FED7AA', dark: '#C2410C', glow: '#FB923C' },
    blue:   { base: '#3B82F6', light: '#BFDBFE', dark: '#1D4ED8', glow: '#60A5FA' }
};

class GameRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    triggerShake(intensity = 6, duration = 0.25) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    update(dt) {
        // Update screen shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime < 0) this.shakeTime = 0;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.rot += p.vrot * dt;
            p.life -= dt;
            p.scale = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy * dt;
            t.life -= dt;
            t.scale = 1 + Math.sin((1 - t.life / t.maxLife) * Math.PI) * 0.35;
            t.alpha = Math.min(1, t.life / (t.maxLife * 0.3));
            if (t.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    applyShake() {
        if (this.shakeTime > 0) {
            const factor = this.shakeTime * this.shakeIntensity * 2;
            const ox = (Math.random() - 0.5) * factor;
            const oy = (Math.random() - 0.5) * factor;
            this.ctx.translate(ox, oy);
        }
    }

    // Render iconic 3D beveled glossy block matching Block Blast artwork
    drawBlock(x, y, size, colorKey, alpha = 1.0, isGhost = false, scale = 1.0) {
        const ctx = this.ctx;
        const color = THEME_COLORS[colorKey] || THEME_COLORS.yellow;
        const radius = Math.max(3, size * 0.16);

        ctx.save();
        ctx.globalAlpha = alpha;

        if (scale !== 1.0) {
            const cx = x + size / 2;
            const cy = y + size / 2;
            ctx.translate(cx, cy);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -cy);
        }

        if (isGhost) {
            // Translucent glowing preview block
            ctx.strokeStyle = color.glow;
            ctx.lineWidth = 2.5;
            ctx.fillStyle = color.base;
            ctx.globalAlpha = 0.45;
            this.roundRect(ctx, x + 2, y + 2, size - 4, size - 4, radius);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            return;
        }

        // Drop shadow under block
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.roundRect(ctx, x + 1, y + size * 0.1, size - 2, size * 0.95, radius);
        ctx.fill();

        // Outer block frame (dark shadow base)
        ctx.fillStyle = color.dark;
        this.roundRect(ctx, x, y, size, size, radius);
        ctx.fill();

        // Top-Left bevel light highlight
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.arcTo(x + size, y, x + size, y + radius, radius);
        ctx.lineTo(x + size * 0.82, y + size * 0.18);
        ctx.lineTo(x + size * 0.18, y + size * 0.18);
        ctx.lineTo(x + size * 0.18, y + size * 0.82);
        ctx.lineTo(x, y + size - radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.fillStyle = color.light;
        ctx.fill();

        // Bottom-Right bevel deep shadow
        ctx.beginPath();
        ctx.moveTo(x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.arcTo(x + size, y + size, x + size - radius, y + size, radius);
        ctx.lineTo(x + radius, y + size);
        ctx.arcTo(x, y + size, x, y + size - radius, radius);
        ctx.lineTo(x + size * 0.18, y + size * 0.82);
        ctx.lineTo(x + size * 0.82, y + size * 0.82);
        ctx.lineTo(x + size * 0.82, y + size * 0.18);
        ctx.closePath();
        ctx.fillStyle = color.dark;
        ctx.fill();

        // Center raised face
        const innerInset = size * 0.16;
        const innerSize = size - innerInset * 2;
        const innerRadius = Math.max(2, radius * 0.7);

        // Subtle gradient on face
        const grad = ctx.createLinearGradient(x + innerInset, y + innerInset, x + innerInset, y + size - innerInset);
        grad.addColorStop(0, color.light);
        grad.addColorStop(0.2, color.base);
        grad.addColorStop(1, color.dark);

        ctx.fillStyle = grad;
        this.roundRect(ctx, x + innerInset, y + innerInset, innerSize, innerSize, innerRadius);
        ctx.fill();

        // Glossy specular shine on top half
        const shineH = innerSize * 0.42;
        const shineGrad = ctx.createLinearGradient(x + innerInset, y + innerInset, x + innerInset, y + innerInset + shineH);
        shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
        shineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

        ctx.fillStyle = shineGrad;
        this.roundRect(ctx, x + innerInset + 1, y + innerInset + 1, innerSize - 2, shineH, innerRadius * 0.8);
        ctx.fill();

        // Crisp border accent
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x + innerInset, y + innerInset, innerSize, innerSize, innerRadius);
        ctx.stroke();

        ctx.restore();
    }

    // Empty well on 8x8 grid
    drawEmptySlot(x, y, size) {
        const ctx = this.ctx;
        const r = Math.max(3, size * 0.14);

        // Recessed deep dark pocket
        ctx.fillStyle = '#0B1C42';
        this.roundRect(ctx, x, y, size, size, r);
        ctx.fill();

        // Inner shadow
        ctx.strokeStyle = '#071330';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x + 1, y + 1, size - 2, size - 2, r);
        ctx.stroke();

        // Subtle grid outline
        ctx.strokeStyle = 'rgba(30, 64, 135, 0.45)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, size, size, r);
        ctx.stroke();
    }

    // Helper for rounded rectangle
    roundRect(ctx, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // Spawn rich particle explosion when blocks blast
    spawnBlastParticles(cx, cy, colorKey, count = 12) {
        const color = THEME_COLORS[colorKey] || THEME_COLORS.yellow;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 320;
            const size = 6 + Math.random() * 10;
            this.particles.push({
                x: cx + (Math.random() - 0.5) * 16,
                y: cy + (Math.random() - 0.5) * 16,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                gravity: 420,
                rot: Math.random() * Math.PI,
                vrot: (Math.random() - 0.5) * 12,
                size: size,
                color: Math.random() > 0.4 ? color.base : (Math.random() > 0.5 ? color.light : '#FFFFFF'),
                darkColor: color.dark,
                life: 0.55 + Math.random() * 0.4,
                maxLife: 0.85,
                scale: 1.0,
                type: Math.random() > 0.3 ? 'cube' : 'spark'
            });
        }
    }

    // Add floating score / combo text
    addFloatingText(text, x, y, options = {}) {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            vy: options.vy || -85,
            color: options.color || '#FACC15',
            fontSize: options.fontSize || 24,
            fontWeight: options.fontWeight || '900',
            stroke: options.stroke || '#071330',
            life: options.duration || 1.1,
            maxLife: options.duration || 1.1,
            scale: 1.0,
            alpha: 1.0
        });
    }

    // Draw active particles
    drawParticles() {
        const ctx = this.ctx;
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.scale(p.scale, p.scale);
            ctx.globalAlpha = Math.min(1, p.scale * 1.2);

            if (p.type === 'cube') {
                // Mini 3D rotating shard
                const s = p.size;
                ctx.fillStyle = p.color;
                this.roundRect(ctx, -s / 2, -s / 2, s, s, 2);
                ctx.fill();

                // Highlight edge
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fillRect(-s / 2, -s / 2, s, s * 0.3);
            } else {
                // Glowing sparkle 4-pointed star
                const s = p.size * 1.2;
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(0, -s);
                ctx.quadraticCurveTo(0, 0, s, 0);
                ctx.quadraticCurveTo(0, 0, 0, s);
                ctx.quadraticCurveTo(0, 0, -s, 0);
                ctx.quadraticCurveTo(0, 0, 0, -s);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // Draw floating texts
    drawFloatingTexts() {
        const ctx = this.ctx;
        for (const t of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            ctx.translate(t.x, t.y);
            ctx.scale(t.scale, t.scale);

            ctx.font = `${t.fontWeight} ${t.fontSize}px 'Outfit', 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Bold dark outline
            ctx.lineJoin = 'round';
            ctx.lineWidth = 5;
            ctx.strokeStyle = t.stroke;
            ctx.strokeText(t.text, 0, 0);

            // Vibrant text fill
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, 0, 0);

            ctx.restore();
        }
    }
}

window.GameRenderer = GameRenderer;
window.THEME_COLORS = THEME_COLORS;
