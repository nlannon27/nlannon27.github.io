// src/lib/fluidSketch.js
import Fluid, { gridSize, setRenderScale, getRenderScale } from "./fluid.js";

// Pick a render scale that keeps the sim inside the viewport
function chooseScale(containerWidth) {
    return Math.max(1, Math.min(4, Math.floor(containerWidth / gridSize)));
}

export default (p5) => {
    // sim state
    let fluid;
    let prevMouseX = -1;
    let prevMouseY = -1;
    let renderMode = 0; // 0 = density, 1 = velocity
    let t = 0;

    let canvasSize = 0;
    let renderScale = 4;

    function resizeToParent() {
        const w = p5.canvas.parentElement.clientWidth;
        renderScale = chooseScale(w);
        setRenderScale(renderScale);
        canvasSize = renderScale * gridSize;
        p5.resizeCanvas(canvasSize, canvasSize);
    }

    // initial setup
    p5.setup = () => {
        p5.createCanvas(canvasSize, canvasSize);
        p5.frameRate(22);
        fluid = new Fluid(0.2, 0, 1e-7);

        p5.canvas.style.touchAction = 'none'
        for (const evt of ['touchstart', 'touchmove', 'touchend'])
            p5.canvas.addEventListener(evt, e => e.preventDefault(), { passive: false });

        resizeToParent();
        window.addEventListener('resize', resizeToParent);
    };

    // main loop 
    p5.draw = () => {
        p5.background("#63637a");

        const inBounds =
            p5.mouseX >= 0 && p5.mouseX < p5.width &&
            p5.mouseY >= 0 && p5.mouseY < p5.height;

        if (inBounds) {
            // start a drag
            if (prevMouseX < 0) {
                prevMouseX = p5.mouseX;
                prevMouseY = p5.mouseY;
            }

            // velocity from mouse movement
            const vx = (p5.mouseX - prevMouseX) * 4;
            const vy = (p5.mouseY - prevMouseY) * 4;

            // grid coords under cursor
            const gx = Math.floor(p5.mouseX / renderScale);
            const gy = Math.floor(p5.mouseY / renderScale);

            // inject density + velocity in a 3×3 patch
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    fluid.addDensity(gx + i, gy + j, p5.random(50, 250));
                    fluid.addVelocity(gx + i, gy + j, vx, vy);
                }
            }

            prevMouseX = p5.mouseX;
            prevMouseY = p5.mouseY;
        } else {
            prevMouseX = -1;
            prevMouseY = -1;
        }

        const xPix = p5.width / 2;
        const yPix = (p5.height * 0.5) + Math.sin(t) * (p5.height * 0.4);

        const gx = Math.floor(xPix / renderScale);
        const gy = Math.floor(yPix / renderScale);

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                fluid.addDensity(gx + i, gy + j, p5.random(100, 350));
                fluid.addVelocity(gx + i, gy + j, Math.sin(t * 4), -0.4);
            }
        }

        t += 0.03;
        fluid.step();
        fluid.render(renderMode, p5);
    };

    // toggle render mode with a click
    /*
    p5.mouseClicked = () => {
      const inside =
        p5.mouseX >= 0 && p5.mouseX < p5.width &&
        p5.mouseY >= 0 && p5.mouseY < p5.height;
  
      if(inside) { 
          renderMode = renderMode === 0 ? 1 : 0;
      }
    };
    */
};
