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
    <div className="tool-card group">
      <div className="relative mb-4">
        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-success text-success-foreground">NEW</Badge>
          )}
          {product.isBestSeller && (
            <Badge className="bg-primary text-primary-foreground">BEST SELLER</Badge>
          )}
          {product.discount && (
            <Badge variant="destructive">-{product.discount}%</Badge>
          )}
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Category & Brand */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{product.category}</span>
          <span className="text-primary font-medium">{product.brand}</span>
        </div>

        {/* Product Name */}
        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating) 
                    ? 'fill-warning text-warning' 
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">
              {formatCurrency(product.price).usd}
            </span>
            <span className="text-sm text-muted-foreground">
              / {formatCurrency(product.price).ksh}
            </span>
          </div>
          {product.originalPrice && (
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.originalPrice).usd}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                / {formatCurrency(product.originalPrice).ksh}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1" 
            disabled={!product.inStock}
            size="sm"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t.products.filters.addToCart}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/products/${product.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}