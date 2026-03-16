import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ResponsiveImage from "@/components/common/ResponsiveImage";
import { editorial, fiftyFifty, largeHero, oneThirdTwoThirds } from "@/lib/homeImages";

type CategoryCard = {
  title: string;
  description: string;
  to: string;
  image: string;
  badge: string;
  layoutClass: string;
};

const categories: CategoryCard[] = [
  {
    title: "Plumbing Essentials",
    description: "Pipes, fittings, valves, sealants, and repair kits for residential and commercial jobs.",
    to: "/category/shop?q=plumbing",
    image: largeHero,
    badge: "Most Ordered",
    layoutClass: "md:col-span-2 xl:col-span-4 xl:row-span-2",
  },
  {
    title: "Building & Construction Materials",
    description: "Cement, steel, and structural supplies for reliable site execution.",
    to: "/category/building-construction-materials",
    image: oneThirdTwoThirds.construction,
    badge: "Project Scale",
    layoutClass: "xl:col-span-2",
  },
  {
    title: "Electrical & Lighting",
    description: "Wiring, switches, and fittings for safe, efficient power setups.",
    to: "/category/electrical-lighting",
    image: fiftyFifty.electrical,
    badge: "High Demand",
    layoutClass: "xl:col-span-2",
  },
  {
    title: "Safety Equipment",
    description: "Protective gear and site safety essentials for daily operations.",
    to: "/category/safety-equipment",
    image: fiftyFifty.safety,
    badge: "PPE",
    layoutClass: "xl:col-span-2",
  },
  {
    title: "Paints & Coatings",
    description: "Interior, exterior, and specialty coatings for durable finishes.",
    to: "/category/paints",
    image: oneThirdTwoThirds.paints,
    badge: "Top Rated",
    layoutClass: "xl:col-span-2",
  },
  {
    title: "Cleaning & Maintenance",
    description: "Cleaning agents, tools, and consumables for routine facility upkeep.",
    to: "/category/shop?q=maintenance",
    image: editorial,
    badge: "Facility Care",
    layoutClass: "md:col-span-2 xl:col-span-2",
  },
];

const CategoryGridSection = () => {
  return (
    <section className="home-reveal home-delay-2 w-full px-4 sm:px-6 pb-16">
      <div className="mx-auto max-w-[1460px]">
        <div className="mb-7 space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shop by Category</p>
          <h2 className="mt-2 text-2xl font-normal leading-tight text-foreground sm:text-3xl md:text-4xl">
            Start with the section you need
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Browse the most used hardware categories and jump directly into products for your current task.
          </p>
          <Link
            to="/category/shop"
            className="inline-flex items-center gap-1 text-sm text-foreground hover:text-foreground/70"
          >
            View all products
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:auto-rows-[220px] xl:grid-cols-6">
          {categories.map((category, index) => (
            <Link
              key={category.title}
              to={category.to}
              className={`home-card-rise group relative block overflow-hidden bg-muted ${category.layoutClass} ${
                index === 0
                  ? "aspect-[4/3] md:aspect-[16/10] xl:h-full xl:aspect-auto xl:min-h-[460px]"
                  : "aspect-[4/3] md:aspect-[16/10] xl:h-full xl:aspect-auto xl:min-h-[220px]"
              }`}
              style={{ animationDelay: `${120 + index * 70}ms` }}
            >
              <ResponsiveImage
                src={category.image}
                alt={category.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(min-width: 1280px) 24vw, (min-width: 640px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
              <div className="relative z-10 flex h-full flex-col justify-end p-5 md:p-6">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/75">{category.badge}</p>
                <h3 className="mt-1 text-xl font-normal leading-tight text-white md:text-2xl">{category.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">{category.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm text-white">
                  Explore category
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGridSection;
