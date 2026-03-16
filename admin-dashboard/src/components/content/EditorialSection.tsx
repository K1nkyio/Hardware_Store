import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const EditorialSection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4 max-w-[630px]">
          <h2 className="text-2xl font-normal text-foreground leading-tight md:text-xl">
            Built on Trust, Backed by Quality
          </h2>
          <p className="text-sm font-light text-foreground leading-relaxed">
            Raph Plumbing Supply was founded with a simple mission: to be the most reliable plumbing partner for
            contractors, builders, and homeowners across the Philippines. We stock only the brands we trust,
            offer competitive prices, and deliver with the speed your projects demand.
          </p>
          <Link to="/about/our-story" className="inline-flex items-center gap-1 text-sm font-light text-foreground hover:text-foreground/80 transition-colors duration-200">
            <span>Learn more about us</span>
            <ArrowRight size={12} />
          </Link>
        </div>
        
        <div className="order-first md:order-last">
          <div className="w-full aspect-square overflow-hidden bg-muted flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🏗️</div>
              <p className="text-lg font-light text-muted-foreground">Since 2010</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialSection;
