import { LucideIcon, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  image: string;
  productCount: number;
  href: string;
}

export default function CategoryCard({ name, description, icon: Icon, image, productCount, href }: CategoryCardProps) {
  return (
    <Link to={href} className="group block relative rounded-2xl overflow-hidden aspect-[4/3] bg-foreground">
      {/* Background image */}
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500" />
      
      {/* Product count chip */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-primary/30">
          {productCount} items
        </div>
      </div>

      {/* Content - bottom aligned */}
      <div className="absolute inset-x-0 bottom-0 p-5 z-10">
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/30">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary-foreground truncate">{name}</h3>
            </div>
            <p className="text-xs text-primary-foreground/50 line-clamp-1">{description}</p>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-primary/40">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
