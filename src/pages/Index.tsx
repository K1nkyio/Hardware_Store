import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ProductCard, { ProductProps } from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import ProjectGuideCard, { ProjectGuideProps } from "@/components/ProjectGuideCard";
import TestimonialsSection from "@/components/TestimonialsSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Zap, 
  Hammer, 
  Wrench, 
  Paintbrush, 
  TreePine,
  Shield,
  Settings,
  Lightbulb,
  Users,
  BookOpen,
  Award,
  Clock,
  Truck
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Sample categories data
const categories = [
  {
    name: "Power Tools",
    description: "Professional-grade drills, saws, sanders, and more",
    icon: Zap,
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&h=300&fit=crop&auto=format&q=80",
    productCount: 245,
    href: "/products?category=power-tools"
  },
  {
    name: "Hand Tools", 
    description: "Quality hammers, screwdrivers, pliers, and essentials",
    icon: Hammer,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop&auto=format&q=80",
    productCount: 189,
    href: "/products?category=hand-tools"
  },
  {
    name: "Hardware",
    description: "Screws, bolts, fasteners, and building hardware",
    icon: Settings,
    image: "https://images.unsplash.com/photo-1581092795442-7d4b372c902d?w=500&h=300&fit=crop",
    productCount: 312,
    href: "/products?category=hardware"
  },
  {
    name: "Paint & Supplies",
    description: "Premium paints, brushes, rollers, and finishes",
    icon: Paintbrush,
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&h=300&fit=crop",
    productCount: 156,
    href: "/products?category=paint"
  },
  {
    name: "Garden & Outdoor",
    description: "Landscaping tools, outdoor equipment, and supplies",
    icon: TreePine,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=300&fit=crop",
    productCount: 98,
    href: "/products?category=garden"
  },
  {
    name: "Safety Equipment",
    description: "Protective gear, safety equipment, and workwear",
    icon: Shield,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop",
    productCount: 87,
    href: "/products?category=safety"
  }
];

// Sample featured products
const featuredProducts: ProductProps[] = [
  {
    id: "1",
    name: "DEWALT 20V MAX Cordless Drill Driver",
    description: "High-performance brushless motor delivers 340 UWO and 1,825 in-lbs of torque",
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.8,
    reviewCount: 342,
    image: "https://images.unsplash.com/photo-1585435557343-3b092031e57c?w=400&h=400&fit=crop&auto=format&q=80",
    category: "Power Tools",
    brand: "DEWALT",
    inStock: true,
    isBestSeller: true,
    discount: 25
  },
  {
    id: "2", 
    name: "Klein Tools 11-in-1 Screwdriver Set",
    description: "Professional multi-bit screwdriver with cushion grip handle",
    price: 24.99,
    rating: 4.7,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop&auto=format&q=80",
    category: "Hand Tools",
    brand: "Klein Tools",
    inStock: true,
    isNew: true
  },
  {
    id: "3",
    name: "Bosch Random Orbital Sander",
    description: "Variable speed control with efficient dust collection system",
    price: 89.99,
    rating: 4.6,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop&auto=format&q=80",
    category: "Power Tools", 
    brand: "Bosch",
    inStock: true
  }
];

// Sample project guides
const projectGuides: ProjectGuideProps[] = [
  {
    id: "1",
    title: "Build a Modern Floating Shelf",
    description: "Learn to create sleek floating shelves that add both style and storage to any room.",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&auto=format&q=80",
    difficulty: "Beginner",
    duration: "2-3 hours",
    category: "Woodworking",
    materials: ["Wood board", "Wall brackets", "Screws"],
    tools: ["Drill", "Level", "Stud finder"],
    steps: 8
  },
  {
    id: "2",
    title: "Install Smart Light Switches",
    description: "Upgrade your home with smart switches for better lighting control and energy efficiency.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80",
    difficulty: "Intermediate", 
    duration: "1-2 hours",
    category: "Electrical",
    materials: ["Smart switches", "Wire nuts", "Electrical tape"],
    tools: ["Screwdriver", "Wire stripper", "Voltage tester"],
    steps: 12
  },
  {
    id: "3",
    title: "Build a Garden Planter Box",
    description: "Create a beautiful raised garden bed perfect for herbs, vegetables, or flowers.",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&auto=format&q=80",
    difficulty: "Beginner",
    duration: "4-6 hours", 
    category: "Garden",
    materials: ["Cedar boards", "Wood screws", "Landscape fabric"],
    tools: ["Circular saw", "Drill", "Measuring tape"],
    steps: 10
  }
];

