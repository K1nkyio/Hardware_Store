import ResponsiveImage from "@/components/common/ResponsiveImage";
import { largeHero } from "@/lib/homeImages";

const LargeHero = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="w-full aspect-[16/9] mb-3 overflow-hidden bg-muted">
        <ResponsiveImage
          src={largeHero}
          alt="Plumbing tools and fittings"
          className="w-full h-full object-cover"
          sizes="(min-width: 1024px) 80vw, 100vw"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <div>
        <h2 className="text-sm font-normal text-foreground mb-1">
          Built to Last
        </h2>
        <p className="text-sm font-light text-foreground">
          Professional-grade plumbing supplies for every project
        </p>
      </div>
    </section>
  );
};

export default LargeHero;
