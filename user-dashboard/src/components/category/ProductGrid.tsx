import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatProductPrice, getProducts, Product } from "@/lib/api";
import { calculateTotalWithTaxCents, DEFAULT_DELIVERY_ESTIMATE, formatTaxRate } from "@/lib/pricing";
import Pagination from "./Pagination";
import ResponsiveImage from "@/components/common/ResponsiveImage";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { productPath } from "@/lib/urls";
import { trackEvent } from "@/lib/analytics";

type ProductFilters = {
  q?: string;
  productType?: string;
  availability?: "any" | "in-stock" | "out-of-stock";
  priceMin?: string;
  priceMax?: string;
};

interface ProductGridProps {
  category?: string;
  filters?: ProductFilters;
  sortBy?: string;
  onCountChange?: (count: number) => void;
}

const ProductGrid = ({ category, filters, sortBy, onCountChange }: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const availability = filters?.availability ?? "any";
        const data = await getProducts({
          status: "active",
          category,
          inStock: availability === "in-stock" ? true : undefined,
          q: filters?.q,
        });
        const normalizedType = (filters?.productType ?? "").trim().toLowerCase();
        const minPrice = filters?.priceMin ? Number(filters.priceMin) : undefined;
        const maxPrice = filters?.priceMax ? Number(filters.priceMax) : undefined;

        const filtered = data.filter((product) => {
          if (availability === "out-of-stock" && product.stock > 0) return false;
          if (availability === "in-stock" && product.stock <= 0) return false;
          if (normalizedType && !product.category.toLowerCase().includes(normalizedType)) return false;
          if (typeof minPrice === "number" && !Number.isNaN(minPrice) && product.priceCents < minPrice * 100) {
            return false;
          }
          if (typeof maxPrice === "number" && !Number.isNaN(maxPrice) && product.priceCents > maxPrice * 100) {
            return false;
          }
          return true;
        });

        const sorted = [...filtered];
        switch (sortBy) {
          case "price-low":
            sorted.sort((a, b) => a.priceCents - b.priceCents);
            break;
          case "price-high":
            sorted.sort((a, b) => b.priceCents - a.priceCents);
            break;
          case "name":
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "newest":
            sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          default:
            break;
        }
        setProducts(sorted);
        onCountChange?.(sorted.length);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [
    category,
    filters?.availability,
    filters?.priceMax,
    filters?.priceMin,
    filters?.productType,
    filters?.q,
    sortBy,
    onCountChange,
  ]);

  useEffect(() => {
    const q = (filters?.q ?? "").trim();
    if (!q || loading) return;
    if (products.length > 0) return;
    trackEvent("search_no_results", {
      query: q,
      category: category ?? "all",
      filters: {
        productType: filters?.productType ?? "",
        availability: filters?.availability ?? "any",
        priceMin: filters?.priceMin ?? "",
        priceMax: filters?.priceMax ?? "",
      },
    });
  }, [category, filters?.availability, filters?.priceMax, filters?.priceMin, filters?.productType, filters?.q, loading, products.length]);

  if (loading) {
    return (
      <section className="w-full px-4 sm:px-6 mb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 sm:px-6 mb-16">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
        {products.map((product) => (
          <Link key={product.id} to={productPath(product.id, product.name)}>
            <Card className="border-none shadow-none bg-transparent group cursor-pointer">
              <CardContent className="p-0">
                <div className="relative mb-2.5 aspect-square overflow-hidden bg-muted sm:mb-3 flex items-center justify-center">
                  <ResponsiveImage
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    sizes="(min-width: 1024px) 20vw, (min-width: 768px) 30vw, 45vw"
                  />
                  {product.status === "active" && (
                    <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium text-foreground">
                      NEW
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 text-[11px] font-medium bg-background/80 text-foreground">
                    {product.stock <= 0
                      ? "Out of stock"
                      : product.stock <= LOW_STOCK_THRESHOLD
                      ? "Low stock"
                      : "In stock"}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-light text-foreground sm:text-sm">{product.category}</p>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="line-clamp-2 text-sm font-medium text-foreground sm:line-clamp-1">{product.name}</h3>
                    <p className="shrink-0 text-sm font-light text-foreground">
                      {formatProductPrice({
                        priceCents: calculateTotalWithTaxCents(product.priceCents),
                        currency: product.currency,
                      })}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    Incl. VAT ({formatTaxRate()}) • {DEFAULT_DELIVERY_ESTIMATE}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Pagination />
    </section>
  );
};

export default ProductGrid;
