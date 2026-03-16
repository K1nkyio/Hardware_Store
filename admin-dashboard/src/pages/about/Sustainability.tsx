import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";

const Sustainability = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
        <PageHeader 
          title="Sustainability" 
          subtitle="Building responsibly with durable products, safer homes, and lower-waste operations."
        />
        
        <ContentSection title="How We Source">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <h3 className="text-xl font-light text-foreground">Verified Suppliers</h3>
              <p className="text-muted-foreground leading-relaxed">
                We prioritize suppliers that provide traceability for cement, metals, fittings, cables, and safety equipment. Our team regularly reviews documentation so stock is sourced with clear environmental and labor standards.
              </p>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-light text-foreground">Smarter Material Choices</h3>
              <p className="text-muted-foreground leading-relaxed">
                We promote long-life products and corrosion-resistant options that reduce replacement cycles. Where possible, we include recycled-content packaging and encourage refill or reuse options for maintenance products.
              </p>
            </div>
          </div>

          <div className="bg-muted/10 rounded-lg p-8">
            <h3 className="text-2xl font-light text-foreground mb-6">Priority Targets</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-light text-primary mb-2">Lower Waste</div>
                <p className="text-sm text-muted-foreground">Reduce packaging and damaged-stock disposal year over year</p>
              </div>
              <div>
                <div className="text-3xl font-light text-primary mb-2">Efficient Supply</div>
                <p className="text-sm text-muted-foreground">Improve route planning and bulk ordering to cut transport impact</p>
              </div>
              <div>
                <div className="text-3xl font-light text-primary mb-2">Safer Jobsites</div>
                <p className="text-sm text-muted-foreground">Expand access to compliant safety gear and guidance materials</p>
              </div>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Product Life Cycle">
          <div className="space-y-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Sustainability in hardware starts with durability. We focus on products that perform longer, reduce leaks and failures, and minimize repeat replacements on site.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Maintenance First</h3>
                <p className="text-muted-foreground">
                  We help customers select compatible fittings, sealants, and valves to prevent early failures and reduce water and material waste.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Recovery and Reuse</h3>
                <p className="text-muted-foreground">
                  We support take-back and recycling partnerships for selected packaging and metal offcuts where local recovery channels are available.
                </p>
              </div>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Community & Accountability">
          <div className="space-y-8">
            <p className="text-muted-foreground leading-relaxed">
              We keep sustainability practical: safer product guidance, clearer documentation, and measurable operations improvements that customers and contractors can trust.
            </p>
            
            <div className="grid md:grid-cols-4 gap-8 items-center">
              <div className="h-16 w-32 bg-muted/10 rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Supplier Audits</span>
              </div>
              <div className="h-16 w-32 bg-muted/10 rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Safety Training</span>
              </div>
              <div className="h-16 w-32 bg-muted/10 rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Waste Tracking</span>
              </div>
              <div className="h-16 w-32 bg-muted/10 rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Local Partners</span>
              </div>
            </div>
          </div>
        </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Sustainability;
