import { ArrowRight, X, Minus, Plus, LogOut, User, ChevronRight, ChevronDown, ShoppingBag, Package, Home, Info, Zap, Shield, PaintBucket, Hammer } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ShoppingBagComponent from "./ShoppingBag";
import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cart";

const Navigation = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [offCanvasType, setOffCanvasType] = useState<'favorites' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShoppingBagOpen, setIsShoppingBagOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Shop'])); // Default Shop expanded
  const { currentUser, logout } = useAuth();
  const { items, totalItems, updateQuantity, removeItem, isReady } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect to home even if logout fails
      navigate("/");
    }
  };

  const popularSearches = [
    "Electrical Supplies",
    "Safety Equipment",
    "Paint & Tools",
    "Plumbing Fixtures",
    "Building Materials",
    "Cleaning Supplies"
  ];
  
  const navItems = [
    { 
      name: "Home", 
      href: "/",
      icon: <Home className="w-4 h-4" />,
      submenuItems: [],
      images: []
    },
    { 
      name: "Shop", 
      href: "/category/shop",
      icon: <Package className="w-4 h-4" />,
      submenuItems: [
        "Electrical & Lighting",
        "Safety Equipment",
        "Cleaning & Home Maintenance",
        "Paints",
        "Building & Construction Materials",
        "Plumbing"
      ],
      images: [
        { src: "/placeholder.svg", alt: "Electrical & Lighting Collection", label: "Electrical & Lighting" },
        { src: "/placeholder.svg", alt: "Plumbing Collection", label: "Plumbing" }
      ]
    },
    { 
      name: "About", 
      href: "/about/our-story",
      icon: <Info className="w-4 h-4" />,
      submenuItems: [
        "Our Story",
        "Customer Care",
        "Store Locator"
      ],
      images: [
        { src: "/placeholder.svg", alt: "About Raph", label: "Read our story" }
      ]
    }
  ];

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <nav 
      className="relative border-b border-border/20" 
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile hamburger button */}
        <button
          className="lg:hidden p-2 mt-0.5 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-5 relative">
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? 'rotate-45 top-2.5' : 'top-1.5'
            }`}></span>
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 top-2.5 ${
              isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}></span>
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? '-rotate-45 top-2.5' : 'top-3.5'
            }`}></span>
          </div>
        </button>

        {/* Left navigation */}
        <div className="hidden lg:flex space-x-8">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to={item.href}
                className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light py-6 block"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Center logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to="/" className="block text-xl font-medium tracking-widest text-foreground uppercase">
            RAPH
          </Link>
        </div>

        {/* Right icons */}
        <div className="flex items-center space-x-2">
          {currentUser ? (
            <>
              <button 
                className="hidden lg:block p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
                aria-label="Account"
                onClick={() => navigate('/account')}
              >
                <User className="w-5 h-5" />
              </button>
              <button 
                className="hidden lg:block p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
                aria-label="Logout"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link 
              to="/login"
              className="hidden sm:block px-4 py-2 text-sm font-light text-nav-foreground hover:text-nav-hover transition-colors duration-200 border border-border rounded-none hover:border-nav-hover"
            >
              Sign In
            </Link>
          )}
          <button 
            className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
            aria-label="Search"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <button 
            className="hidden lg:block p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
            aria-label="Favorites"
            onClick={() => setOffCanvasType('favorites')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
          <button 
            className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 relative"
            aria-label="Shopping cart"
            onClick={() => setIsShoppingBagOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[30%] text-[0.5rem] font-semibold text-black pointer-events-none">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Full width dropdown */}
      {activeDropdown && (
        <div 
          className="absolute top-full left-0 right-0 bg-nav border-b border-border z-50"
          onMouseEnter={() => setActiveDropdown(activeDropdown)}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <div className="px-6 py-8">
            <div className="flex justify-between w-full">
              <div className="flex-1">
                <ul className="space-y-2">
                   {navItems
                     .find(item => item.name === activeDropdown)
                     ?.submenuItems.map((subItem, index) => (
                       <li key={index}>
                         <Link 
                           to={activeDropdown === "About" ? `/about/${subItem.toLowerCase().replace(/\s+/g, '-')}` : `/category/${subItem.toLowerCase().replace(/\s+/g, '-')}`}
                           className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light block py-2"
                         >
                           {subItem}
                         </Link>
                       </li>
                   ))}
                </ul>
              </div>

              <div className="flex space-x-6">
                {navItems
                  .find(item => item.name === activeDropdown)
                  ?.images.map((image, index) => {
                    let linkTo = "/category/shop";
                    if (activeDropdown === "About") linkTo = "/about/our-story";
                    
                    return (
                      <Link key={index} to={linkTo} className="w-[400px] h-[280px] cursor-pointer group relative overflow-hidden block bg-muted">
                        <img 
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                        />
                        <div className="absolute bottom-2 left-2 text-foreground text-xs font-light flex items-center gap-1">
                          <span>{image.label}</span>
                          <ArrowRight size={12} />
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-nav border-b border-border z-50">
          <div className="px-6 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="relative mb-8">
                <div className="flex items-center border-b border-border pb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-nav-foreground mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for plumbing supplies..."
                    className="flex-1 bg-transparent text-nav-foreground placeholder:text-nav-foreground/60 outline-none text-lg"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <h3 className="text-nav-foreground text-sm font-light mb-4">Popular Searches</h3>
                <div className="flex flex-wrap gap-3">
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      className="text-nav-foreground hover:text-nav-hover text-sm font-light py-2 px-4 border border-border rounded-full transition-colors duration-200 hover:border-nav-hover"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-border z-50" style={{ backgroundColor: '#ffffff' }}>
          <div className="px-4 py-2">
            {/* User Section */}
            {currentUser && (
              <div className="border-b border-border/20 pb-4 mb-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Welcome back,</p>
                    <p className="text-base font-semibold text-gray-900">{currentUser.fullName || currentUser.username}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        navigate('/account');
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 active:bg-gray-200"
                      aria-label="Account"
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 active:bg-gray-200"
                      aria-label="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation Items */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <div key={item.name} className="border-b border-border/10 last:border-b-0">
                  {/* Main Category */}
                  <button
                    onClick={() => {
                      if (item.submenuItems.length > 0) {
                        toggleSection(item.name);
                      } else {
                        navigate(item.href);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-3 text-gray-900 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-all duration-200 min-h-[44px]"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">{item.icon}</span>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    {item.submenuItems.length > 0 && (
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          expandedSections.has(item.name) ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                    {item.submenuItems.length === 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {/* Submenu Items */}
                  {item.submenuItems.length > 0 && expandedSections.has(item.name) && (
                    <div className="px-3 py-2 space-y-1 bg-gray-50/50 rounded-lg mx-1 mb-2">
                      {item.submenuItems.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={item.name === "About" ? `/about/${subItem.toLowerCase().replace(/\s+/g, '-')}` : `/category/${subItem.toLowerCase().replace(/\s+/g, '-')}`}
                          className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-white hover:text-gray-900 rounded-md transition-all duration-200 active:bg-gray-100 min-h-[40px]"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span>{subItem}</span>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Login Section */}
            {!currentUser && (
              <div className="pt-4 mt-2 border-t border-border/20">
                <Link
                  to="/login"
                  className="block w-full px-4 py-3 text-center text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-700 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center justify-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      
      <ShoppingBagComponent 
        isOpen={isShoppingBagOpen}
        onClose={() => setIsShoppingBagOpen(false)}
        cartItems={items}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        isReady={isReady}
        onViewFavorites={() => {
          setIsShoppingBagOpen(false);
          setOffCanvasType('favorites');
        }}
      />
      
      {/* Favorites Off-canvas */}
      {offCanvasType === 'favorites' && (
        <div className="fixed inset-0 z-50 h-screen">
          <div 
            className="absolute inset-0 bg-black/50 h-screen"
            onClick={() => setOffCanvasType(null)}
          />
          <div className="absolute right-0 top-0 h-screen w-96 bg-background border-l border-border animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-light text-foreground">Your Favorites</h2>
              <button
                onClick={() => setOffCanvasType(null)}
                className="p-2 text-foreground hover:text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-muted-foreground text-sm mb-6">
                You haven't added any favorites yet. Browse our catalog and save items for quick reordering.
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
