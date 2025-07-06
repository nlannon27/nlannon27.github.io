// src/lib/fluidSketch.js
import Fluid from './fluid.js';
import { gridSize, numSolverPasses, renderScale } from './fluid.js'

export default (p5) => {
    let fluid;
    let prevMouseX = -1;
    let prevMouseY = -1;
    let renderMode = 0;
    const renderScale = 4;
    let t = 0

    p5.setup = () => {
        p5.createCanvas(600, 600);
        p5.frameRate(22);
        fluid = new Fluid(0.2, 0, 1e-7);
    };

    p5.draw = () => {
        p5.background('#63637a');
        const inBounds = p5.mouseX >= 0 && p5.mouseX < p5.width && p5.mouseY >= 0 && p5.mouseY < p5.height;

        if (inBounds) {
            if (prevMouseX < 0) {
                prevMouseX = p5.mouseX;
                prevMouseY = p5.mouseY;
            }
            const vx = (p5.mouseX - prevMouseX) * 4;
            const vy = (p5.mouseY - prevMouseY) * 4;
            const gx = Math.floor(p5.mouseX / renderScale);
            const gy = Math.floor(p5.mouseY / renderScale);
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    fluid.addDensity(gx + i, gy + j, p5.random(50, 10));
                }
            }
            fluid.addVelocity(gx, gy, vx, vy);
            prevMouseX = p5.mouseX;
            prevMouseY = p5.mouseY;
        }

        const xPix = p5.width / 2;
        const yPix = (p5.height * 0.5) + Math.sin(t) * (p5.height * 0.4);

        const gx = Math.floor(xPix / renderScale);
        const gy = Math.floor(yPix / renderScale);

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                fluid.addDensity(gx + i, gy + j, p5.random(50, 250));
                fluid.addVelocity(gx + i, gy + j, Math.sin(t * 4), -0.4);
            }
        }
        t += 0.03;

        fluid.step();
        fluid.render(renderMode, p5);
    };

    p5.mouseClicked = () => {
        const inBounds = p5.mouseX >= 0 && p5.mouseX < p5.width && p5.mouseY >= 0 && p5.mouseY < p5.height;

        if (inBounds)
            renderMode = renderMode === 0 ? 1 : 0;
    };
};
