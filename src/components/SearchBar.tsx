import { useState } from "react";
import { Search, Filter, Wrench, Hammer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterClick = () => {
    navigate('/products');
  };

  const handleQuickFilter = (category: string) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const quickFilters = [
    { name: "Power Tools", icon: Zap, color: "text-tool-blue" },
    { name: "Hand Tools", icon: Hammer, color: "text-tool-orange" },
    { name: "Hardware", icon: Wrench, color: "text-tool-green" }
  ];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t.search.placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-12 pr-20 py-6 text-lg bg-card border-2 border-border hover:border-primary/50 focus:border-primary rounded-xl"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
          <Button size="icon" variant="ghost" className="h-10 w-10" onClick={handleFilterClick}>
            <Filter className="h-4 w-4" />
          </Button>
          <Button className="px-6 h-10 btn-primary" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-primary/20 hover:bg-primary/5"
          onClick={() => handleQuickFilter('Emergency Repair')}
        >
          <Wrench className="h-4 w-4 mr-2 text-primary" />
          {t.search.emergencyRepair}
        </Button>
        
        {quickFilters.map((filter, index) => (
          <Button 
            key={index}
            variant="outline" 
            size="sm"
            className="border-border hover:bg-accent"
            onClick={() => handleQuickFilter(filter.name)}
          >
            <filter.icon className={`h-4 w-4 mr-2 ${filter.color}`} />
            {filter.name}
          </Button>
        ))}
      </div>

      {/* Popular Searches */}
      <div className="mt-4 text-center">
        <span className="text-sm text-muted-foreground mr-3">Popular:</span>
        {["Drill Sets", "Paint Brushes", "Screws & Fasteners", "Safety Gear"].map((term, index) => (
          <button 
            key={index}
            className="text-sm text-primary hover:underline mr-4 last:mr-0"
            onClick={() => {
              setSearchTerm(term);
              navigate(`/products?search=${encodeURIComponent(term)}`);
            }}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}