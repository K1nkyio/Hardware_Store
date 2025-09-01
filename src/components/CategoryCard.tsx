import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <Link to={href} className="project-card block">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 category-gradient opacity-90" />
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="absolute top-4 left-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
          <p className="text-white/90 text-sm mb-3 line-clamp-2">{description}</p>
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">{productCount} products</span>
            <Button size="sm" variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
              Browse
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}