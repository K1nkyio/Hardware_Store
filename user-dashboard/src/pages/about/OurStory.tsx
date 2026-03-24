import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>

        <main className="w-full flex-1 px-4 sm:px-5 lg:pl-2 lg:pr-6">
          <PageHeader
            title="Our Story"
            subtitle="From dependable essentials to trade-ready supply for every build and repair"
          />

          <ContentSection>
            <div className="space-y-6">
              <h3 className="text-2xl font-light text-foreground">Built around everyday jobsite needs</h3>
              <p className="text-muted-foreground leading-relaxed">
                Raph Supply started with a practical goal: make reliable hardware easier to source without the usual
                confusion, stock uncertainty, and fragmented buying process. We serve trade professionals and homeowners
                who need dependable materials, clear product information, and a storefront that respects urgency.
              </p>
            </div>
          </ContentSection>

          <ContentSection title="What Drives Us">
            <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Trade-first selection</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our assortment is shaped around real work: electrical fittings, plumbing supplies, paints, cleaning
                  essentials, building materials, and safety gear that contractors, maintenance teams, and property
                  managers actually use.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Modern supply experience</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We combine the reliability of a neighborhood hardware supplier with a cleaner digital experience:
                  faster discovery, better product visibility, straightforward checkout, and support that understands
                  the realities of repair and installation work.
                </p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Our Values">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Reliability</h3>
                <p className="text-muted-foreground">
                  We focus on dependable stock, honest availability, and practical product information.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Clarity</h3>
                <p className="text-muted-foreground">
                  Buyers should be able to understand what they are purchasing without decoding vague marketing copy.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Improvement</h3>
                <p className="text-muted-foreground">
                  We keep refining the store so buying hardware feels faster, easier, and more trustworthy over time.
                </p>
              </div>
            </div>
          </ContentSection>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default OurStory;
