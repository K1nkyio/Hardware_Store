import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductFilters, { FilterState } from "@/components/ProductFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import { products } from "@/data/products";

export default function Products() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: [0, 500],
    brands: [],
    minRating: 0,
    inStockOnly: false
  });

  const filteredProducts = products.filter(product => {
    // Category filter
    if (filters.category !== 'all' && product.category !== filters.category) {
      return false;
    }

    // Price range filter
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }

    // Brand filter
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
      return false;
    }

    // Rating filter
    if (product.rating < filters.minRating) {
      return false;
    }

    // Stock filter
    if (filters.inStockOnly && !product.inStock) {
      return false;
    }

    return true;
  });
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24">
        <section className="section-sm">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t.products.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t.products.subtitle}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <ProductFilters onFiltersChange={setFilters} />
              </div>

              {/* Products Grid */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    {t.products.filters.showing} {filteredProducts.length} {t.products.filters.of} {products.length} {t.products.filters.products}
                  </p>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground text-lg mb-2">
                      {t.products.filters.noMatch}
                    </p>
                    <p className="text-muted-foreground">
                      {t.products.filters.adjustFilters}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}