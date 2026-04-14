import type { Alpine } from "alpinejs";
import { createProjectCarousel } from "./components/alpine/projectCarousel";
import type { CarouselSlide } from "./components/alpine/projectCarousel";

export default (Alpine: Alpine) => {
  Alpine.data("projectCarousel", (slides: CarouselSlide[]) =>
    createProjectCarousel(slides)
  );
};