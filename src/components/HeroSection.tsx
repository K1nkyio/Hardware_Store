import { ArrowRight, ShoppingBag, BookOpen, Wrench, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-end pb-0 overflow-hidden bg-foreground">
      {/* Full background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1600&h=1000&fit=crop&auto=format&q=80"
          alt="Workshop"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/85 to-foreground/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-transparent to-foreground/30" />
      </div>

      <div className="container relative z-10 pb-16 pt-32 md:pt-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Main content - takes 7 cols */}
          <div className="lg:col-span-7 space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase">
              <ShoppingBag className="h-3.5 w-3.5" />
              {t.hero.subtitle}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.9] tracking-tighter">
              <span className="text-primary-foreground block">Build</span>
              <span className="text-gradient block">Your Dreams.</span>
            </h1>

            <p className="text-base md:text-lg text-primary-foreground/45 max-w-md leading-relaxed font-light">
              {t.hero.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2 animate-fade-in [animation-delay:200ms]">
              <Button asChild size="lg" className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-base font-bold shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] transition-all duration-300">
                <Link to="/products">
                  {t.hero.shopNow} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button asChild variant="ghost" size="lg" className="rounded-full px-8 py-6 text-base text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300">
                <Link to="/projects">
                  <BookOpen className="mr-2 h-5 w-5" />
                  {t.hero.findProject}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right side - stats strip */}
          <div className="lg:col-span-5 animate-fade-in [animation-delay:400ms]">
            <div className="grid grid-cols-3 gap-px bg-primary-foreground/10 rounded-2xl overflow-hidden backdrop-blur-md border border-primary-foreground/10">
              {[
                { value: "500+", label: "Products" },
                { value: "50+", label: "Top Brands" },
                { value: "10k+", label: "Builders" },
              ].map((stat, i) => (
                <div key={i} className="bg-foreground/60 backdrop-blur-sm p-5 md:p-6 text-center">
                  <div className="text-2xl md:text-3xl font-black text-primary">{stat.value}</div>
                  <div className="text-xs text-primary-foreground/40 font-medium mt-1 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Trust row */}
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 text-primary fill-primary" />
                ))}
                <span className="text-primary-foreground/40 text-xs ml-1 font-medium">4.9/5 rating</span>
              </div>
              <div className="flex items-center gap-1 text-primary-foreground/30 text-xs">
                <Wrench className="h-3.5 w-3.5" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrolling ticker */}
        <div className="mt-12 border-t border-primary-foreground/10 pt-6 animate-fade-in [animation-delay:600ms]">
          <div className="flex items-center gap-8 overflow-hidden">
            {["DEWALT", "Bosch", "Makita", "Milwaukee", "Klein Tools", "Stanley", "3M", "Ryobi"].map((brand, i) => (
              <span key={i} className="text-primary-foreground/20 font-bold text-sm tracking-widest uppercase whitespace-nowrap">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
