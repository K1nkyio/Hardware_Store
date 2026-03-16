import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

type FilterState = {
  q: string;
  productType: string;
  availability: "any" | "in-stock" | "out-of-stock";
  priceMin: string;
  priceMax: string;
  sortBy: string;
};

interface FilterSortBarProps {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  itemCount: number;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

const FilterSortBar = ({ filtersOpen, setFiltersOpen, itemCount, filters, onApply, onClear }: FilterSortBarProps) => {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(draft);
    setFiltersOpen(false);
  };

  const handleSortChange = (value: string) => {
    const next = { ...draft, sortBy: value };
    setDraft(next);
    onApply(next);
  };

  return (
    <section className="w-full px-4 sm:px-6 mb-8 border-b border-border pb-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm font-light text-muted-foreground">
          {itemCount} items
        </p>
        
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Input
              type="text"
              value={draft.q}
              onChange={(e) => setDraft((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Search products"
              className="h-8 w-56 rounded-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApply();
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="font-light hover:bg-transparent"
              onClick={handleApply}
            >
              Search
            </Button>
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-9 px-3 font-light hover:bg-transparent"
              >
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 bg-background border-none shadow-none flex h-full flex-col overflow-hidden"
            >
              <SheetHeader className="mb-6 border-b border-border pb-4">
                <SheetTitle className="text-lg font-light">Filters</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-8 pb-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="search" className="text-sm font-light text-foreground">Search</Label>
                      <Input
                        id="search"
                        type="text"
                        value={draft.q}
                        onChange={(e) => setDraft((prev) => ({ ...prev, q: e.target.value }))}
                        placeholder="Search by name, SKU, or brand"
                        className="mt-2 rounded-none"
                      />
                    </div>
                  </div>

                  <Separator className="border-border" />

                  <div>
                    <h3 className="text-sm font-light mb-4 text-foreground">Product Type</h3>
                    <Input
                      id="productType"
                      type="text"
                      value={draft.productType}
                      onChange={(e) => setDraft((prev) => ({ ...prev, productType: e.target.value }))}
                      placeholder="e.g. Plumbing, Electrical, Safety"
                      className="rounded-none"
                    />
                  </div>

                  <Separator className="border-border" />

                  <div>
                    <h3 className="text-sm font-light mb-4 text-foreground">Availability</h3>
                    <Select
                      value={draft.availability}
                      onValueChange={(value) =>
                        setDraft((prev) => ({ ...prev, availability: value as FilterState["availability"] }))
                      }
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="shadow-none border-none rounded-none bg-background">
                        <SelectItem value="any" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">
                          Any
                        </SelectItem>
                        <SelectItem value="in-stock" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">
                          In stock
                        </SelectItem>
                        <SelectItem value="out-of-stock" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">
                          Out of stock
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="border-border" />

                  <div>
                    <h3 className="text-sm font-light mb-4 text-foreground">Price Range</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="priceMin" className="text-xs font-light text-muted-foreground">Min</Label>
                        <Input
                          id="priceMin"
                          type="number"
                          inputMode="decimal"
                          value={draft.priceMin}
                          onChange={(e) => setDraft((prev) => ({ ...prev, priceMin: e.target.value }))}
                          placeholder="0"
                          className="mt-2 rounded-none"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priceMax" className="text-xs font-light text-muted-foreground">Max</Label>
                        <Input
                          id="priceMax"
                          type="number"
                          inputMode="decimal"
                          value={draft.priceMax}
                          onChange={(e) => setDraft((prev) => ({ ...prev, priceMax: e.target.value }))}
                          placeholder="5000"
                          className="mt-2 rounded-none"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="border-border" />

                  <div className="flex flex-col gap-2 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full border-none hover:bg-transparent hover:underline font-normal text-left justify-start"
                      onClick={handleApply}
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full border-none hover:bg-transparent hover:underline font-light text-left justify-start"
                      onClick={onClear}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Select value={draft.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-9 w-auto border-none bg-transparent text-sm font-light shadow-none rounded-none pr-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="shadow-none border-none rounded-none bg-background">
              <SelectItem value="featured" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Featured</SelectItem>
              <SelectItem value="price-low" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Price: Low to High</SelectItem>
              <SelectItem value="price-high" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Price: High to Low</SelectItem>
              <SelectItem value="newest" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Newest</SelectItem>
              <SelectItem value="name" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
};

export default FilterSortBar;
