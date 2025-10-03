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
    <div className="relative max-w-4xl mx-auto px-2 sm:px-0">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-2 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t.search.placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-8 sm:pl-10 md:pl-12 pr-24 sm:pr-28 md:pr-32 py-2.5 sm:py-3 md:py-6 text-xs sm:text-sm md:text-lg bg-card border-2 border-border hover:border-primary/50 focus:border-primary rounded-lg md:rounded-xl"
        />
        <div className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 flex gap-1 md:gap-2">
          <Button size="icon" variant="ghost" className="h-7 sm:h-8 md:h-10 w-7 sm:w-8 md:w-10" onClick={handleFilterClick}>
            <Filter className="h-3 md:h-4 w-3 md:w-4" />
          </Button>
          <Button className="px-2 sm:px-3 md:px-6 h-7 sm:h-8 md:h-10 text-xs md:text-sm btn-primary" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 mt-2 sm:mt-3 md:mt-4 justify-center px-2 sm:px-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-primary/20 hover:bg-primary/5 text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8"
          onClick={() => handleQuickFilter('Emergency Repair')}
        >
          <Wrench className="h-3 w-3 md:h-4 md:w-4 mr-1" />
          <span className="hidden sm:inline">{t.search.emergencyRepair}</span>
          <span className="sm:hidden">Emergency</span>
        </Button>
        
        {quickFilters.map((filter, index) => (
          <Button 
            key={index}
            variant="outline" 
            size="sm"
            className="border-border hover:bg-accent text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3 h-7 sm:h-8"
            onClick={() => handleQuickFilter(filter.name)}
          >
            <filter.icon className={`h-3 w-3 md:h-4 md:w-4 mr-1 ${filter.color}`} />
            <span className="hidden sm:inline">{filter.name}</span>
            <span className="sm:hidden">{filter.name.split(' ')[0]}</span>
          </Button>
        ))}
      </div>

      {/* Popular Searches */}
      <div className="mt-3 sm:mt-4 text-center px-2">
        <span className="text-xs sm:text-sm text-muted-foreground mr-2 sm:mr-3">Popular:</span>
        {["Drill Sets", "Paint Brushes", "Screws & Fasteners", "Safety Gear"].map((term, index) => (
          <button 
            key={index}
            className="text-xs sm:text-sm text-primary hover:underline mr-2 sm:mr-4 last:mr-0 mb-1"
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