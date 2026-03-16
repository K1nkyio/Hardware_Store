import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { listProducts } from "@/lib/products";

type NewInPeriod = "this-week" | "last-week" | "this-month" | "last-month" | "this-year";

function startOfDay(input: Date): Date {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate());
}

function startOfWeek(input: Date): Date {
  const date = startOfDay(input);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

function getNewInRange(period: NewInPeriod): { createdAfter: string; createdBefore?: string; label: string } {
  const now = new Date();

  switch (period) {
    case "this-week": {
      return {
        createdAfter: startOfWeek(now).toISOString(),
        label: "New In - This Week",
      };
    }
    case "last-week": {
      const thisWeekStart = startOfWeek(now);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      return {
        createdAfter: lastWeekStart.toISOString(),
        createdBefore: thisWeekStart.toISOString(),
        label: "New In - Last Week",
      };
    }
    case "this-month": {
      return {
        createdAfter: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        label: "New In - This Month",
      };
    }
    case "last-month": {
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        createdAfter: lastMonthStart.toISOString(),
        createdBefore: thisMonthStart.toISOString(),
        label: "New In - Last Month",
      };
    }
    case "this-year": {
      return {
        createdAfter: new Date(now.getFullYear(), 0, 1).toISOString(),
        label: "New In - This Year",
      };
    }
    default: {
      return {
        createdAfter: startOfWeek(now).toISOString(),
        label: "New In - This Week",
      };
    }
  }
}

const Category = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("featured");

  const normalizedCategory = category
    ? decodeURIComponent(category).replace(/-/g, " ")
    : "All Products";

  const isNewInPage = normalizedCategory.toLowerCase() === "new in";
  const rawPeriod = (searchParams.get("period") ?? "this-week").toLowerCase() as NewInPeriod;
  const period = (
    ["this-week", "last-week", "this-month", "last-month", "this-year"] as NewInPeriod[]
  ).includes(rawPeriod)
    ? rawPeriod
    : "this-week";
  const newInRange = isNewInPage ? getNewInRange(period) : null;

  const categoryFilter =
    !category ||
    normalizedCategory.toLowerCase() === "shop" ||
    normalizedCategory.toLowerCase() === "all products" ||
    isNewInPage
      ? undefined
      : normalizedCategory;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "products",
      "category",
      categoryFilter ?? "all",
      isNewInPage ? period : "none",
    ],
    queryFn: () =>
      listProducts({
        status: "active",
        category: categoryFilter,
        createdAfter: newInRange?.createdAfter,
        createdBefore: newInRange?.createdBefore,
      }),
  });

  const products = data ?? [];

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleSubcategory = (value: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const subcategoryRules: Record<string, { category: string; keywords: string[] }> = {
    "Surge Protectors": { category: "Electrical & Lighting", keywords: ["surge", "protector"] },
    Batteries: { category: "Electrical & Lighting", keywords: ["battery"] },
    "Construction Tools": { category: "Tools", keywords: ["hammer", "chisel", "spade", "shovel"] },
    "Power Tools": { category: "Tools", keywords: ["drill", "grinder", "saw", "impact"] },
    Fasteners: { category: "Tools", keywords: ["screw", "bolt", "nut", "fastener", "nail"] },
    Fencing: { category: "Building & Construction Materials", keywords: ["fence", "fencing"] },
    Cements: { category: "Building & Construction Materials", keywords: ["cement", "mortar"] },
    "IPS Fittings": { category: "Plumbing", keywords: ["ips", "fitting", "elbow", "tee", "coupling"] },
    Taps: { category: "Plumbing", keywords: ["tap", "faucet", "mixer"] },
    "Waste Fitting": { category: "Plumbing", keywords: ["waste", "drain", "trap"] },
    "Bathroom Fixtures": { category: "Plumbing", keywords: ["toilet", "sink", "showerhead", "bathroom"] },
    "Kitchen Fixtures": { category: "Plumbing", keywords: ["kitchen", "sink", "wardroom"] },
    "Bedroom Fixtures": { category: "Plumbing", keywords: ["bedroom", "wardrobe", "closet"] },
  };

  const filteredProducts = products
    .filter((product) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
        return false;
      }

      if (selectedSubcategories.length > 0) {
        const searchable = `${product.name} ${product.description} ${product.category}`.toLowerCase();

        const matchesSubcategory = selectedSubcategories.some((subcategory) => {
          const rule = subcategoryRules[subcategory];
          if (!rule) return false;

          const categoryMatch = product.category === rule.category;
          const keywordMatch = rule.keywords.some((keyword) => searchable.includes(keyword.toLowerCase()));

          return categoryMatch || keywordMatch;
        });

        if (!matchesSubcategory) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.priceCents - b.priceCents;
      if (sortBy === "price-high") return b.priceCents - a.priceCents;
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
  };

  const categoryTitle = isNewInPage ? (newInRange?.label ?? "New In") : normalizedCategory || "All Products";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-6">
        <CategoryHeader 
          category={categoryTitle} 
        />
        
        <FilterSortBar 
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          itemCount={filteredProducts.length}
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedCategories={selectedCategories}
          selectedSubcategories={selectedSubcategories}
          onToggleCategory={toggleCategory}
          onToggleSubcategory={toggleSubcategory}
          onClearFilters={clearFilters}
        />
        
        <ProductGrid products={filteredProducts} isLoading={isLoading} isError={isError} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Category;
