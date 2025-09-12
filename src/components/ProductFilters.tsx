import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  category: string;
  priceRange: [number, number];
  brands: string[];
  minRating: number;
  inStockOnly: boolean;
}

export default function ProductFilters({ onFiltersChange }: ProductFiltersProps) {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priceRange: [0, 500],
    brands: [],
    minRating: 0,
    inStockOnly: false
  });

  const categories = [
    { value: 'all', label: t.products.filters.allCategories },
    { value: 'Power Tools', label: t.products.categories.powerTools },
    { value: 'Hand Tools', label: t.products.categories.handTools },
    { value: 'Lumber', label: t.products.categories.lumber },
    { value: 'Electrical', label: t.products.categories.electrical },
    { value: 'Plumbing', label: t.products.categories.plumbing },
    { value: 'Hardware', label: t.products.categories.hardware },
    { value: 'Paint', label: t.products.categories.paint }
  ];

  const brands = ['DeWalt', 'Milwaukee', 'Makita', 'Stanley', 'Klein Tools', 'Craftsman', 'Benjamin Moore', 'Purdy'];

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      category: 'all',
      priceRange: [0, 500],
      brands: [],
      minRating: 0,
      inStockOnly: false
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked 
      ? [...filters.brands, brand]
      : filters.brands.filter(b => b !== brand);
    updateFilters({ brands: newBrands });
  };

  return (
    <div className="space-y-6 p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button variant="ghost" onClick={resetFilters} size="sm">
          {t.products.filters.resetFilters}
        </Button>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t.products.filters.category}</label>
        <Select value={filters.category} onValueChange={(value) => updateFilters({ category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t.products.filters.priceRange}</label>
        <div className="px-2">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
            max={500}
            min={0}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Brand Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t.products.filters.brand}</label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={filters.brands.includes(brand)}
                onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
              />
              <label
                htmlFor={`brand-${brand}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {brand}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t.products.filters.rating}</label>
        <Select value={filters.minRating.toString()} onValueChange={(value) => updateFilters({ minRating: parseInt(value) })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Ratings</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Availability Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t.products.filters.availability}</label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => updateFilters({ inStockOnly: checked as boolean })}
          />
          <label
            htmlFor="in-stock"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t.products.filters.inStock}
          </label>
        </div>
      </div>
    </div>
  );
}