import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductDescription from "../components/product/ProductDescription";
import { formatProductPrice, getProduct, getRecommendations, Product } from "../lib/api";
import { getSessionId, trackEvent } from "@/lib/analytics";
import { useRecentlyViewed } from "@/context/recentlyViewed";
import { usePageMeta } from "@/hooks/usePageMeta";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";

const IMAGE_EXTENSION_REGEX = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;

function isLikelyImageUrl(value: string): boolean {
  return IMAGE_EXTENSION_REGEX.test(value) || value.startsWith("data:image/");
}

function collectProductImages(product: Product): string[] {
  const imagesFromApi = Array.isArray(product.imageUrls) ? product.imageUrls : [];
  const imagesFromManuals = (product.manuals ?? [])
    .filter((manual) => (manual.fileType ?? "").toLowerCase().startsWith("image/") || isLikelyImageUrl(manual.url))
    .map((manual) => manual.url);
  const imagesFromSpecs = Object.entries(product.specs ?? {})
    .filter(([key, value]) => /image|photo|gallery/i.test(key) && typeof value === "string")
    .map(([, value]) => String(value))
    .filter((value) => isLikelyImageUrl(value));

  const merged = [product.imageUrl, ...imagesFromApi, ...imagesFromManuals, ...imagesFromSpecs]
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(merged));
}

const ProductDetail = () => {
  const { productId } = useParams();
  const resolvedProductId = productId ? productId.split("--")[0] : "";
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const { items: recentlyViewed, addProduct } = useRecentlyViewed();

  useEffect(() => {
    const loadProduct = async () => {
      if (!resolvedProductId) return;
      try {
        const data = await getProduct(resolvedProductId);
        setProduct(data);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    addProduct(product);
    trackEvent("product_view", {
      productId: product.id,
      name: product.name,
      category: product.category,
      priceCents: product.priceCents,
      currency: product.currency,
    });
  }, [addProduct, product]);

  useEffect(() => {
    let active = true;
    if (!resolvedProductId) return;
    getRecommendations({ productId: resolvedProductId, sessionId: getSessionId(), limit: 4 })
      .then((items) => {
        if (active) setRecommendedProducts(items);
      })
      .catch(() => {
        if (active) setRecommendedProducts([]);
      });
    return () => {
      active = false;
    };
  }, [resolvedProductId]);

  usePageMeta({
    title: product ? `${product.name} | Raph Supply` : "Product | Raph Supply",
    description:
      product?.description ||
      "Technical details, stock status, branch pickup, and manuals for hardware and trade products.",
  });

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-6">
          <div className="px-4 sm:px-6">
            <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted/40" />
              <div className="space-y-4">
                <div className="h-4 bg-muted/40 w-1/3" />
                <div className="h-8 bg-muted/40 w-2/3" />
                <div className="h-4 bg-muted/40 w-1/2" />
                <div className="h-10 bg-muted/40 w-full" />
                <div className="h-10 bg-muted/40 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const productImages = collectProductImages(product);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    category: product.category,
    description: product.description,
    image: productImages.length > 0 ? productImages : undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: (product.priceCents / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-6 pb-24 lg:pb-0">
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
        <section className="w-full px-4 sm:px-6">
          {/* Breadcrumb - Show above image on smaller screens */}
          <div className="lg:hidden mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`}>{product.category}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <ProductImageGallery
              imageUrl={product.imageUrl}
              images={productImages}
              name={product.name}
            />
            
            <div className="lg:pl-12 mt-8 lg:mt-0 lg:sticky lg:top-6 lg:h-fit">
              <ProductInfo product={product} />
              <ProductDescription product={product} />
            </div>
          </div>
        </section>
        
        {recommendedProducts.length > 0 && (
          <section className="w-full mt-16 lg:mt-24 px-4 sm:px-6">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Personalized Picks</p>
              <h2 className="text-xl font-light text-foreground">Recommended around this item</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendedProducts.map((item) => (
                <Link key={item.id} to={item.id === product.id ? "#" : `/product/${item.id}`} className="border border-border p-3">
                  <img src={item.imageUrl || "/placeholder.svg"} alt={item.name} className="aspect-square w-full object-cover" />
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{item.category}</p>
                  <p className="text-sm text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatProductPrice(item)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {recentlyViewed.length > 1 && (
          <section className="w-full mt-16 px-4 sm:px-6">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Recently Viewed</p>
              <h2 className="text-xl font-light text-foreground">Jump back into your shortlist</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentlyViewed.filter((item) => item.id !== product.id).slice(0, 4).map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="border border-border p-3">
                  <img src={item.imageUrl || "/placeholder.svg"} alt={item.name} className="aspect-square w-full object-cover" />
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{item.category}</p>
                  <p className="text-sm text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatProductPrice(item)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductDetail;
