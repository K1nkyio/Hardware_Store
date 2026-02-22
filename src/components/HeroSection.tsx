import { ArrowRight, ShoppingBag, BookOpen, Wrench, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SearchBar from "./SearchBar";

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-foreground">
      {/* Diagonal accent */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[80%] h-[200%] bg-primary/10 rotate-12 origin-center" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[60%] h-[200%] bg-primary/5 -rotate-12 origin-center" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, white 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, white 0px, transparent 1px, transparent 60px)'
      }} />

      <div className="container relative z-10 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold tracking-wide uppercase">
              <ShoppingBag className="h-4 w-4" />
              {t.hero.subtitle}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[0.95] tracking-tight">
              <span className="text-primary-foreground">Build Your</span>
              <br />
              <span className="text-gradient">Dreams</span>
              <br />
              <span className="text-primary-foreground/60 text-3xl md:text-4xl lg:text-5xl font-bold">with Confidence</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/50 max-w-lg leading-relaxed">
              {t.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in [animation-delay:200ms]">
              <Button asChild size="lg" className="btn-primary text-base px-8 py-6 rounded-xl text-lg font-bold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all">
                <Link to="/products">
                  {t.hero.shopNow} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl text-lg border-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:border-primary-foreground/40 transition-all">
                <Link to="/projects">
                  <BookOpen className="mr-2 h-5 w-5" />
                  {t.hero.findProject}
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 pt-4 animate-fade-in [animation-delay:400ms]">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-primary fill-primary" />
                  ))}
                </div>
                <span className="text-primary-foreground/50 text-sm font-medium">4.9/5</span>
              </div>
              <div className="h-4 w-px bg-primary-foreground/20" />
              <span className="text-primary-foreground/50 text-sm">10,000+ Happy Builders</span>
            </div>
          </div>

          {/* Right - Image composition */}
          <div className="relative animate-fade-in [animation-delay:300ms]">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
              <img
                src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=1000&fit=crop&auto=format&q=80"
                alt="Professional craftsman at work"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />

              {/* Overlay stats card */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-card/95 backdrop-blur-md rounded-2xl p-5 border border-border/50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-extrabold text-primary">500+</div>
                      <div className="text-xs text-muted-foreground font-medium">Products</div>
                    </div>
                    <div className="border-x border-border">
                      <div className="text-2xl font-extrabold text-primary">50+</div>
                      <div className="text-xs text-muted-foreground font-medium">Brands</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-primary">24/7</div>
                      <div className="text-xs text-muted-foreground font-medium">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating accent element */}
            <div className="absolute -top-4 -left-4 w-24 h-24 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center animate-float">
              <Wrench className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>

        {/* Search bar below */}
        <div className="mt-16 animate-fade-in [animation-delay:500ms]">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
