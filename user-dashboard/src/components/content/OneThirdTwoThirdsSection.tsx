import { Link } from "react-router-dom";
import ResponsiveImage from "@/components/common/ResponsiveImage";
import { oneThirdTwoThirds } from "@/lib/homeImages";

const OneThirdTwoThirdsSection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Link to="/category/paints" className="block group">
            <div className="w-full h-[520px] md:h-[800px] mb-3 overflow-hidden bg-muted">
              <ResponsiveImage
                src={oneThirdTwoThirds.paints}
                alt="Paint brush and drill on a workbench"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 1024px) 30vw, 100vw"
              />
            </div>
          </Link>
          <div>
            <h3 className="text-sm font-normal text-foreground mb-1">
              Paints & Coatings
            </h3>
            <p className="text-sm font-light text-foreground">
              Premium paints, primers, and coatings for all surfaces
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Link to="/category/building-construction-materials" className="block group">
            <div className="w-full h-[520px] md:h-[800px] mb-3 overflow-hidden bg-muted">
              <ResponsiveImage
                src={oneThirdTwoThirds.construction}
                alt="Stacked steel pipes"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            </div>
          </Link>
          <div>
            <h3 className="text-sm font-normal text-foreground mb-1">
              Building & Construction Materials
            </h3>
            <p className="text-sm font-light text-foreground">
              Cement, steel, lumber, and essential construction supplies
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OneThirdTwoThirdsSection;
