import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { useQuery } from "@tanstack/react-query";
import { getProductFacets } from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

const Category = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  const normalizedCategory = category ? category.replace(/-/g, " ") : "";
  const isAllCategory =
    !normalizedCategory ||
    normalizedCategory.toLowerCase() === "shop" ||
    normalizedCategory.toLowerCase() === "all" ||
    normalizedCategory.toLowerCase() === "all products";
  const displayCategory = isAllCategory
    ? "All Products"
    : normalizedCategory
      ? normalizedCategory.replace(/\b\w/g, (match) => match.toUpperCase())
      : "All Products";
  usePageMeta({
    title: `${displayCategory} | Raph Supply`,
    description: `Browse ${displayCategory.toLowerCase()} with live stock visibility, compatibility filters, and branch pickup options at Raph Supply.`,
  });

  const filters = {
    q: searchParams.get("q") ?? "",
    productType: searchParams.get("productType") ?? "",
    compatibility: searchParams.get("compatibility") ?? "",
    pickupCity: searchParams.get("pickupCity") ?? "",
    availability: (searchParams.get("availability") as "any" | "in-stock" | "out-of-stock") ?? "any",
    priceMin: searchParams.get("priceMin") ?? "",
    priceMax: searchParams.get("priceMax") ?? "",
    sortBy: searchParams.get("sort") ?? "featured",
  };

  const { data: facets } = useQuery({
    queryKey: ["product-facets", normalizedCategory, filters],
    queryFn: () =>
      getProductFacets({
        status: "active",
        category: isAllCategory ? undefined : normalizedCategory || undefined,
        q: filters.q || undefined,
        compatibility: filters.compatibility || undefined,
        pickupCity: filters.pickupCity || undefined,
        inStock: filters.availability === "in-stock" ? true : undefined,
        priceMin: filters.priceMin || undefined,
        priceMax: filters.priceMax || undefined,
      }),
  });

  const applyFilters = (nextFilters: typeof filters) => {
    const params = new URLSearchParams();
    if (nextFilters.q) params.set("q", nextFilters.q);
    if (nextFilters.productType) params.set("productType", nextFilters.productType);
    if (nextFilters.compatibility) params.set("compatibility", nextFilters.compatibility);
    if (nextFilters.pickupCity) params.set("pickupCity", nextFilters.pickupCity);
    if (nextFilters.availability && nextFilters.availability !== "any") {
      params.set("availability", nextFilters.availability);
    }
    if (nextFilters.priceMin) params.set("priceMin", nextFilters.priceMin);
    if (nextFilters.priceMax) params.set("priceMax", nextFilters.priceMax);
    if (nextFilters.sortBy && nextFilters.sortBy !== "featured") {
      params.set("sort", nextFilters.sortBy);
    }
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-6">
        <CategoryHeader 
          category={displayCategory} 
        />
        
        <FilterSortBar 
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          itemCount={itemCount}
          filters={filters}
          facets={facets}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        
        <ProductGrid
          category={isAllCategory ? undefined : normalizedCategory || undefined}
          filters={filters}
          sortBy={filters.sortBy}
          onCountChange={setItemCount}
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default Category;
