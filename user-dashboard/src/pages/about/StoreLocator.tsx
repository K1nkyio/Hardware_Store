import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import StoreMap from "../../components/about/StoreMap";
import { Button } from "../../components/ui/button";
import AboutSidebar from "../../components/about/AboutSidebar";

const stores = [
  {
    name: "Raph Supply Quezon City Hub",
    address: "123 Hardware Avenue, Quezon City, Metro Manila",
    phone: "+63 (2) 8555-0123",
    hours: "Mon-Sat: 8AM-6PM",
    services: ["Trade counter", "Click and collect", "Bulk pickup", "Project sourcing help"],
  },
  {
    name: "Raph Supply Makati Trade Counter",
    address: "48 Chino Roces Avenue, Makati City, Metro Manila",
    phone: "+63 (2) 8555-0175",
    hours: "Mon-Sat: 8AM-6PM",
    services: ["Walk-in purchasing", "Fast dispatch", "Tool and equipment support", "Site supply coordination"],
  },
  {
    name: "Raph Supply Pasig Fulfillment Point",
    address: "205 C. Raymundo Avenue, Pasig City, Metro Manila",
    phone: "+63 (2) 8555-0198",
    hours: "Mon-Sat: 8AM-6PM",
    services: ["Order pickup", "Scheduled delivery staging", "Repeat-order assistance", "Returns review"],
  },
];

const StoreLocator = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>

        <main className="w-full flex-1 px-4 sm:px-5 lg:pl-2 lg:pr-6">
          <PageHeader
            title="Store Locator"
            subtitle="Visit a branch, arrange pickup, or connect with a trade-support counter near you"
          />

          <ContentSection title="Store Map">
            <StoreMap />
          </ContentSection>

          <ContentSection title="Our Locations">
            <div className="grid gap-8">
              {stores.map((store) => (
                <div key={store.name} className="rounded-lg border border-border bg-background p-8">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-xl font-light text-foreground">{store.name}</h3>
                      <div className="space-y-2 text-muted-foreground">
                        <p>{store.address}</p>
                        <p>{store.phone}</p>
                        <p>{store.hours}</p>
                      </div>

                      <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                        <Button variant="outline" className="rounded-none">
                          Get Directions
                        </Button>
                        <Button className="rounded-none">Contact Branch</Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-light text-foreground">Available Services</h4>
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {store.services.map((service) => (
                          <li key={service} className="flex items-center text-sm text-muted-foreground">
                            <span className="mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></span>
                            {service}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection title="Trade Support">
            <div className="space-y-6">
              <p className="text-lg leading-relaxed text-muted-foreground">
                Need help building a material list, confirming availability, or organizing supply for a repeat job? Our
                branches can support walk-in purchases, coordinated pickup, and recurring procurement inquiries.
              </p>

              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="space-y-3">
                  <h4 className="text-lg font-light text-foreground">Project sourcing</h4>
                  <p className="text-sm text-muted-foreground">
                    Get help matching your bill of materials to available stock and practical alternatives.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-light text-foreground">Pickup coordination</h4>
                  <p className="text-sm text-muted-foreground">
                    Arrange branch pickup when you need materials ready for collection on your schedule.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-light text-foreground">Repeat purchasing</h4>
                  <p className="text-sm text-muted-foreground">
                    Simplify recurring orders for maintenance teams, property managers, and trade crews.
                  </p>
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

export default StoreLocator;