export default function Index() {
  const { t } = useLanguage();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Feature items for the features section
  const features = [
    {
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      title: t.home.features.items.expertGuidance.title,
      description: t.home.features.items.expertGuidance.description
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: t.home.features.items.qualityTools.title,
      description: t.home.features.items.qualityTools.description
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: t.home.features.items.projectPlanning.title,
      description: t.home.features.items.projectPlanning.description
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t.home.features.items.communitySupport.title,
      description: t.home.features.items.communitySupport.description
    },
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      title: t.home.features.items.fastDelivery.title,
      description: t.home.features.items.fastDelivery.description
    },
    {
      icon: <Wrench className="h-8 w-8 text-primary" />,
      title: t.home.features.items.proServices.title,
      description: t.home.features.items.proServices.description
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1 overflow-x-hidden">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Welcome Section */}
        <section id="welcome" className="section bg-gradient-to-br from-background via-background to-muted/20">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="animate-fade-in [animation-delay:100ms] space-y-6">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                  <Award className="h-4 w-4" />
                  {t.home.welcome.subtitle}
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
                  {t.home.welcome.title}
                </h2>
                
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {t.home.welcome.description1}
                  </p>
                  <p className="text-muted-foreground">
                    {t.home.welcome.description2}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg" className="btn-primary">
                    <Link to="/products">
                      {t.home.welcome.learnMore} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5">
                    <Link to="/projects">
                      <BookOpen className="mr-2 h-5 w-5" />
                      View Projects
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="relative animate-fade-in [animation-delay:300ms]">
                <div className="relative">
                  {/* Main Image */}
                  <div className="aspect-[5/4] rounded-3xl overflow-hidden shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1581092795442-7d4b372c902d?w=800&h=600&fit=crop&auto=format&q=80"
                      alt="Professional workshop with organized tools and equipment" 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width="800"
                      height="600"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  
                  {/* Floating Cards - Responsive */}
                  <div className="absolute -bottom-4 md:-bottom-8 -left-2 md:-left-8 bg-card border rounded-xl md:rounded-2xl p-2 md:p-4 shadow-xl max-w-[160px] md:max-w-[200px]">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 md:w-12 h-8 md:h-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
                        <Hammer className="h-4 md:h-6 w-4 md:w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs md:text-sm">500+ Tools</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Professional Grade</p>
                        <p className="text-xs text-muted-foreground sm:hidden">Pro Grade</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -top-4 md:-top-8 -right-2 md:-right-8 bg-card border rounded-xl md:rounded-2xl p-2 md:p-4 shadow-xl max-w-[140px] md:max-w-[180px]">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 md:w-12 h-8 md:h-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 md:h-6 w-4 md:w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs md:text-sm">10k+ Users</p>
                        <p className="text-xs text-muted-foreground">Trust Us</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="section-sm bg-foreground relative overflow-hidden">
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, white 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, white 0px, transparent 1px, transparent 80px)'
          }} />
          <div className="container relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 animate-fade-in">
              <div className="max-w-xl">
                <span className="text-xs text-primary font-bold uppercase tracking-[0.2em]">
                  {t.home.categories.subtitle}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mt-3 leading-[0.95] text-primary-foreground tracking-tight">
                  {t.home.categories.title}
                </h2>
                <p className="text-primary-foreground/40 mt-3 text-base">
                  {t.home.categories.description}
                </p>
              </div>
              <Button asChild size="lg" className="bg-primary text-primary-foreground rounded-full px-8 font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all shrink-0 self-start md:self-auto">
                <Link to="/products">
                  {t.home.categories.viewAll} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            {/* Bento-style grid: first two larger, rest smaller */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
              {categories.map((category, index) => (
                <div 
                  key={index} 
                  className={`animate-fade-in ${index < 2 ? 'lg:col-span-2 lg:row-span-1' : ''}`} 
                  style={{ animationDelay: `${(index + 1) * 80}ms` }}
                >
                  <CategoryCard {...category} />
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Featured Products */}
        <section className="section bg-background relative">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 animate-fade-in">
              <div>
                <span className="text-xs text-primary font-bold uppercase tracking-[0.2em]">
                  {t.home.featuredProducts.subtitle}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mt-3 leading-[0.95] tracking-tight">
                  {t.home.featuredProducts.title}
                </h2>
                <p className="text-muted-foreground mt-3 text-base max-w-lg">
                  {t.home.featuredProducts.description}
                </p>
              </div>
              <Button asChild className="btn-primary rounded-full px-8 shrink-0 self-start md:self-auto">
                <Link to="/products">
                  {t.home.featuredProducts.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product, index) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Project Guides */}
        <section className="section bg-muted/30 relative">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 animate-fade-in">
              <div>
                <span className="text-xs text-primary font-bold uppercase tracking-[0.2em]">
                  {t.home.projectGuides.subtitle}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mt-3 leading-[0.95] tracking-tight">
                  {t.home.projectGuides.title}
                </h2>
                <p className="text-muted-foreground mt-3 text-base max-w-lg">
                  {t.home.projectGuides.description}
                </p>
              </div>
              <Button asChild className="btn-primary rounded-full px-8 shrink-0 self-start md:self-auto">
                <Link to="/projects">
                  {t.home.projectGuides.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectGuides.map((project, index) => (
                <div key={project.id} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                  <ProjectGuideCard project={project} />
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <TestimonialsSection />
        
        {/* Features Section */}
        <section className="section bg-card">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
              <span className="text-sm text-primary font-medium uppercase tracking-wider">
                {t.home.features.subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                {t.home.features.title}
              </h2>
              <p className="text-muted-foreground">
                {t.home.features.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="glass-card p-6 rounded-xl animate-fade-in flex flex-col items-center text-center"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="mb-4 p-3 rounded-full bg-primary/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Professional Services CTA */}
        <section className="section">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div className="glass-card p-8 md:p-12 rounded-2xl animate-fade-in">
                <span className="text-sm text-primary font-medium uppercase tracking-wider">
                  {t.home.professionalServices.subtitle}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                  {t.home.professionalServices.title}
                </h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  {t.home.professionalServices.description}
                </p>
                <Button asChild size="lg" className="btn-primary">
                  <Link to="/professionals">
                    {t.home.professionalServices.findPros} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="relative py-24 bg-primary/5">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t.home.cta.title}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t.home.cta.description}
              </p>
              <Button asChild size="lg" className="btn-primary">
                <Link to="/products">{t.home.cta.shopNow}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}