import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { formatProductPrice, getProducts, type Product } from "@/lib/api";
import { calculateTotalWithTaxCents, DEFAULT_DELIVERY_ESTIMATE, formatTaxRate } from "@/lib/pricing";
import Pagination from "./Pagination";
import ResponsiveImage from "@/components/common/ResponsiveImage";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { productPath } from "@/lib/urls";
import { trackEvent } from "@/lib/analytics";
import { Heart, Scale } from "lucide-react";
import { useWishlist } from "@/context/wishlist";
import { useCompare } from "@/context/compare";
import { useQuery } from "@tanstack/react-query";

type ProductFilters = {
  q?: string;
  productType?: string;
  compatibility?: string;
  pickupCity?: string;
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

const emptyStateCollections = [
  { label: "New arrivals", href: "/category/shop?sort=newest" },
  { label: "Trade-ready electrical", href: "/category/electrical-lighting" },
  { label: "Fast pickup items", href: "/category/shop?pickupCity=Nairobi" },
];

const ProductGrid = ({ category, filters, sortBy, onCountChange }: ProductGridProps) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useCompare();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products-grid", category, filters, sortBy],
    queryFn: () =>
      getProducts({
        status: "active",
        category,
        brand: filters?.productType || undefined,
        compatibility: filters?.compatibility || undefined,
        pickupCity: filters?.pickupCity || undefined,
        inStock: filters?.availability === "in-stock" ? true : filters?.availability === "out-of-stock" ? false : undefined,
        q: filters?.q || undefined,
        sort: sortBy,
        priceMin: filters?.priceMin,
        priceMax: filters?.priceMax,
      }),
  });

  useEffect(() => {
    onCountChange?.(products.length);
  }, [onCountChange, products.length]);

  useEffect(() => {
    const q = (filters?.q ?? "").trim();
    if (!q || isLoading || products.length > 0) return;
    trackEvent("search_no_results", {
      query: q,
      category: category ?? "all",
      filters: {
        productType: filters?.productType ?? "",
        compatibility: filters?.compatibility ?? "",
        pickupCity: filters?.pickupCity ?? "",
        availability: filters?.availability ?? "any",
      },
    });
  }, [category, filters?.availability, filters?.compatibility, filters?.pickupCity, filters?.productType, filters?.q, isLoading, products.length]);

  if (isLoading) {
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

  if (products.length === 0) {
    return (
      <section className="w-full px-4 sm:px-6 mb-16">
        <div className="grid gap-6 border border-dashed border-border p-6 sm:grid-cols-[1.2fr,0.8fr] sm:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">No exact matches</p>
            <h2 className="text-2xl font-light text-foreground">Adjust the filters or explore high-intent hardware collections</h2>
            <p className="text-sm text-muted-foreground">
              Try broader keywords, remove the compatibility constraint, or switch pickup city to see more branch stock.
            </p>
          </div>
          <div className="space-y-3">
            {emptyStateCollections.map((collection) => (
              <Link key={collection.href} to={collection.href} className="block border border-border px-4 py-4 text-sm text-foreground transition-colors hover:border-foreground">
                {collection.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 sm:px-6 mb-16">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
        {products.map((product) => {
          const stockLabel =
            product.stock <= 0
              ? "Out of stock"
              : product.stock <= LOW_STOCK_THRESHOLD
                ? "Low stock"
                : product.pickupLocations?.length
                  ? `Pickup in ${product.pickupLocations[0].city}`
                  : "In stock";

          return (
            <Card key={product.id} className="border-none shadow-none bg-transparent group">
              <CardContent className="p-0">
                <div className="relative mb-2.5 aspect-square overflow-hidden bg-muted sm:mb-3">
                  <Link to={productPath(product.id, product.name)} className="block h-full">
                    <ResponsiveImage
                      src={product.imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 30vw, 45vw"
                    />
                  </Link>
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {(product.badges ?? []).map((badge) => (
                      <span key={badge} className="bg-background/90 px-2 py-1 text-[11px] uppercase tracking-wide text-foreground">
                        {badge}
                      </span>
                    ))}
                  </div>
                  <div className="absolute right-2 top-2 flex flex-col gap-2">
                    <button
                      className="flex h-9 w-9 items-center justify-center bg-background/90 text-foreground"
                      aria-label="Save to favorites"
                      onClick={() => void toggleWishlist(product)}
                    >
                      <Heart className={`h-4 w-4 ${isWishlisted(product.id) ? "fill-current" : ""}`} />
                    </button>
                    <button
                      className="flex h-9 w-9 items-center justify-center bg-background/90 text-foreground"
                      aria-label="Compare product"
                      onClick={() => toggleCompare(product)}
                    >
                      <Scale className={`h-4 w-4 ${isCompared(product.id) ? "stroke-[2.5]" : ""}`} />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-background/85 px-2 py-1 text-[11px] font-medium text-foreground">
                    {stockLabel}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-light uppercase tracking-wide text-muted-foreground sm:text-sm">{product.category}</p>
                      <Link to={productPath(product.id, product.name)} className="line-clamp-2 text-sm font-medium text-foreground hover:underline">
                        {product.name}
                      </Link>
                    </div>
                    <p className="shrink-0 text-sm font-light text-foreground">
                      {formatProductPrice({
                        priceCents: calculateTotalWithTaxCents(product.priceCents),
                        currency: product.currency,
                      })}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    {product.sku || "Project-ready supply"} • Incl. VAT ({formatTaxRate()}) • {DEFAULT_DELIVERY_ESTIMATE}
                  </p>
                  {product.bulkPricing && product.bulkPricing.length > 0 && (
                    <p className="text-[11px] text-emerald-700 sm:text-xs">
                      Bulk pricing from {product.bulkPricing[0].minQuantity}+ units
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Pagination />
    </section>
  );
};

export default ProductGrid;
