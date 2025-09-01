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
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&h=300&fit=crop",
    productCount: 245,
    href: "/products?category=power-tools"
  },
  {
    name: "Hand Tools", 
    description: "Quality hammers, screwdrivers, pliers, and essentials",
    icon: Hammer,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop",
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
    image: "https://images.unsplash.com/photo-1585435557343-3b092031e57c?w=400&h=400&fit=crop",
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
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop",
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
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop",
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
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
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
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
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
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Welcome Section */}
        <section id="welcome" className="section">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in [animation-delay:100ms]">
                <span className="text-sm text-primary font-medium uppercase tracking-wider">
                  {t.home.welcome.subtitle}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">
                  {t.home.welcome.title}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t.home.welcome.description1}
                </p>
                <p className="text-muted-foreground mb-8">
                  {t.home.welcome.description2}
                </p>
                <Button asChild className="btn-primary">
                  <Link to="/products">
                    {t.home.welcome.learnMore} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="relative animate-fade-in [animation-delay:300ms]">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1581092795442-7d4b372c902d?w=800&h=600&fit=crop"
                    alt="Professional workshop with tools" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 w-2/3 rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
                    alt="Hand tools collection" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-6 -right-6 w-1/2 rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1585435557343-3b092031e57c?w=400&h=300&fit=crop"
                    alt="Power tools" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="section bg-muted/30">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
              <span className="text-sm text-primary font-medium uppercase tracking-wider">
                {t.home.categories.subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                {t.home.categories.title}
              </h2>
              <p className="text-muted-foreground">
                {t.home.categories.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <div key={index} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                  <CategoryCard {...category} />
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild className="btn-primary">
                <Link to="/products">
                  {t.home.categories.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Featured Products */}
        <section className="section">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
              <span className="text-sm text-primary font-medium uppercase tracking-wider">
                {t.home.featuredProducts.subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                {t.home.featuredProducts.title}
              </h2>
              <p className="text-muted-foreground">
                {t.home.featuredProducts.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild className="btn-primary">
                <Link to="/products">
                  {t.home.featuredProducts.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Project Guides */}
        <section className="section bg-muted/30">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
              <span className="text-sm text-primary font-medium uppercase tracking-wider">
                {t.home.projectGuides.subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                {t.home.projectGuides.title}
              </h2>
              <p className="text-muted-foreground">
                {t.home.projectGuides.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectGuides.map((project, index) => (
                <div key={project.id} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                  <ProjectGuideCard project={project} />
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild className="btn-primary">
                <Link to="/projects">
                  {t.home.projectGuides.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
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