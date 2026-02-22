import { Star, ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/currency";

export interface ProductProps {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  brand: string;
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  discount?: number;
}

interface ProductCardProps {
  product: ProductProps;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (!product.inStock) return;
    
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  return (
    <div className="group relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/20">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <Badge className="bg-success text-success-foreground text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full">NEW</Badge>
          )}
          {product.isBestSeller && (
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full">BEST SELLER</Badge>
          )}
          {product.discount && (
            <Badge variant="destructive" className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full">-{product.discount}%</Badge>
          )}
        </div>

        {/* Quick view button */}
        <div className="absolute top-3 right-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-lg" asChild>
            <Link to={`/products/${product.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 bg-foreground/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm tracking-wider uppercase">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Category & Brand */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{product.category}</span>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{product.brand}</span>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-3.5 w-3.5 ${
                  i < Math.floor(product.rating) 
                    ? 'fill-warning text-warning' 
                    : 'text-border'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        {/* Price + Action */}
        <div className="flex items-end justify-between pt-1 border-t border-border/50">
          <div>
            <div className="text-xl font-black text-primary leading-none">
              {formatCurrency(product.price).usd}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {formatCurrency(product.price).ksh}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-muted-foreground line-through mt-0.5">
                {formatCurrency(product.originalPrice).usd}
              </div>
            )}
          </div>
          
          <Button 
            size="sm"
            className="rounded-full px-4 h-9 font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
            disabled={!product.inStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            {t.products.filters.addToCart}
          </Button>
        </div>
      </div>
    </div>
  );
}
