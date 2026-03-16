import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ResponsiveImage from "@/components/common/ResponsiveImage";
import { Card, CardContent } from "@/components/ui/card";
import { homeShowcase } from "@/lib/homeImages";

const showcaseItems = [
  {
    title: "Toolkits & Everyday Essentials",
    subtitle: "Reliable picks for daily jobs",
    to: "/category/shop?q=tool",
    image: homeShowcase.toolkit,
  },
  {
    title: "Maintenance Supplies",
    subtitle: "Keep homes and sites running",
    to: "/category/shop?q=maintenance",
    image: homeShowcase.maintenance,
  },
  {
    title: "Plumbing Fittings",
    subtitle: "Built for pressure and durability",
    to: "/category/shop?q=fittings",
    image: homeShowcase.fittings,
  },
];

const HomeImageShowcase = () => {
  return (
    <section className="home-reveal home-delay-3 w-full px-4 sm:px-6 pb-16">
      <div className="mx-auto max-w-[1460px]">
        <div className="mb-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">In Focus</p>
          <h2 className="mt-2 text-2xl font-normal leading-tight text-foreground sm:text-3xl md:text-4xl">
            Visual picks from top categories
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Handpicked visuals from fast-moving sections to help you discover products quickly.
          </p>
          <Link
            to="/category/shop"
            className="inline-flex items-center gap-1 text-sm text-foreground hover:text-foreground/70"
          >
            Explore categories
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {showcaseItems.map((item, index) => (
            <Link
              key={item.title}
              to={item.to}
              className="block"
            >
              <Card
                className="home-card-rise group h-full border-none bg-transparent shadow-none"
                style={{ animationDelay: `${160 + index * 70}ms` }}
              >
                <CardContent className="p-0">
                  <div className="relative mb-3 aspect-square overflow-hidden bg-muted">
                    <ResponsiveImage
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 33vw, 48vw"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-light text-foreground">{item.subtitle}</p>
                    <h3 className="min-h-[2.4rem] text-sm font-medium text-foreground">{item.title}</h3>
                    <span className="inline-flex items-center gap-1 text-xs text-foreground">
                      Explore
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeImageShowcase;
