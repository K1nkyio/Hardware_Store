
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Wrench } from "lucide-react";
import ShoppingCartComponent from "@/components/ShoppingCart";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Navbar() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navLinks = [
    { name: t.nav.home, path: "/" },
    { name: t.nav.products, path: "/products" },
    { name: t.nav.projects, path: "/projects" },
    { name: t.nav.professionals, path: "/professionals" },
    { name: t.nav.community, path: "/community" },
    { name: t.nav.contact, path: "/contact" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);
  
  return <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", scrolled ? "bg-white/80 dark:bg-card/80 backdrop-blur-lg py-3 shadow-md" : "bg-transparent py-5")}>
      <nav className="container flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
          <div className="p-2 bg-primary rounded-lg">
            <Wrench className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-gradient">BuildMaster Pro</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-8">
          {navLinks.map(link => <li key={link.name} className="relative">
              <Link to={link.path} className="font-medium transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">
                {link.name}
              </Link>
            </li>)}
        </ul>

        <div className="hidden md:flex items-center space-x-4">
          <LanguageSelector />
          <ThemeToggle />
          <ShoppingCartComponent />
          <Button asChild className="btn-primary">
            <Link to="/products">{t.nav.account}</Link>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <ShoppingCartComponent />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-full">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

        {/* Mobile Menu */}
        <div className={cn("fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden transition-opacity duration-300", mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <div className={cn("fixed inset-y-0 right-0 w-4/5 max-w-sm bg-card shadow-xl transition-transform duration-300 ease-in-out", mobileMenuOpen ? "translate-x-0" : "translate-x-full")}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-6 border-b">
                <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                  <div className="p-1.5 bg-primary rounded-lg">
                    <Wrench className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-gradient text-sm">BuildMaster Pro</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="rounded-full">
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="flex-1 p-6">
                <nav className="space-y-1">
                  {navLinks.map(link => (
                    <Link 
                      key={link.name}
                      to={link.path} 
                      className="block px-3 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-accent rounded-md transition-colors" 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>
                
                <div className="mt-8 pt-8 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Language</span>
                    <LanguageSelector />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t">
                <Button asChild className="w-full mb-3">
                  <Link to="/products" onClick={() => setMobileMenuOpen(false)}>
                    {t.nav.account}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
    </header>;
}
