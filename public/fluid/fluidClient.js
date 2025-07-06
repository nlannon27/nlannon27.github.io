import p5 from "https://cdn.jsdelivr.net/npm/p5@1.6.0/+esm";
import sketch from "./fluidSketch.js";

export function mount(target) {
  const instance = new p5(sketch, target);

  // pause / resume based on visibility
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) 
          instance.loop();
        else
          instance.noLoop();
      }
    },
    { threshold: 0 }
  );

  observer.observe(target);

  return instance;
}

mount("fluid-root")