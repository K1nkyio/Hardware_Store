import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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
    <Link to={href} className="group block relative rounded-2xl overflow-hidden bg-card border border-border transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/30 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        
        {/* Icon badge */}
        <div className="absolute top-4 right-4 p-2.5 rounded-xl bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 -mt-8 relative">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">{name}</h3>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{productCount}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>
        <div className="flex items-center text-sm font-semibold text-primary opacity-0 translate-x-[-8px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          Browse Collection <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
