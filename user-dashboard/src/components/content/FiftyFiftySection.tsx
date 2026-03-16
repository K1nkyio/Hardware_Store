import { Link } from "react-router-dom";
import ResponsiveImage from "@/components/common/ResponsiveImage";
import { fiftyFifty } from "@/lib/homeImages";

const FiftyFiftySection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Link to="/category/electrical-lighting" className="block group">
            <div className="w-full aspect-square mb-3 overflow-hidden bg-muted">
              <ResponsiveImage
                src={fiftyFifty.electrical}
                alt="Hand tools and bits"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 1024px) 30vw, 45vw"
                loading="eager"
              />
            </div>
          </Link>
          <div>
            <h3 className="text-sm font-normal text-foreground mb-1">
              Electrical & Lighting
            </h3>
            <p className="text-sm font-light text-foreground">
              Wires, switches, lighting fixtures and electrical components
            </p>
          </div>
        </div>

        <div>
          <Link to="/category/safety-equipment" className="block group">
            <div className="w-full aspect-square mb-3 overflow-hidden bg-muted">
              <ResponsiveImage
                src={fiftyFifty.safety}
                alt="Safety helmet and power tools"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 1024px) 30vw, 45vw"
              />
            </div>
          </Link>
          <div>
            <h3 className="text-sm font-normal text-foreground mb-1">
              Safety Equipment
            </h3>
            <p className="text-sm font-light text-foreground">
              Protective gear, helmets, gloves and safety supplies
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FiftyFiftySection;
