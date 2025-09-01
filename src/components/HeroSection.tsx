import { ArrowRight, ShoppingBag, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SearchBar from "./SearchBar";

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      <div className="container relative z-10 text-center px-4">
        <div className="max-w-4xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
            <ShoppingBag className="h-4 w-4" />
            {t.hero.subtitle}
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in [animation-delay:100ms]">
            <span className="text-gradient">Build Your Dreams</span>
            <br />
            <span className="text-foreground">with Confidence</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
            {t.hero.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in [animation-delay:300ms]">
            <Button asChild size="lg" className="btn-primary text-lg px-8 py-6">
              <Link to="/products">
                {t.hero.shopNow} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 bg-background/50 backdrop-blur-sm">
              <Link to="/projects">
                <BookOpen className="mr-2 h-5 w-5" />
                {t.hero.findProject}
              </Link>
            </Button>
          </div>
        </div>

        <div className="animate-fade-in [animation-delay:400ms]">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}