import p5 from 'p5';
import sketch from './fluidSketch.js';

export function mount(target) {
  const instance = new p5(sketch, target);

  // pause / resume based on visibility
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) instance.loop();
        else                   instance.noLoop();
      }
    },
    { threshold: 0 }
  );

  observer.observe(target);

  return instance;
}