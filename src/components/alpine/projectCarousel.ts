type CarouselContext = {
    $el: HTMLElement;
    $nextTick: (callback: () => void) => void;
};

type ProjectCarouselData = {
    slides: CarouselSlide[];
    currentSlideIndex: number;
    hasStartedAutoplay: boolean;
    frameAspectRatio: number;
    isPaused: boolean;
    autoplayTimeout: ReturnType<typeof setTimeout> | null;

    currentSlide(): CarouselSlide | undefined;
    clearAutoplay(): void;
    previous(): void;
    next(): void;
    playVideoFromStart(video: HTMLVideoElement): Promise<void>;
    restartCurrentMedia(): void;
    scheduleNextAdvance(): void;
    calculateAspectRatio(): Promise<void>;
    startAutoplayWhenVisible(): void;
    init(): Promise<void>;
};

export type CarouselSlide = {
    src: string;
    alt: string;
    type: "image" | "video";
};

export function createProjectCarousel(slides: CarouselSlide[]) {
    const data: ProjectCarouselData & ThisType<ProjectCarouselData & CarouselContext> = {
        slides,
        currentSlideIndex: 1,
        hasStartedAutoplay: false,
        frameAspectRatio: 16 / 9,
        isPaused: false,
        autoplayTimeout: null,

        currentSlide() {
            return this.slides[this.currentSlideIndex - 1];
        },

        clearAutoplay() {
            if (this.autoplayTimeout) {
                clearTimeout(this.autoplayTimeout);
                this.autoplayTimeout = null;
            }
        },

        previous() {
            this.currentSlideIndex =
                this.currentSlideIndex > 1 ? this.currentSlideIndex - 1 : this.slides.length;
            this.restartCurrentMedia();
            this.scheduleNextAdvance();
        },

        next() {
            this.currentSlideIndex =
                this.currentSlideIndex < this.slides.length ? this.currentSlideIndex + 1 : 1;
            this.restartCurrentMedia();
            this.scheduleNextAdvance();
        },

        async playVideoFromStart(video: HTMLVideoElement) {
            video.pause();
            video.currentTime = 0;
            video.muted = true;
            video.playsInline = true;
            video.preload = "auto";

            if (video.readyState < 2) {
                video.load();
                await new Promise<void>((resolve) => {
                    const onReady = () => resolve();
                    video.addEventListener("loadeddata", onReady, { once: true });
                    video.addEventListener("canplay", onReady, { once: true });
                });
            }

            await video.play();
        },

        restartCurrentMedia() {
            this.$nextTick(() => {
                const slide = this.currentSlide();
                if (!slide || slide.type !== "video") return;

                const video = this.$el.querySelector(
                    `[data-slide-video="${this.currentSlideIndex}"]`
                ) as HTMLVideoElement | null;

                if (!video) return;
                void this.playVideoFromStart(video);
            });
        },

        scheduleNextAdvance() {
            this.clearAutoplay();
            if (this.isPaused) return;

            const slide = this.currentSlide();
            if (!slide) return;

            if (slide.type === "video") {
                this.$nextTick(() => {
                    const video = this.$el.querySelector(
                        `[data-slide-video="${this.currentSlideIndex}"]`
                    ) as HTMLVideoElement | null;

                    if (!video) return;
                    void this.playVideoFromStart(video);

                    const onEnded = () => {
                        video.removeEventListener("ended", onEnded);
                        if (!this.isPaused) this.next();
                    };

                    video.addEventListener("ended", onEnded, { once: true });
                });
            } else {
                this.autoplayTimeout = setTimeout(() => {
                    if (!this.isPaused) this.next();
                }, 4000);
            }
        },

        async calculateAspectRatio() {
            const loadRatio = (src: string, type: "image" | "video") =>
                new Promise<number | null>((resolve) => {
                    if (type === "video") {
                        const video = document.createElement("video");
                        video.preload = "metadata";
                        video.onloadedmetadata = () => resolve(video.videoWidth / video.videoHeight);
                        video.onerror = () => resolve(null);
                        video.src = src;
                        return;
                    }

                    const img = new Image();
                    img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
                    img.onerror = () => resolve(null);
                    img.src = src;
                });

            const ratios = (
                await Promise.all(this.slides.map((slide) => loadRatio(slide.src, slide.type)))
            )
                .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
                .sort((a, b) => a - b);

            if (!ratios.length) return;

            const mid = Math.floor(ratios.length / 2);
            let ratio =
                ratios.length % 2 === 0
                    ? (ratios[mid - 1] + ratios[mid]) / 2
                    : ratios[mid];

            ratio = Math.max(0.85, Math.min(ratio, 1.9));
            this.frameAspectRatio = ratio;
        },

        startAutoplayWhenVisible() {
            const observer = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];
                    if (!entry.isIntersecting || this.hasStartedAutoplay) return;

                    this.hasStartedAutoplay = true;
                    this.restartCurrentMedia();
                    this.scheduleNextAdvance();
                    observer.disconnect();
                },
                { threshold: 0.4 }
            );

            observer.observe(this.$el);
        },

        async init() {
            await this.calculateAspectRatio();
            this.startAutoplayWhenVisible();
        },
    };

    return data;
}