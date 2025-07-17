// src/lib/fluidSketch.js
import Fluid, { gridSize, setRenderScale } from "./fluid.js";

// choose a render scale that keeps the sim inside its parent
function chooseScale(w) {
    return Math.max(1, Math.min(4, Math.floor(w / gridSize)));
}

export default (p5) => {
    // sim state
    let fluid;
    let prevMouseX = -1;
    let prevMouseY = -1;
    let renderMode = 0; // 0 = density, 1 = velocity
    let t = 0;

    // pause state
    let isPaused = false;
    let button_x = 0;
    let button_y = 0;
    let button_diameter = 0;
    let pressStartedOnUI = false;

    // canvas sizing
    let canvasSize = 0;
    let renderScale = 4;

    function resizeToParent() {
        const w = p5.canvas.parentElement.clientWidth;
        renderScale = chooseScale(w);
        setRenderScale(renderScale);
        canvasSize = renderScale * gridSize;
        p5.resizeCanvas(canvasSize, canvasSize);
    }

    function drawPauseButton() {
        button_diameter = Math.max(40, Math.min(p5.width, p5.height) * 0.08);
        button_x = button_diameter * 0.6;
        button_y = p5.height - button_diameter * 0.6;

        const _p = getPointer();
        const hover = mouseOverPause(_p.x, _p.y);

        // button background
        p5.noStroke();
        if(hover) {
            p5.fill(60, 60, 60, 150);
        } else {
            p5.fill(30, 30, 30, 150);
        }
        p5.circle(button_x, button_y, button_diameter);

        // icon
        p5.fill(200);
        if (isPaused) {
            const w = button_diameter * 0.4 * 0.5;
            const h = button_diameter * 0.5 * 0.5;
            p5.triangle(
                button_x - w, button_y - h,
                button_x - w, button_y + h,
                button_x + w + (w/2), button_y
            );
        } else {
            const w = button_diameter * 0.18;
            const h = button_diameter * 0.48;
            const r = button_diameter * 0.3;
            p5.rect(button_x - w * 1.2, button_y - h / 2, w, h, r);
            p5.rect(button_x + w * 0.2, button_y - h / 2, w, h, r);
        }
    }

    function getPointer() {
        if (p5.touches && p5.touches.length > 0) {
            const t0 = p5.touches[0];
            return { x: t0.x, y: t0.y };
        }
        return { x: p5.mouseX, y: p5.mouseY };
    }

    function mouseOverPause(px, py) {
        const dx = px - button_x;
        const dy = py - button_y;
        return dx * dx + dy * dy <= (button_diameter * 0.5) ** 2;
    }

    p5.setup = () => {
        p5.createCanvas(canvasSize, canvasSize);
        p5.frameRate(22);
        fluid = new Fluid(0.2, 0, 1e-7);

        p5.canvas.style.touchAction = "none";
        ["touchstart","touchmove","touchend","touchcancel"].forEach(evType=>{
            p5.canvas.addEventListener(evType, e=>e.preventDefault(), {passive:false});
        });

        resizeToParent();
        window.addEventListener("resize", resizeToParent);
    };

    p5.draw = () => {
        p5.background("#63637a");

        // skip sim update when paused
        if (!isPaused) {
            const _ptr = getPointer();
            const inside =
                _ptr.x >= 0 && _ptr.x < p5.width &&
                _ptr.y >= 0 && _ptr.y < p5.height;

            // mouse/touch interaction
            if (inside && !pressStartedOnUI) {
                if (prevMouseX < 0) {
                    prevMouseX = _ptr.x;
                    prevMouseY = _ptr.y;
                }

                const vx = (_ptr.x - prevMouseX) * 4;
                const vy = (_ptr.y - prevMouseY) * 4;
                const gx = Math.floor(_ptr.x / renderScale);
                const gy = Math.floor(_ptr.y / renderScale);

                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        fluid.addDensity(gx + i, gy + j, p5.random(50, 250));
                        fluid.addVelocity(gx + i, gy + j, vx, vy);
                    }
                }

                prevMouseX = _ptr.x;
                prevMouseY = _ptr.y;
            } else {
                prevMouseX = prevMouseY = -1;
            }

            // continuous source on left
            const xPix = p5.width / 2;
            const yPix = p5.height * 0.5 + Math.sin(t) * p5.height * 0.4;
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
        }

        fluid.render(renderMode, p5);
        drawPauseButton();
    };

    p5.mousePressed = () => {
        const _p = getPointer();
        if(mouseOverPause(_p.x, _p.y)) {
            isPaused = !isPaused;
            pressStartedOnUI = true;
            return false;
        }
        pressStartedOnUI = false;
        return true;
    };

    p5.touchStarted = () => {
        const _p = getPointer();
        if(mouseOverPause(_p.x, _p.y)) {
            isPaused = !isPaused;
            pressStartedOnUI = true;
            return false;
        }
        pressStartedOnUI = false;
        return true;
    };

    p5.mouseReleased = () => { pressStartedOnUI = false; };
    p5.touchEnded   = () => { pressStartedOnUI = false; };
};
