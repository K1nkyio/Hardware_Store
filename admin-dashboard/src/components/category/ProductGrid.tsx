import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Pagination from "./Pagination";
import { formatProductPrice, Product } from "@/lib/products";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
}

const ProductGrid = ({ products, isLoading, isError }: ProductGridProps) => {
  return (
    <section className="w-full px-6 mb-16">
      {isLoading ? (
        <div className="py-16 text-center text-sm font-light text-muted-foreground">
          Loading products...
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-sm font-light text-destructive">
          Could not load products right now.
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-sm font-light text-muted-foreground">
          No products yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <Card className="border-none shadow-none bg-transparent group cursor-pointer">
                <CardContent className="p-0">
                  <div className="aspect-square mb-3 overflow-hidden bg-muted relative flex items-center justify-center">
                    <img
                      src={product.imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-light text-foreground">{product.category || "Uncategorized"}</p>
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2">{product.name}</h3>
                      <p className="text-sm font-light text-foreground whitespace-nowrap">{formatProductPrice(product)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Pagination />
    </section>
  );
};

export default ProductGrid;
