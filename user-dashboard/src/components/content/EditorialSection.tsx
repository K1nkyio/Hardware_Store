import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { aboutRaph } from "@/lib/homeImages";

const EditorialSection = () => {
  return (
    <section className="home-reveal home-delay-5 w-full px-4 sm:px-6 pb-16">
      <div className="mx-auto max-w-[1460px]">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="max-w-[680px] space-y-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">About Raph Supply</p>
            <h2 className="text-3xl font-normal leading-tight text-foreground md:text-4xl">
              Built for trade teams, ready for everyday projects
            </h2>
            <p className="text-base font-light leading-relaxed text-foreground">
              Raph Supply exists to make dependable hardware easier to source. We stock essential categories for
              electrical work, plumbing, site safety, finishing, cleaning, and building maintenance so contractors,
              technicians, and homeowners can buy with confidence from one trusted storefront.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <Link to="/about/our-story" className="inline-flex items-center gap-1 text-sm font-light text-foreground hover:text-foreground/80 transition-colors duration-200">
                <span>Read our full story</span>
                <ArrowRight size={12} />
              </Link>
              <Link to="/about/store-locator" className="inline-flex items-center gap-1 text-sm font-light text-foreground hover:text-foreground/80 transition-colors duration-200">
                <span>Find a store</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <div className="order-last md:order-last">
            <div className="home-card-rise mx-auto w-full max-w-[560px] aspect-[4/5] overflow-hidden bg-muted sm:aspect-[5/4] md:max-w-none md:aspect-square">
              <img
                src={aboutRaph}
                alt="Raph Supply team and hardware trade workspace"
                className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialSection;
