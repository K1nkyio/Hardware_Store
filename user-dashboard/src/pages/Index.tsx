import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import HomeHero from "../components/content/HomeHero";
import TrustStrip from "../components/content/TrustStrip";
import CategoryGridSection from "../components/content/CategoryGridSection";
import HomeImageShowcase from "../components/content/HomeImageShowcase";
import ProductCarousel from "../components/content/ProductCarousel";
import EditorialSection from "../components/content/EditorialSection";
import HomeFinalCta from "../components/content/HomeFinalCta";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-4">
        <HomeHero />
        <TrustStrip />
        <CategoryGridSection />
        <HomeImageShowcase />
        <ProductCarousel />
        <EditorialSection />
        <HomeFinalCta />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
