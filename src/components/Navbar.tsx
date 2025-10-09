
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Wrench, LogOut, User } from "lucide-react";
import ShoppingCartComponent from "@/components/ShoppingCart";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleAuthAction = async () => {
    if (user) {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } else {
      navigate("/auth");
    }
  };
  
  const navLinks = [
    { name: t.nav.home, path: "/" },
    { name: t.nav.products, path: "/products" },
    { name: t.nav.projects, path: "/projects" },
    { name: t.nav.professionals, path: "/professionals" },
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
        <ul className="hidden lg:flex space-x-8">
          {navLinks.map(link => <li key={link.name} className="relative">
              <Link to={link.path} className="font-medium transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">
                {link.name}
              </Link>
            </li>)}
        </ul>

        <div className="hidden lg:flex items-center space-x-2">
          <div className="flex items-center space-x-1 mr-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <ShoppingCartComponent />
          <Button 
            className="btn-primary" 
            size="sm"
            onClick={handleAuthAction}
          >
            {user ? <><LogOut className="w-4 h-4 mr-2" /> Sign Out</> : <><User className="w-4 h-4 mr-2" /> {t.nav.account}</>}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center space-x-1">
          <ThemeToggle />
          <ShoppingCartComponent />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            
            <SheetContent side="right" className="w-4/5 max-w-sm">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                    <div className="p-1.5 bg-primary rounded-lg">
                      <Wrench className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-gradient text-sm">BuildMaster Pro</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col h-full pt-6">
                <div className="flex-1">
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
                  
                  <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Language</span>
                      <LanguageSelector />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
                
                <div className="pb-6 border-t pt-4">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleAuthAction();
                    }}
                  >
                    {user ? <><LogOut className="w-4 h-4 mr-2" /> Sign Out</> : <><User className="w-4 h-4 mr-2" /> {t.nav.account}</>}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>;
}
