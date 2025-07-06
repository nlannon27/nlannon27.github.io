import { cellIndex, diffuseField, enforceIncompressibility, advectField } from './mathUtils.js'

// gridSize is number of cells per row and column
const gridSize = 256
// numSolverPasses is number of Gauss–Seidel iterations
const numSolverPasses = 16
// renderScale enlarges each cell when drawing
const renderScale = 4
// colors to use for density and velocity
const palette = [
    '#63637a',  // background
    '#22d3ee',  // teal
    '#a78bfa',  // purple
    '#ff4d5a',  // orange
]
const DENSITY_CUT   = 20;   // do not draw if d < 20
// lookup-table to reduce color interpolation at runtime
const densityLUT = (() => {
  // "#rrggbb" → [r,g,b] helper
  const toRGB = (hex) => {
    const v = parseInt(hex.slice(1), 16);
    return [v >> 16 & 255, v >> 8 & 255, v & 255];
  };

  const rgb = palette.map(toRGB);
  const out = new Array(256);

  for (let d = 0; d < 256; d++) {
    const t   = d / 255;
    const seg = t * (palette.length - 1);
    const i   = Math.floor(seg);
    const w   = seg - i;

    const c0  = rgb[i];
    const c1  = rgb[Math.min(i + 1, rgb.length - 1)];
    const mix = (a, b) => Math.round(a + (b - a) * w);

    out[d] = `rgb(${mix(c0[0], c1[0])},${mix(c0[1], c1[1])},${mix(c0[2], c1[2])})`;
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
        p.noStroke();
        p.colorMode(p.RGB, 255);

        for (let y = 0, idx = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++, idx++) {
                const d = Math.min(255, this.density[idx] | 0);
                if (d < DENSITY_CUT) 
                    continue;

                p.fill(densityLUT[d]);
                p.rect(x * renderScale, y * renderScale, renderScale, renderScale);
            }
        }
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