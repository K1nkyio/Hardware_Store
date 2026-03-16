import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { editorial, largeHero, oneThirdTwoThirds } from "@/lib/homeImages";

const HERO_SLIDES = [
  {
    image: largeHero,
    eyebrow: "Built for Real Projects",
    title: "Hardware, plumbing, and electrical supplies delivered fast.",
    description: "Source quality materials for urgent repairs and planned upgrades in one checkout.",
  },
  {
    image: oneThirdTwoThirds.construction,
    eyebrow: "Construction Ready",
    title: "Reliable stock for site work and daily procurement.",
    description: "Access essential building materials and practical tools that keep projects moving.",
  },
  {
    image: editorial,
    eyebrow: "Trusted by Professionals",
    title: "One supplier for maintenance, repair, and installations.",
    description: "Simplify sourcing with a catalog built for contractors, technicians, and homeowners.",
  },
];

const HomeHero = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    // Preload only the next slide to reduce memory/paint pressure.
    const nextSlide = HERO_SLIDES[(activeSlide + 1) % HERO_SLIDES.length];
    const image = new Image();
    image.src = nextSlide.image;
    image.decoding = "async";
  }, [activeSlide]);

  const currentSlide = HERO_SLIDES[activeSlide];
  const priorityProps = {
    fetchpriority: activeSlide === 0 ? "high" : "auto",
  } as ImgHTMLAttributes<HTMLImageElement> & { fetchpriority?: "auto" | "high" | "low" };

  return (
    <section className="home-reveal w-full px-4 sm:px-6 pb-10">
      <div className="mx-auto max-w-[1460px]">
        <div
          className="relative overflow-hidden bg-muted min-h-[620px] sm:min-h-[660px] md:min-h-[700px] lg:min-h-[740px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="absolute inset-0">
            <img
              key={currentSlide.image}
              src={currentSlide.image}
              alt={currentSlide.title}
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover"
              {...priorityProps}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_45%)]" />

          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 md:bottom-6 md:right-6">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={`${slide.eyebrow}-${index}`}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeSlide ? "w-8 bg-white" : "w-2.5 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
