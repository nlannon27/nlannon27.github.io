import { cellIndex, diffuseField, enforceIncompressibility, advectField } from './mathUtils.js'

const gridSize = 256;
const numSolverPasses = 16;

let renderScale = 4;
export function setRenderScale(s) { renderScale = s };
export function getRenderScale() { return renderScale };

const palette = [
    '#63637a',  // background
    '#22d3ee',  // teal
    '#a78bfa',  // purple
    '#ff4d5a',  // orange
]
const DENSITY_CUT = 5;

const clamp8 = v => (v < 0 ? 0 : v > 255 ? 255 : (v | 0));

// precompute rgba values
const densityLUT_RGBA = (() => {
  const toRGB = (hex) => {
    const v = parseInt(hex.slice(1), 16);
    return [v >> 16 & 255, v >> 8 & 255, v & 255];
  };
  const rgb = palette.map(toRGB);
  const out = new Uint8ClampedArray(256 * 4);
  for(let d = 0; d < 256; d++) {
    const t = d / 255;
    const seg = t * (palette.length - 1);
    const i = Math.floor(seg);
    const w = seg - i;

    const c0 = rgb[i];
    const c1 = rgb[Math.min(i + 1, rgb.length - 1)];
    const mix = (a, b) => Math.round(a + (b - a) * w);

    const o = d * 4;
    out[o    ] = mix(c0[0], c1[0]);
    out[o + 1] = mix(c0[1], c1[1]);
    out[o + 2] = mix(c0[2], c1[2]);
    out[o + 3] = 255;
  }
  return out;
})();

/**
 * Fluid class holds state and methods for fluid sim
 * dt        is time step
 * diffusion is rate of density spread
 * viscosity is rate of velocity smoothing
 */
class Fluid {
    constructor(dt, diffusion, viscosity) {
        this.dt = dt
        this.diffusion = diffusion
        this.viscosity = viscosity

        // temp arrays for solver
        this.prevDensity = new Array(gridSize * gridSize).fill(0)
        this.density = new Array(gridSize * gridSize).fill(0)

        // velocity arrays
        this.velocityX = new Array(gridSize * gridSize).fill(0)
        this.velocityY = new Array(gridSize * gridSize).fill(0)
        this.prevVelocityX = new Array(gridSize * gridSize).fill(0)
        this.prevVelocityY = new Array(gridSize * gridSize).fill(0)

        // image to render density to
        this._tex = null
    }

    /**
     * step()
     * Advance fluid state by one time step
     * 1 diffuse velocity
     * 2 project to remove divergence
     * 3 advect velocity
     * 4 project again
     * 5 diffuse density
     * 6 advect density
     */
    step() {
        // shorthand refs
        const dt = this.dt
        const diff = this.diffusion
        const visc = this.viscosity

        // velocity diffusion
        diffuseField(1, this.prevVelocityX, this.velocityX, visc, dt)
        diffuseField(2, this.prevVelocityY, this.velocityY, visc, dt)

        // make velocity divergence free
        enforceIncompressibility(
            this.prevVelocityX,
            this.prevVelocityY,
            this.velocityX,
            this.velocityY
        )

        // advect velocity through itself
        advectField(
            1,
            this.velocityX,
            this.prevVelocityX,
            this.prevVelocityX,
            this.prevVelocityY,
            dt
        )
        advectField(
            2,
            this.velocityY,
            this.prevVelocityY,
            this.prevVelocityX,
            this.prevVelocityY,
            dt
        )

        // enforce incompressibility again
        enforceIncompressibility(
            this.velocityX,
            this.velocityY,
            this.prevVelocityX,
            this.prevVelocityY
        )

        // diffuse density
        diffuseField(0, this.prevDensity, this.density, diff, dt)
        // advect density through velocity field
        advectField(
            0,
            this.density,
            this.prevDensity,
            this.velocityX,
            this.velocityY,
            dt
        )

        // fade density
        this.fadeDensity(dt)
    }

    /**
     * addDensity(x, y, amount)
     * Add given amount of density at cell x,y
     */
    addDensity(x, y, amount) {
        const i = cellIndex(x, y)
        this.density[i] += amount
    }

    /**
     * addVelocity(x, y, amountX, amountY)
     * Add velocity vector at cell x,y
     */
    addVelocity(x, y, amountX, amountY) {
        const i = cellIndex(x, y)
        this.velocityX[i] += amountX
        this.velocityY[i] += amountY
    }

    /*
        renderDensity()
        Draw density as colored squares
        Pick one of the three palette colors based on density
    */
    renderDensity(p) {
        if(!this._tex) {
            this._tex = p.createGraphics(gridSize, gridSize, p.P2D);
            if(typeof this._tex.pixelDensity === "function") 
                this._tex.pixelDensity(1);
            if(typeof this._tex.noSmooth === "function") 
                this._tex.noSmooth();
            if(p.drawingContext && "imageSmoothingEnabled" in p.drawingContext) {
                p.drawingContext.imageSmoothingEnabled = false;
            } else if (p.noSmooth) {
                p.noSmooth();
            }
        }

        const g = this._tex;
        const W = gridSize, H = gridSize;
        const dens = this.density;

        g.loadPixels();
        const px = g.pixels; // Uint8ClampedArray

        // write pixels
        for(let i = 0, o = 0; i < W * H; i++, o += 4) {
            const d = clamp8(dens[i] | 0);
            if (d < DENSITY_CUT) {
                // transparent pixel
                px[o    ] = 0;
                px[o + 1] = 0;
                px[o + 2] = 0;
                px[o + 3] = 0;
                continue;
            }
            const lo = d * 4;
            px[o    ] = densityLUT_RGBA[lo    ];
            px[o + 1] = densityLUT_RGBA[lo + 1];
            px[o + 2] = densityLUT_RGBA[lo + 2];
            px[o + 3] = 255;
        }

        g.updatePixels();
        p.image(g, 0, 0, W * renderScale, H * renderScale);
    }

    /*
        renderVelocity()
        Draw velocity arrows tinted by speed,
        then pick the nearest palette hue
    */
    renderVelocity(p) {
        p.noFill();
        p.strokeWeight(1);
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const i = cellIndex(x, y);
                const vx = this.velocityX[i];
                const vy = this.velocityY[i];

                if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1)
                    continue;

                const speed2 = vx * vx + vy * vy;
                const bucket = speed2 < 1 ? 0 : speed2 < 4 ? 1 : 2;
                const col = palette[bucket];
                p.stroke(col);
                p.line(
                    x * renderScale,
                    y * renderScale,
                    x * renderScale + vx * renderScale,
                    y * renderScale + vy * renderScale
                );
            }
        }
    }

    /**
     * render(renderMode: 0 | 1)
     * Draws either the velocity field or density
     */
    render(renderMode, p) {
        if (renderMode == 0) {
            this.renderDensity(p);
        } else {
            this.renderVelocity(p);
        }
    }

    /**
     * fadeDensity()
     * Gradually reduce density in each cell
     */
    fadeDensity(dt) {
        const decay = 0.02;
        const k = 1 - decay * dt;
        for (let i = 0; i < this.density.length; i++) {
            this.density[i] *= k;
        }
    }
}

export default Fluid;
export { gridSize, numSolverPasses, renderScale }