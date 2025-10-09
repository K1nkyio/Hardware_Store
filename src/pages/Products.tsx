import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductFilters, { FilterState } from "@/components/ProductFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Product = Database['public']['Tables']['products']['Row'];

export default function Products() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: [0, 500],
    brands: [],
    minRating: 0,
    inStockOnly: false
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get search term and category from URL params
  const searchTerm = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  const filteredProducts = products.filter(product => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // URL Category filter (takes precedence over filter state)
    const activeCategory = categoryParam || filters.category;
    if (activeCategory !== 'all' && product.category !== activeCategory) {
      return false;
    }

    // Price range filter
    const price = Number(product.price);
    if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
      return false;
    }

    // Rating filter
    const rating = Number(product.rating || 0);
    if (rating < filters.minRating) {
      return false;
    }

    // Stock filter
    if (filters.inStockOnly && !product.in_stock) {
      return false;
    }

    return true;
  });
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Update filters based on URL params
    if (categoryParam && categoryParam !== filters.category) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }
  }, [categoryParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Loading products...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24">
        <section className="section-sm">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {searchTerm ? `${t.common.searchResults} "${searchTerm}"` : categoryParam ? `${categoryParam} ${t.products.title}` : t.products.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {searchTerm || categoryParam ? `${t.common.foundResults} ${filteredProducts.length} ${t.common.results}` : t.products.subtitle}
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
                      <ProductCard key={product.id} product={{
                        id: product.id,
                        name: product.name,
                        price: Number(product.price),
                        rating: Number(product.rating || 0),
                        reviewCount: Number(product.reviews || 0),
                        image: product.image,
                        category: product.category,
                        inStock: product.in_stock || false,
                        brand: '',
                        description: product.description || ''
                      }} />
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