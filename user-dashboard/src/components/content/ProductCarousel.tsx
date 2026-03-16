import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { formatProductPrice, getProducts, Product } from "@/lib/api";
import { placeholder } from "@/lib/homeImages";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { calculateTotalWithTaxCents, DEFAULT_DELIVERY_ESTIMATE, formatTaxRate } from "@/lib/pricing";
import { productPath } from "@/lib/urls";
import ResponsiveImage from "@/components/common/ResponsiveImage";

const ProductCarousel = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts({ status: "active" });
        setProducts(data.slice(0, 6));
      } catch (loadError) {
        console.error("Failed to load products:", loadError);
        setError("Unable to load featured products right now.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const renderProductCard = (product: Product, index: number) => (
    <Link to={productPath(product.id, product.name)} className="block">
      <Card className="group h-full border-none bg-transparent shadow-none">
        <CardContent className="p-0">
          <div className="relative mb-3 aspect-square overflow-hidden bg-muted">
            <ResponsiveImage
              src={product.imageUrl || placeholder}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 18vw, (min-width: 768px) 28vw, 90vw"
            />
            <div className="absolute bottom-2 left-2 bg-background/85 px-2 py-1 text-[11px] font-medium text-foreground">
              {product.stock <= 0
                ? "Out of stock"
                : product.stock <= LOW_STOCK_THRESHOLD
                ? "Low stock"
                : "In stock"}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-light text-foreground sm:text-sm">{product.category}</p>
            <div className="flex items-center justify-between gap-2">
              <h3 className="min-h-[2.4rem] line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
              <p className="shrink-0 text-sm font-light text-foreground">
                {formatProductPrice({
                  priceCents: calculateTotalWithTaxCents(product.priceCents),
                  currency: product.currency,
                })}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              Incl. VAT ({formatTaxRate()}) | {DEFAULT_DELIVERY_ESTIMATE}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <section className="relative z-20 w-full px-4 sm:px-6 pt-4 pb-16">
      <div className="mx-auto max-w-[1460px]">
        <div className="relative z-20 mb-6 flex flex-col gap-4 border border-border bg-background/90 px-3 py-4 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Featured Products</p>
            <h2 className="mt-2 text-3xl font-normal leading-tight text-foreground sm:text-3xl md:text-4xl">
              Best sellers this week
            </h2>
          </div>
          <Link
            to="/category/shop"
            className="inline-flex items-center gap-1 text-sm text-foreground hover:text-foreground/70"
          >
            View all products
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="h-3 w-1/2 bg-muted animate-pulse" />
                <div className="h-3 w-5/6 bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            <p>{error}</p>
            <Link to="/category/shop" className="mt-3 inline-flex items-center gap-1 text-foreground hover:text-foreground/70">
              Continue shopping
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            No featured products found at the moment. Browse all items instead.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {products.slice(0, 4).map((product, index) => (
                <div key={product.id}>{renderProductCard(product, index)}</div>
              ))}
            </div>
            <div className="hidden sm:block">
              <Carousel opts={{ align: "start", loop: false }} className="w-full">
                <CarouselContent>
                  {products.map((product, index) => (
                    <CarouselItem key={product.id} className="basis-1/2 pr-2 md:basis-1/3 md:pr-4 lg:basis-1/4">
                      {renderProductCard(product, index)}
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ProductCarousel;
